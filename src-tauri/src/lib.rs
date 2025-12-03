use serde::{Deserialize, Serialize};
use std::fs;
#[cfg(feature = "tauri-deps")]
use tauri::State;
use clap::Parser;
use axum::{
    routing::{get, post, delete},
    Router, Json, extract::{Path, State as AxumState},
    http::{StatusCode, HeaderMap},
    response::IntoResponse,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

#[derive(Parser, Debug, Clone)]
#[command(version, about, long_about = None)]
struct Args {
    /// Host to bind the server to (Server Mode)
    #[arg(long)]
    host: Option<String>,

    /// Port to bind/connect to
    #[arg(long, default_value_t = 8888)]
    port: u16,

    /// URL of the Zenus server (Client Mode)
    #[arg(long)]
    url: Option<String>,

    /// Authentication token/password
    #[arg(long)]
    auth: Option<String>,

    /// Custom path for notes directory
    #[arg(long)]
    path: Option<String>,
}

struct AppState {
    api_url: Option<String>,
    auth_token: Option<String>,
    client: reqwest::Client,
    local_path: Option<std::path::PathBuf>,
}

#[derive(Clone)]
pub struct ServerState {
    pub auth_token: Option<String>,
    pub local_path: Option<std::path::PathBuf>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct NoteBlock {
    id: String,
    title: String,
    content: String,
    #[serde(rename = "isCollapsed")]
    is_collapsed: bool,
    #[serde(default)]
    order: i32,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[cfg(feature = "tauri-deps")]
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg(feature = "tauri-deps")]
#[tauri::command]
async fn save_block(state: State<'_, AppState>, block: NoteBlock) -> Result<(), String> {
    if let Some(api_url) = &state.api_url {
        // Client Mode: Send to server
        let url = format!("{}/notes", api_url);
        let mut request = state.client.post(&url).json(&block);
        
        if let Some(token) = &state.auth_token {
            request = request.header("Authorization", token);
        }

        request.send().await
            .map_err(|e| format!("Failed to send request: {}", e))?
            .error_for_status()
            .map_err(|e| format!("Server error: {}", e))?;
            
        Ok(())
    } else {
        // Local Mode: Save to disk
        save_block_local(block, state.local_path.as_deref())
    }
}

pub fn save_block_local(block: NoteBlock, custom_path: Option<&std::path::Path>) -> Result<(), String> {
    let notes_dir = if let Some(p) = custom_path {
        p.to_path_buf()
    } else {
        let app_dir = dirs::data_dir().ok_or("Could not get data directory")?;
        app_dir.join("zenus")
    };
    let archive_dir = notes_dir.join("archive");
    fs::create_dir_all(&notes_dir).map_err(|e| format!("Failed to create directory: {}", e))?;
    
    // Check if the note exists in archive, if so, save it there //###//
    let archive_file_path = archive_dir.join(format!("{}.md", block.id));
    let file_path = if archive_file_path.exists() {
        archive_file_path
    } else {
        notes_dir.join(format!("{}.md", block.id))
    };
    
    // Save metadata as JSON comment at the top
    let metadata = serde_json::to_string(&serde_json::json!({
        "title": block.title,
        "isCollapsed": block.is_collapsed,
        "order": block.order,
        "createdAt": chrono::Utc::now().to_rfc3339(),
        "updatedAt": chrono::Utc::now().to_rfc3339()
    })).map_err(|e| format!("Failed to serialize metadata: {}", e))?;
    
    let content = format!("<!-- {} -->\n\n{}", metadata, block.content);
    
    fs::write(&file_path, content).map_err(|e| format!("Failed to write block: {}", e))?;
    Ok(())
}

#[cfg(feature = "tauri-deps")]
#[tauri::command]
async fn load_notes(state: State<'_, AppState>, subdir: Option<String>) -> Result<Vec<NoteBlock>, String> {
    if let Some(api_url) = &state.api_url {
        // Client Mode: Fetch from server
        let url = if let Some(sub) = &subdir {
            if sub == "archive" {
                format!("{}/notes/archive", api_url)
            } else {
                format!("{}/notes", api_url)
            }
        } else {
            format!("{}/notes", api_url)
        };

        let mut request = state.client.get(&url);
        
        if let Some(token) = &state.auth_token {
            request = request.header("Authorization", token);
        }

        let blocks = request.send().await
            .map_err(|e| format!("Failed to send request: {}", e))?
            .error_for_status()
            .map_err(|e| format!("Server error: {}", e))?
            .json::<Vec<NoteBlock>>().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;
            
        Ok(blocks)
    } else {
        // Local Mode: Read from disk
        load_notes_local(subdir.as_deref(), state.local_path.as_deref())
    }
}

pub fn load_notes_local(subdir: Option<&str>, custom_path: Option<&std::path::Path>) -> Result<Vec<NoteBlock>, String> {
    let mut notes_dir = if let Some(p) = custom_path {
        p.to_path_buf()
    } else {
        let app_dir = dirs::data_dir().ok_or("Could not get data directory")?;
        app_dir.join("zenus")
    };
    
    if let Some(sub) = subdir {
        notes_dir = notes_dir.join(sub);
    }
    
    if !notes_dir.exists() {
        return Ok(vec![]);
    }
    
    let mut blocks = Vec::new();
    
    for entry in fs::read_dir(&notes_dir).map_err(|e| format!("Failed to read directory: {}", e))? {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        
        if path.extension().and_then(|s| s.to_str()) == Some("md") {
            let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))?;
            
            // Extract ID from filename (remove .md extension)
            let id = path.file_stem()
                .and_then(|s| s.to_str())
                .ok_or("Invalid filename")?
                .to_string();
            
            // Parse markdown content
            let lines: Vec<&str> = content.lines().collect();
            
            // Check for metadata comment at the top
            let mut is_collapsed = false;
            let mut title = "Untitled".to_string();
            let mut order = 0;
            let mut content_start = 0;
            
            if lines.len() > 0 && lines[0].starts_with("<!-- ") && lines[0].ends_with(" -->") {
                // Extract metadata from comment
                let metadata_str = &lines[0][5..lines[0].len()-4]; // Remove <!-- and -->
                if let Ok(metadata) = serde_json::from_str::<serde_json::Value>(metadata_str) {
                    if let Some(collapsed) = metadata.get("isCollapsed").and_then(|v| v.as_bool()) {
                        is_collapsed = collapsed;
                    }
                    if let Some(title_str) = metadata.get("title").and_then(|v| v.as_str()) {
                        title = title_str.to_string();
                    }
                    if let Some(order_val) = metadata.get("order").and_then(|v| v.as_i64()) {
                        order = order_val as i32;
                    }
                }
                content_start = 1; // Skip metadata line
            }
            
            // Fallback: try to read title from markdown header if no metadata
            if title == "Untitled" && lines.len() > content_start && lines[content_start].starts_with("# ") {
                title = lines[content_start][2..].to_string();
            }
            
            let block_content = if lines.len() > content_start + 1 {
                lines[content_start + 1..].join("\n")
            } else {
                String::new()
            };
            
            blocks.push(NoteBlock {
                id,
                title,
                content: block_content,
                is_collapsed,
                order,
            });
        }
    }
    
    // Sort by order, then by ID
    blocks.sort_by(|a, b| {
        match a.order.cmp(&b.order) {
            std::cmp::Ordering::Equal => a.id.cmp(&b.id),
            other => other,
        }
    });
    
    Ok(blocks)
}

