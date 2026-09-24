fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "get_profile",
            "save_profile",
            "list_progress",
            "get_learning_state",
            "submit_answer",
            "redeem_reward",
        ]),
    ))
    .expect("Tauri build configuration failed");
}
