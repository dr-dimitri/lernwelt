mod arcade;
mod content;
mod database;
mod learning;
mod mission;
mod multiplication;
mod vocabulary;

use database::{Profile, Progress};
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::{Manager, State};

struct Storage(Mutex<Result<Connection, String>>);

impl Storage {
    fn with_connection<T>(
        &self,
        operation: impl FnOnce(&mut Connection) -> Result<T, String>,
    ) -> Result<T, String> {
        let mut guard = self
            .0
            .lock()
            .map_err(|_| "Die lokalen Lerndaten sind gerade nicht verfügbar.".to_owned())?;
        match guard.as_mut() {
            Ok(connection) => operation(connection),
            Err(message) => Err(message.clone()),
        }
    }
}

#[tauri::command]
fn get_profile(storage: State<'_, Storage>) -> Result<Option<Profile>, String> {
    storage.with_connection(|connection| database::get_profile(connection))
}

#[tauri::command]
fn save_profile(storage: State<'_, Storage>, profile: Profile) -> Result<Profile, String> {
    storage.with_connection(|connection| database::save_profile(connection, profile))
}

#[tauri::command]
fn list_progress(storage: State<'_, Storage>) -> Result<Vec<Progress>, String> {
    storage.with_connection(|connection| database::list_progress(connection))
}

#[tauri::command]
fn get_learning_state(storage: State<'_, Storage>) -> Result<learning::LearningState, String> {
    storage.with_connection(learning::get_state)
}

#[tauri::command]
fn set_difficulty(
    storage: State<'_, Storage>,
    difficulty: String,
) -> Result<content::Difficulty, String> {
    storage.with_connection(|connection| database::set_difficulty(connection, &difficulty))
}

#[tauri::command]
fn submit_answer(
    storage: State<'_, Storage>,
    request_id: String,
    question_id: String,
    answer: String,
) -> Result<learning::AnswerResult, String> {
    storage.with_connection(|connection| {
        learning::submit_answer(connection, &request_id, &question_id, &answer)
    })
}

#[tauri::command]
fn redeem_reward(
    storage: State<'_, Storage>,
    reward_id: String,
) -> Result<learning::Wallet, String> {
    storage.with_connection(|connection| learning::redeem_reward(connection, &reward_id))
}

#[tauri::command]
fn get_arcade_state(storage: State<'_, Storage>) -> Result<arcade::ArcadeState, String> {
    storage.with_connection(arcade::get_state)
}
#[tauri::command]
fn start_game(
    storage: State<'_, Storage>,
    session_id: String,
    game_id: String,
) -> Result<arcade::ArcadeState, String> {
    storage.with_connection(|connection| arcade::start(connection, &session_id, &game_id))
}
#[tauri::command]
fn finish_game(
    storage: State<'_, Storage>,
    session_id: String,
    score: i64,
) -> Result<arcade::ArcadeState, String> {
    storage.with_connection(|connection| arcade::finish(connection, &session_id, score))
}

#[tauri::command]
fn get_vocabulary_state(
    storage: State<'_, Storage>,
    deck_id: String,
) -> Result<vocabulary::VocabularyState, String> {
    storage.with_connection(|connection| vocabulary::get_state(connection, &deck_id))
}
#[tauri::command]
fn review_vocabulary(
    storage: State<'_, Storage>,
    input: vocabulary::ReviewInput,
) -> Result<vocabulary::ReviewResult, String> {
    storage.with_connection(|connection| vocabulary::review(connection, input))
}

#[tauri::command]
fn get_multiplication_state(
    storage: State<'_, Storage>,
    mode: Option<multiplication::Mode>,
) -> Result<multiplication::TrainerState, String> {
    storage.with_connection(|c| multiplication::get_state(c, mode))
}
#[tauri::command]
fn configure_multiplication(
    storage: State<'_, Storage>,
    input: multiplication::Configuration,
) -> Result<multiplication::TrainerState, String> {
    storage.with_connection(|c| multiplication::configure(c, input))
}
#[tauri::command]
fn answer_multiplication(
    storage: State<'_, Storage>,
    input: multiplication::AnswerInput,
) -> Result<multiplication::AnswerResult, String> {
    storage.with_connection(|c| multiplication::answer(c, input))
}

#[tauri::command]
fn get_mission_state(
    storage: State<'_, Storage>,
    topic_id: Option<String>,
) -> Result<mission::MissionState, String> {
    storage.with_connection(|c| mission::get_state(c, topic_id.as_deref()))
}
#[tauri::command]
fn start_mission(
    storage: State<'_, Storage>,
    input: mission::StartInput,
) -> Result<mission::MissionState, String> {
    storage.with_connection(|c| mission::start(c, input))
}
#[tauri::command]
fn act_mission(
    storage: State<'_, Storage>,
    input: mission::ActionInput,
) -> Result<mission::MissionState, String> {
    storage.with_connection(|c| mission::act(c, input))
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
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
            get_learning_state,
            set_difficulty,
            submit_answer,
            redeem_reward,
            get_arcade_state,
            start_game,
            finish_game,
            get_vocabulary_state,
            review_vocabulary,
            get_multiplication_state,
            answer_multiplication,
            configure_multiplication,
            get_mission_state,
            start_mission,
            act_mission
        ])
        .run(tauri::generate_context!())
        .expect("Lernwelt konnte nicht gestartet werden");
}
