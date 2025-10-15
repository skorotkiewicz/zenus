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
fn save_notes(notes: Vec<NoteBlock>) -> Result<(), String> {
    let app_dir = dirs::data_dir().ok_or("Could not get data directory")?;
    let notes_dir = app_dir.join("zenus");
    fs::create_dir_all(&notes_dir).map_err(|e| format!("Failed to create directory: {}", e))?;
    
    let notes_file = notes_dir.join("notes.json");
    let json = serde_json::to_string_pretty(&notes).map_err(|e| format!("Failed to serialize notes: {}", e))?;
    
    fs::write(&notes_file, json).map_err(|e| format!("Failed to write notes: {}", e))?;
    Ok(())
}

#[tauri::command]
fn load_notes() -> Result<Vec<NoteBlock>, String> {
    let app_dir = dirs::data_dir().ok_or("Could not get data directory")?;
    let notes_file = app_dir.join("zenus").join("notes.json");
    
    if !notes_file.exists() {
        return Ok(vec![]);
    }
    
    let content = fs::read_to_string(&notes_file).map_err(|e| format!("Failed to read notes: {}", e))?;
    let notes: Vec<NoteBlock> = serde_json::from_str(&content).map_err(|e| format!("Failed to parse notes: {}", e))?;
    
    Ok(notes)
}

#[tauri::command]
fn delete_block(notes: Vec<NoteBlock>, block_id: String) -> Result<Vec<NoteBlock>, String> {
    let filtered_notes: Vec<NoteBlock> = notes.into_iter()
        .filter(|note| note.id != block_id)
        .collect();
    
    // Save the updated notes to file
    let app_dir = dirs::data_dir().ok_or("Could not get data directory")?;
    let notes_dir = app_dir.join("zenus");
    fs::create_dir_all(&notes_dir).map_err(|e| format!("Failed to create directory: {}", e))?;
    
    let notes_file = notes_dir.join("notes.json");
    let json = serde_json::to_string_pretty(&filtered_notes).map_err(|e| format!("Failed to serialize notes: {}", e))?;
    
    fs::write(&notes_file, json).map_err(|e| format!("Failed to write notes: {}", e))?;
    
    Ok(filtered_notes)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, save_notes, load_notes, delete_block])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