#[cfg(feature = "tauri-deps")]
#[tauri::command]
async fn delete_block(state: State<'_, AppState>, block_id: String, subdir: Option<String>) -> Result<(), String> {
    if let Some(api_url) = &state.api_url {
        // Client Mode: Delete on server
        let url = if let Some(sub) = &subdir {
            if sub == "archive" {
                format!("{}/notes/{}/archive", api_url, block_id)
            } else {
                format!("{}/notes/{}", api_url, block_id)
            }
        } else {
            format!("{}/notes/{}", api_url, block_id)
        };

        let mut request = state.client.delete(&url);
        
        if let Some(token) = &state.auth_token {
            request = request.header("Authorization", token);
        }

        request.send().await
            .map_err(|e| format!("Failed to send request: {}", e))?
            .error_for_status()
            .map_err(|e| format!("Server error: {}", e))?;
            
        Ok(())
    } else {
        // Local Mode: Delete from disk
        delete_block_local(block_id, subdir.as_deref(), state.local_path.as_deref())
    }
}

pub fn delete_block_local(block_id: String, subdir: Option<&str>, custom_path: Option<&std::path::Path>) -> Result<(), String> {
    let mut notes_dir = if let Some(p) = custom_path {
        p.to_path_buf()
    } else {
        let app_dir = dirs::data_dir().ok_or("Could not get data directory")?;
        app_dir.join("zenus")
    };
    
    if let Some(sub) = subdir {
        notes_dir = notes_dir.join(sub);
    }
    
    let file_path = notes_dir.join(format!("{}.md", block_id));
    
    if file_path.exists() {
        fs::remove_file(&file_path).map_err(|e| format!("Failed to delete file: {}", e))?;
    }
    
    Ok(())
}

