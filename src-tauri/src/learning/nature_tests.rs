use super::*;

fn setup() -> (tempfile::TempDir, Connection) {
    let directory = tempfile::tempdir().unwrap();
    let connection = database::open(&directory.path().join("nature.sqlite3")).unwrap();
    database::save_profile(
        &connection,
        database::Profile {
            display_name: "Sam".to_owned(),
            grade: 5,
        },
    )
    .unwrap();
    (directory, connection)
}

#[test]
fn every_nature_question_awards_once_and_exposes_its_own_topic_metadata() {
    let (directory, mut connection) = setup();
    let exercises: Vec<_> = content::catalog()
        .unwrap()
        .exercises
        .iter()
        .filter(|e| e.subject == Subject::Nature && !e.legacy)
        .collect();
    assert!(exercises.len() >= 90);
    let mut total = 0;
    for (index, exercise) in exercises.iter().enumerate() {
        let wrong = submit_answer(
            &mut connection,
            &format!("nature-wrong-{index}"),
            &exercise.id,
            "keine passende Antwort",
        )
        .unwrap();
        assert!(!wrong.correct, "{}", exercise.id);
        assert_eq!(wrong.points_awarded, 0);
        let request = format!("nature-right-{index}");
        let correct =
            submit_answer(&mut connection, &request, &exercise.id, &exercise.answer).unwrap();
        assert!(correct.correct, "{}", exercise.id);
        assert_eq!(
            correct.points_awarded,
            points_for_difficulty(exercise.difficulty)
        );
        total += correct.points_awarded;
        let replay =
            submit_answer(&mut connection, &request, &exercise.id, &exercise.answer).unwrap();
        assert_eq!(replay.points_awarded, correct.points_awarded);
        assert_eq!(replay.wallet.balance, total);
        let repeated = submit_answer(
            &mut connection,
            &format!("nature-again-{index}"),
            &exercise.id,
            &exercise.answer,
        )
        .unwrap();
        assert_eq!(repeated.points_awarded, 0);
    }
    drop(connection);
    let mut reopened = database::open(&directory.path().join("nature.sqlite3")).unwrap();
    let state = get_state(&mut reopened).unwrap();
    assert_eq!(state.wallet.balance, total);
    assert_eq!(
        state
            .questions
            .iter()
            .filter(|q| q.subject == Subject::Nature && q.solved)
            .count(),
        exercises.len()
    );
    let progress = database::list_progress(&reopened).unwrap();
    assert!(progress.iter().all(|p| p.subject == Subject::Nature));
    assert_eq!(
        progress.iter().map(|p| p.attempts).sum::<u32>(),
        3 * exercises.len() as u32
    );
    assert_eq!(
        progress.iter().map(|p| p.correct).sum::<u32>(),
        2 * exercises.len() as u32
    );
    let serialized = serde_json::to_value(state).unwrap();
    for question in serialized["questions"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|q| q["subject"] == "nature")
    {
        assert!(question.get("answer").is_none());
        assert!(question.get("explanation").is_none());
        let topic = serialized["topics"]
            .as_array()
            .unwrap()
            .iter()
            .find(|t| t["id"] == question["topicId"])
            .unwrap();
        assert_eq!(topic["subject"], "nature");
        assert_eq!(topic["grade"], 5);
        assert!(topic["source"].as_str().unwrap().ends_with("/nt_gym"));
        assert!(!topic["curriculumVersion"].as_str().unwrap().is_empty());
    }
}

#[test]
fn nature_answers_reject_bad_inputs_and_changed_retries_without_mutation() {
    let (directory, mut connection) = setup();
    let exercise = content::catalog()
        .unwrap()
        .exercises
        .iter()
        .find(|e| e.subject == Subject::Nature)
        .unwrap();
    let mut without_profile = database::open(&directory.path().join("no-profile.sqlite3")).unwrap();
    assert!(submit_answer(
        &mut without_profile,
        "no-profile",
        &exercise.id,
        &exercise.answer
    )
    .is_err());
    assert_eq!(wallet(&without_profile).unwrap().balance, 0);
    assert!(database::list_progress(&without_profile)
        .unwrap()
        .is_empty());
    for (request, question, answer) in [
        ("", exercise.id.as_str(), exercise.answer.as_str()),
        ("invalid;", exercise.id.as_str(), exercise.answer.as_str()),
        ("unknown-question", "by.nature.5.missing.v1", "A"),
        ("empty-answer", exercise.id.as_str(), " "),
        ("control-answer", exercise.id.as_str(), "A\n"),
        ("long-answer", exercise.id.as_str(), &"A".repeat(121)),
    ] {
        assert!(submit_answer(&mut connection, request, question, answer).is_err());
    }
    assert_eq!(wallet(&connection).unwrap().balance, 0);
    assert!(database::list_progress(&connection).unwrap().is_empty());
    let correct =
        submit_answer(&mut connection, "confirmed", &exercise.id, &exercise.answer).unwrap();
    assert!(submit_answer(&mut connection, "confirmed", &exercise.id, "another answer").is_err());
    assert_eq!(wallet(&connection).unwrap().balance, correct.points_awarded);
    assert_eq!(database::list_progress(&connection).unwrap()[0].attempts, 1);
}

#[test]
fn failed_nature_receipt_rolls_back_progress_and_points() {
    let (_directory, mut connection) = setup();
    let exercise = content::catalog()
        .unwrap()
        .exercises
        .iter()
        .find(|e| e.subject == Subject::Nature)
        .unwrap();
    connection.execute_batch("CREATE TRIGGER reject_nature_receipt BEFORE INSERT ON answer_submissions BEGIN SELECT RAISE(ABORT,'test write failure'); END;").unwrap();
    assert!(submit_answer(&mut connection, "retry", &exercise.id, &exercise.answer).is_err());
    assert!(database::list_progress(&connection).unwrap().is_empty());
    assert_eq!(wallet(&connection).unwrap().balance, 0);
    connection
        .execute_batch("DROP TRIGGER reject_nature_receipt;")
        .unwrap();
    let retried = submit_answer(&mut connection, "retry", &exercise.id, &exercise.answer).unwrap();
    assert_eq!(
        retried.points_awarded,
        points_for_difficulty(exercise.difficulty)
    );
    assert_eq!(database::list_progress(&connection).unwrap()[0].attempts, 1);
}
