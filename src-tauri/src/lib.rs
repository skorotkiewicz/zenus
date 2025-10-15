use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Serialize, Deserialize, Clone)]
struct NoteBlock {
    id: String,
    title: String,
    content: String,
    #[serde(rename = "isCollapsed")]
    is_collapsed: bool,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn save_block(block: NoteBlock) -> Result<(), String> {
    let app_dir = dirs::data_dir().ok_or("Could not get data directory")?;
    let notes_dir = app_dir.join("zenus");
    fs::create_dir_all(&notes_dir).map_err(|e| format!("Failed to create directory: {}", e))?;
    
    let file_path = notes_dir.join(format!("{}.md", block.id));
    let content = format!("# {}\n\n{}", block.title, block.content);
    
    fs::write(&file_path, content).map_err(|e| format!("Failed to write block: {}", e))?;
    Ok(())
}

#[tauri::command]
fn load_notes() -> Result<Vec<NoteBlock>, String> {
    let app_dir = dirs::data_dir().ok_or("Could not get data directory")?;
    let notes_dir = app_dir.join("zenus");
    
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
            let title = if lines.len() > 0 && lines[0].starts_with("# ") {
                lines[0][2..].to_string()
            } else {
                "Untitled".to_string()
            };
            
            let block_content = if lines.len() > 2 {
                lines[2..].join("\n")
            } else {
                String::new()
            };
            
            blocks.push(NoteBlock {
                id,
                title,
                content: block_content,
                is_collapsed: false,
            });
        }
    }
    
    // Sort by ID (which contains timestamp)
    blocks.sort_by(|a, b| a.id.cmp(&b.id));
    
    Ok(blocks)
}

#[tauri::command]
fn delete_block(block_id: String) -> Result<(), String> {
    let app_dir = dirs::data_dir().ok_or("Could not get data directory")?;
    let notes_dir = app_dir.join("zenus");
    let file_path = notes_dir.join(format!("{}.md", block_id));
    
    if file_path.exists() {
        fs::remove_file(&file_path).map_err(|e| format!("Failed to delete file: {}", e))?;
    }
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, save_block, load_notes, delete_block])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
