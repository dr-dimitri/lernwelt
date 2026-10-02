use super::*;

#[test]
fn new_topic_answers_persist_and_keep_old_points_and_request_receipts() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("practice.sqlite3");
    let mut connection = database::open(&path).unwrap();
    database::save_profile(
        &connection,
        database::Profile {
            display_name: "Sam".into(),
            grade: 5,
        },
    )
    .unwrap();
    let old = submit_answer(
        &mut connection,
        "old-request",
        "by.math.5.units.length.koenner.v1",
        "2350",
    )
    .unwrap();
    assert_eq!(old.points_awarded, 2);
    let ids = [
        ("by.mathematics.5.focus.length.koenner.02.v1", "1600", 2),
        ("by.english.5.focus.present.vorschule.06.v1", "studies", 1),
        (
            "by.nature.5.focus.research.streber.11.v1",
            "Wasser und Licht unterscheiden sich gleichzeitig.",
            3,
        ),
    ];
    for (i, (id, answer, points)) in ids.iter().enumerate() {
        let result = submit_answer(&mut connection, &format!("new-{i}"), id, answer).unwrap();
        assert!(result.correct);
        assert_eq!(result.points_awarded, *points);
    }
    drop(connection);
    let mut connection = database::open(&path).unwrap();
    for (i, (id, answer, _)) in ids.iter().enumerate() {
        let replay = submit_answer(&mut connection, &format!("new-{i}"), id, answer).unwrap();
        assert_eq!(replay.wallet.balance, 8);
        assert!(submit_answer(&mut connection, &format!("new-{i}"), id, "changed").is_err());
        assert_eq!(
            submit_answer(&mut connection, &format!("again-{i}"), id, answer)
                .unwrap()
                .points_awarded,
            0
        );
    }
    assert_eq!(
        submit_answer(
            &mut connection,
            "old-request",
            "by.math.5.units.length.koenner.v1",
            "2350"
        )
        .unwrap()
        .wallet
        .balance,
        8
    );
    let state = get_state(&mut connection).unwrap();
    assert_eq!(state.questions.iter().filter(|q| q.solved).count(), 4);
    assert_eq!(state.study_catalog.units.len(), 87);
    let public = serde_json::to_value(state).unwrap();
    for question in public["questions"].as_array().unwrap() {
        assert!(question.get("answer").is_none());
        assert!(question.get("explanation").is_none());
    }
}
