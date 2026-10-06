use super::*;

fn setup() -> (tempfile::TempDir, Connection) {
    let directory = tempfile::tempdir().unwrap();
    let connection = database::open(&directory.path().join("cells.sqlite3")).unwrap();
    database::save_profile(
        &connection,
        database::Profile {
            display_name: "Mila".to_owned(),
            grade: 5,
        },
    )
    .unwrap();
    (directory, connection)
}

#[test]
fn new_cells_grade_once_by_task_level_and_keep_old_solutions_after_reopen() {
    let (directory, mut connection) = setup();
    let catalog = content::catalog().unwrap();
    let old = catalog
        .exercises
        .iter()
        .find(|e| e.id == "by.nature.5.cells.4.v1")
        .unwrap();
    let first = submit_answer(&mut connection, "old-entry", &old.id, &old.answer).unwrap();
    assert_eq!(first.points_awarded, 2);
    let mut total = 2;
    for (i, e) in catalog
        .exercises
        .iter()
        .filter(|e| e.topic_id == "nature-nucleus")
        .enumerate()
    {
        // Global selection does not rewrite the task's reward or earlier receipt.
        database::set_difficulty(&connection, "streber").unwrap();
        let wrong = submit_answer(
            &mut connection,
            &format!("cell-wrong-{i}"),
            &e.id,
            "weiß ich nicht",
        )
        .unwrap();
        assert!(!wrong.correct);
        assert_eq!(wrong.points_awarded, 0);
        let id = format!("cell-right-{i}");
        let value = submit_answer(&mut connection, &id, &e.id, &e.answer).unwrap();
        assert!(value.correct);
        assert_eq!(value.points_awarded, points_for_difficulty(e.difficulty));
        total += value.points_awarded;
        let replay = submit_answer(&mut connection, &id, &e.id, &e.answer).unwrap();
        assert_eq!(replay.wallet.balance, total);
        assert!(submit_answer(&mut connection, &id, &e.id, "changed answer").is_err());
        assert!(submit_answer(&mut connection, &id, &old.id, &old.answer).is_err());
        assert_eq!(
            submit_answer(
                &mut connection,
                &format!("cell-repeat-{i}"),
                &e.id,
                &e.answer
            )
            .unwrap()
            .points_awarded,
            0
        );
    }
    database::set_difficulty(&connection, "vorschule").unwrap();
    database::save_profile(
        &connection,
        database::Profile {
            display_name: "Neuer Name".to_owned(),
            grade: 5,
        },
    )
    .unwrap();
    drop(connection);
    let mut reopened = database::open(&directory.path().join("cells.sqlite3")).unwrap();
    let state = get_state(&mut reopened).unwrap();
    assert_eq!(state.difficulty, Difficulty::Vorschule);
    assert_eq!(state.wallet.balance, total);
    assert_eq!(
        state
            .questions
            .iter()
            .filter(|q| q.topic_id == "nature-nucleus" && q.solved)
            .count(),
        18
    );
    assert!(
        state
            .questions
            .iter()
            .find(|q| q.id == old.id)
            .unwrap()
            .solved
    );
    assert_eq!(
        submit_answer(
            &mut reopened,
            "same-old-through-expedition",
            &old.id,
            &old.answer
        )
        .unwrap()
        .points_awarded,
        0
    );
    let receipt_count: i64 = reopened
        .query_row("SELECT COUNT(*) FROM answer_submissions", [], |r| r.get(0))
        .unwrap();
    assert_eq!(receipt_count, 56);
    let projection = serde_json::to_value(state).unwrap();
    for q in projection["questions"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|q| q["topicId"] == "nature-nucleus")
    {
        assert!(q.get("answer").is_none());
        assert!(q.get("explanation").is_none());
    }
}

#[test]
fn cell_reveal_is_read_only_and_errors_preserve_storage_for_identical_retry() {
    let (directory, mut connection) = setup();
    let e = content::catalog()
        .unwrap()
        .exercises
        .iter()
        .find(|e| e.topic_id == "nature-nucleus")
        .unwrap();
    assert_eq!(get_explanation(&e.id).unwrap(), e.explanation);
    assert_eq!(wallet(&connection).unwrap().balance, 0);
    assert!(database::list_progress(&connection).unwrap().is_empty());
    for invalid in [
        "",
        "unknown",
        "by.nature.5.nucleus.vorschule.01.v1\n",
        &"a".repeat(161),
    ] {
        assert!(get_explanation(invalid).is_err());
    }
    let legacy = content::catalog()
        .unwrap()
        .exercises
        .iter()
        .find(|e| e.legacy)
        .unwrap();
    assert!(get_explanation(&legacy.id).is_err());
    connection.execute_batch("CREATE TRIGGER cell_test_failure BEFORE INSERT ON answer_submissions BEGIN SELECT RAISE(ABORT,'cell test failure'); END;").unwrap();
    assert!(submit_answer(&mut connection, "same-cell-request", &e.id, &e.answer).is_err());
    assert!(database::list_progress(&connection).unwrap().is_empty());
    assert_eq!(wallet(&connection).unwrap().balance, 0);
    connection
        .execute_batch("DROP TRIGGER cell_test_failure;")
        .unwrap();
    assert_eq!(
        submit_answer(&mut connection, "same-cell-request", &e.id, &e.answer)
            .unwrap()
            .points_awarded,
        1
    );
    let mut no_profile = database::open(&directory.path().join("no-profile.sqlite3")).unwrap();
    assert!(submit_answer(&mut no_profile, "without-profile", &e.id, &e.answer).is_err());
}
