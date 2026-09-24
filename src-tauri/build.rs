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
            "get_multiplication_state",
            "answer_multiplication",
            "get_mission_state",
            "start_mission",
            "act_mission",
        ]),
    ))
    .expect("Tauri build configuration failed");
}