#[cfg(feature = "tauri-deps")]
#[tauri::command]
async fn update_orders(state: State<'_, AppState>, orders: Vec<(String, i32)>) -> Result<(), String> {
    if let Some(api_url) = &state.api_url {
        // Client Mode: Update on server
        let url = format!("{}/notes/reorder", api_url);
        let mut request = state.client.post(&url).json(&orders);
        
        if let Some(token) = &state.auth_token {
            request = request.header("Authorization", token);
        }

        request.send().await
            .map_err(|e| format!("Failed to send request: {}", e))?
            .error_for_status()
            .map_err(|e| format!("Server error: {}", e))?;
            
        Ok(())
    } else {
        // Local Mode: Update on disk
        update_orders_local(orders, state.local_path.as_deref())
    }
}

pub fn update_orders_local(orders: Vec<(String, i32)>, custom_path: Option<&std::path::Path>) -> Result<(), String> {
    let notes_dir = if let Some(p) = custom_path {
        p.to_path_buf()
    } else {
        let app_dir = dirs::data_dir().ok_or("Could not get data directory")?;
        app_dir.join("zenus")
    };
    let archive_dir = notes_dir.join("archive");
    
    for (id, order) in orders {
        // Check if the note exists in archive, if so, update it there //###//
        let archive_file_path = archive_dir.join(format!("{}.md", id));
        let file_path = if archive_file_path.exists() {
            archive_file_path
        } else {
            notes_dir.join(format!("{}.md", id))
        };
        
        if file_path.exists() {
            let content = fs::read_to_string(&file_path).map_err(|e| format!("Failed to read file: {}", e))?;
            let lines: Vec<&str> = content.lines().collect();
            
            if lines.len() > 0 && lines[0].starts_with("<!-- ") && lines[0].ends_with(" -->") {
                let metadata_str = &lines[0][5..lines[0].len()-4];
                if let Ok(mut metadata) = serde_json::from_str::<serde_json::Value>(metadata_str) {
                    // Update order in metadata
                    if let Some(obj) = metadata.as_object_mut() {
                        obj.insert("order".to_string(), serde_json::json!(order));
                        obj.insert("updatedAt".to_string(), serde_json::json!(chrono::Utc::now().to_rfc3339()));
                    }
                    
                    // Reconstruct file content
                    let new_metadata = serde_json::to_string(&metadata).map_err(|e| format!("Failed to serialize metadata: {}", e))?;
                    let body = if lines.len() > 1 { lines[1..].join("\n") } else { String::new() };
                    let new_content = format!("<!-- {} -->\n{}", new_metadata, body);
                    
                    fs::write(&file_path, new_content).map_err(|e| format!("Failed to write file: {}", e))?;
                }
            }
        }
    }
    Ok(())
}


