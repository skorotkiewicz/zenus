fn main() {
    #[cfg(feature = "tauri-deps")]
    tauri_build::build()
}
