use super::*;

#[test]
fn hints_never_book_points_and_wrong_answer_feedback_survives_retries_and_reopening() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("help.sqlite3");
    let mut connection = database::open(&path).unwrap();
    database::save_profile(
        &connection,
        database::Profile {
            display_name: "Alex".into(),
            grade: 5,
        },
    )
    .unwrap();
    let cases = [
        ("by.math.5.area.perimeter.koenner.v1", "24,0", "22", 2),
        ("by.english.5.past.6.v1", " SAW ", "see", 2),
        (
            "by.nature.5.water.9.v1",
            "Jedes Wasserteilchen wird zu einem riesigen Ball.",
            "Die Abstände zwischen den Wasserteilchen werden größer.",
            3,
        ),
    ];
    let mut total = 0;
    for (index, (id, wrong, right, points)) in cases.iter().enumerate() {
        let state = serde_json::to_value(get_state(&mut connection).unwrap()).unwrap();
        let question = state["questions"]
            .as_array()
            .unwrap()
            .iter()
            .find(|q| q["id"] == *id)
            .unwrap();
        assert!(!question["furtherHints"].as_array().unwrap().is_empty());
        for secret in ["answer", "explanation", "commonMistakes"] {
            assert!(question.get(secret).is_none(), "{secret}");
        }
        assert_eq!(wallet(&connection).unwrap().balance, total);
        let result = submit_answer(&mut connection, &format!("wrong-{index}"), id, wrong).unwrap();
        assert!(!result.correct);
        assert_eq!(result.points_awarded, 0);
        assert!(result.mistake_hint.is_some());
        let replay = submit_answer(&mut connection, &format!("wrong-{index}"), id, wrong).unwrap();
        assert_eq!(result.mistake_hint, replay.mistake_hint);
        assert_eq!(replay.wallet.balance, total);
        let result = submit_answer(&mut connection, &format!("right-{index}"), id, right).unwrap();
        assert!(result.correct);
        assert!(result.mistake_hint.is_none());
        assert_eq!(result.points_awarded, *points);
        total += points;
        assert_eq!(result.wallet.balance, total);
        let repeat = submit_answer(&mut connection, &format!("repeat-{index}"), id, right).unwrap();
        assert_eq!(repeat.points_awarded, 0);
    }
    drop(connection);
    let mut reopened = database::open(&path).unwrap();
    for (index, (id, wrong, right, points)) in cases.iter().enumerate() {
        let replay = submit_answer(&mut reopened, &format!("wrong-{index}"), id, wrong).unwrap();
        assert!(!replay.correct);
        assert!(replay.mistake_hint.is_some());
        let replay = submit_answer(&mut reopened, &format!("right-{index}"), id, right).unwrap();
        assert_eq!(replay.points_awarded, *points);
        assert_eq!(replay.wallet.balance, total);
    }
    let progress = database::list_progress(&reopened).unwrap();
    assert_eq!(progress.iter().map(|p| p.attempts).sum::<u32>(), 9);
    assert_eq!(progress.iter().map(|p| p.correct).sum::<u32>(), 6);
}