#[cfg(feature = "tauri-deps")]
#[tauri::command]
async fn archive_block(state: State<'_, AppState>, block_id: String) -> Result<(), String> {
    if let Some(api_url) = &state.api_url {
        // Client Mode: Archive on server
        let url = format!("{}/notes/{}/archive", api_url, block_id);
        let mut request = state.client.post(&url);
        
        if let Some(token) = &state.auth_token {
            request = request.header("Authorization", token);
        }

        request.send().await
            .map_err(|e| format!("Failed to send request: {}", e))?
            .error_for_status()
            .map_err(|e| format!("Server error: {}", e))?;
            
        Ok(())
    } else {
        // Local Mode: Move to archive folder
        archive_block_local(block_id, state.local_path.as_deref())
    }
}

pub fn archive_block_local(block_id: String, custom_path: Option<&std::path::Path>) -> Result<(), String> {
    let notes_dir = if let Some(p) = custom_path {
        p.to_path_buf()
    } else {
        let app_dir = dirs::data_dir().ok_or("Could not get data directory")?;
        app_dir.join("zenus")
    };
    let archive_dir = notes_dir.join("archive");
    
    fs::create_dir_all(&archive_dir).map_err(|e| format!("Failed to create archive directory: {}", e))?;
    
    let src_path = notes_dir.join(format!("{}.md", block_id));
    let dest_path = archive_dir.join(format!("{}.md", block_id));
    
    if src_path.exists() {
        fs::rename(&src_path, &dest_path).map_err(|e| format!("Failed to archive file: {}", e))?;
    } else {
        return Err("File not found".to_string());
    }
    
    Ok(())
}

#[cfg(feature = "tauri-deps")]
#[tauri::command]
async fn unarchive_block(state: State<'_, AppState>, block_id: String) -> Result<(), String> {
    if let Some(api_url) = &state.api_url {
        // Client Mode: Unarchive on server
        let url = format!("{}/notes/{}/unarchive", api_url, block_id);
        let mut request = state.client.post(&url);
        
        if let Some(token) = &state.auth_token {
            request = request.header("Authorization", token);
        }

        request.send().await
            .map_err(|e| format!("Failed to send request: {}", e))?
            .error_for_status()
            .map_err(|e| format!("Server error: {}", e))?;
            
        Ok(())
    } else {
        unarchive_block_local(block_id, state.local_path.as_deref())
    }
}

pub fn unarchive_block_local(block_id: String, custom_path: Option<&std::path::Path>) -> Result<(), String> {
    let notes_dir = if let Some(p) = custom_path {
        p.to_path_buf()
    } else {
        let app_dir = dirs::data_dir().ok_or("Could not get data directory")?;
        app_dir.join("zenus")
    };
    let archive_dir = notes_dir.join("archive");
    
    let src_path = archive_dir.join(format!("{}.md", block_id));
    let dest_path = notes_dir.join(format!("{}.md", block_id));
    
    if src_path.exists() {
        fs::rename(&src_path, &dest_path).map_err(|e| format!("Failed to unarchive file: {}", e))?;
    } else {
        return Err("Archived file not found".to_string());
    }
    
    Ok(())
}

