pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("Lernwelt konnte nicht gestartet werden");
}
