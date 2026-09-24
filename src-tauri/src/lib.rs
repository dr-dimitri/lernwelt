mod database;

use database::{Profile, Progress, Subject};
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::{Manager, State};

struct Storage(Mutex<Result<Connection, String>>);

impl Storage {
    fn with_connection<T>(
        &self,
        operation: impl FnOnce(&Connection) -> Result<T, String>,
    ) -> Result<T, String> {
        let guard = self
            .0
            .lock()
            .map_err(|_| "Die lokalen Lerndaten sind gerade nicht verfügbar.".to_owned())?;
        match guard.as_ref() {
            Ok(connection) => operation(connection),
            Err(message) => Err(message.clone()),
        }
    }
}

#[tauri::command]
fn get_profile(storage: State<'_, Storage>) -> Result<Option<Profile>, String> {
    storage.with_connection(database::get_profile)
}

#[tauri::command]
fn save_profile(storage: State<'_, Storage>, profile: Profile) -> Result<Profile, String> {
    storage.with_connection(|connection| database::save_profile(connection, profile))
}

#[tauri::command]
fn list_progress(storage: State<'_, Storage>) -> Result<Vec<Progress>, String> {
    storage.with_connection(database::list_progress)
}

#[tauri::command]
fn record_attempt(
    storage: State<'_, Storage>,
    subject: Subject,
    competency_id: String,
    correct: bool,
) -> Result<(), String> {
    storage.with_connection(|connection| {
        database::record_attempt(connection, subject, &competency_id, correct)
    })
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Preserve startup failures for the UI instead of replacing/deleting user data.
            let connection = (|| {
                let directory = app
                    .path()
                    .app_data_dir()
                    .map_err(|_| "Das Datenverzeichnis ist nicht verfügbar.".to_owned())?;
                std::fs::create_dir_all(&directory)
                    .map_err(|_| "Das Datenverzeichnis konnte nicht angelegt werden.".to_owned())?;
                database::open(&directory.join("lernwelt.sqlite3"))
            })();
            app.manage(Storage(Mutex::new(connection)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_profile,
            save_profile,
            list_progress,
            record_attempt
        ])
        .run(tauri::generate_context!())
        .expect("Lernwelt konnte nicht gestartet werden");
}
