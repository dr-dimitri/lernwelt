fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "get_profile",
            "save_profile",
            "list_progress",
            "get_learning_state",
            "set_difficulty",
            "submit_answer",
            "redeem_reward",
            "get_arcade_state",
            "start_game",
            "finish_game",
            "get_vocabulary_state",
            "review_vocabulary",
        ]),
    ))
    .expect("Tauri build configuration failed");
}