// Server implementation
pub async fn run_server(host: String, port: u16, auth_token: Option<String>, local_path: Option<String>) {
    println!("Starting Zenus Server on {}:{}", host, port);
    if auth_token.is_some() {
        println!("Authentication enabled");
    }
    if let Some(path) = &local_path {
        println!("Using custom notes directory: {}", path);
    }

    // Middleware to check auth
    async fn auth_middleware(
        AxumState(state): AxumState<ServerState>,
        headers: HeaderMap,
        request: axum::extract::Request,
        next: axum::middleware::Next,
    ) -> Result<impl IntoResponse, StatusCode> {
        if let Some(token) = &state.auth_token {
            let auth_header = headers.get("Authorization")
                .and_then(|h| h.to_str().ok());
            
            if auth_header != Some(token) {
                return Err(StatusCode::UNAUTHORIZED);
            }
        }
        Ok(next.run(request).await)
    }

    let app = Router::new()
        .route("/notes", get(api_get_notes).post(api_save_note))
        .route("/notes/archive", get(api_get_archived_notes))
        .route("/notes/:id", delete(api_delete_note))
        .route("/notes/:id/archive", post(api_archive_note).delete(api_delete_archived_note))
        .route("/notes/:id/unarchive", post(api_unarchive_note))
        .route("/notes/reorder", post(api_reorder_notes))
        .layer(CorsLayer::permissive())
        .layer(axum::middleware::from_fn_with_state(
            ServerState { 
                auth_token: auth_token.clone(),
                local_path: local_path.clone().map(std::path::PathBuf::from),
            },
            auth_middleware
        ))
        .with_state(ServerState { 
            auth_token,
            local_path: local_path.map(std::path::PathBuf::from),
        });

    let addr: SocketAddr = format!("{}:{}", host, port).parse().expect("Invalid address");
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// API Handlers
async fn api_get_notes(AxumState(state): AxumState<ServerState>) -> Json<Vec<NoteBlock>> {
    match load_notes_local(None, state.local_path.as_deref()) {
        Ok(notes) => Json(notes),
        Err(_) => Json(vec![]),
    }
}

async fn api_save_note(
    AxumState(state): AxumState<ServerState>,
    Json(block): Json<NoteBlock>
) -> StatusCode {
    match save_block_local(block, state.local_path.as_deref()) {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

async fn api_delete_note(
    AxumState(state): AxumState<ServerState>,
    Path(id): Path<String>
) -> StatusCode {
    match delete_block_local(id, None, state.local_path.as_deref()) {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

async fn api_delete_archived_note(
    AxumState(state): AxumState<ServerState>,
    Path(id): Path<String>
) -> StatusCode {
    match delete_block_local(id, Some("archive"), state.local_path.as_deref()) {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

async fn api_reorder_notes(
    AxumState(state): AxumState<ServerState>,
    Json(orders): Json<Vec<(String, i32)>>
) -> StatusCode {
    match update_orders_local(orders, state.local_path.as_deref()) {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

async fn api_get_archived_notes(AxumState(state): AxumState<ServerState>) -> Json<Vec<NoteBlock>> {
    match load_notes_local(Some("archive"), state.local_path.as_deref()) {
        Ok(notes) => Json(notes),
        Err(_) => Json(vec![]),
    }
}

async fn api_archive_note(
    AxumState(state): AxumState<ServerState>,
    Path(id): Path<String>
) -> StatusCode {
    match archive_block_local(id, state.local_path.as_deref()) {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

async fn api_unarchive_note(
    AxumState(state): AxumState<ServerState>,
    Path(id): Path<String>
) -> StatusCode {
    match unarchive_block_local(id, state.local_path.as_deref()) {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

#[cfg(feature = "tauri-deps")]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let args = Args::parse();

    // Validation: Cannot have both host (Server) and url (Client)
    if args.host.is_some() && args.url.is_some() {
        eprintln!("Error: Cannot run in both Server Mode (--host) and Client Mode (--url) at the same time.");
        std::process::exit(1);
    }

    // Validation: Cannot have both url (Client) and path (Local)
    if args.url.is_some() && args.path.is_some() {
        eprintln!("Error: Cannot run in both Client Mode (--url) and Local Mode (--path) at the same time.");
        std::process::exit(1);
    }

    // Server Mode
    if let Some(host) = args.host {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(run_server(host, args.port, args.auth, args.path));
        return;
    }

    // Client/Local Mode
    let app_state = AppState {
        api_url: args.url,
        auth_token: args.auth,
        client: reqwest::Client::new(),
        local_path: args.path.map(std::path::PathBuf::from),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![greet, save_block, load_notes, delete_block, update_orders, archive_block, unarchive_block])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
