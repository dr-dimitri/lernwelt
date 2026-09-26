use super::*;

#[test]
fn all_number_line_answers_award_by_level_and_preserve_retries_across_reopening() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("number-line.sqlite3");
    let mut connection = database::open(&path).unwrap();
    database::save_profile(
        &connection,
        database::Profile {
            display_name: "Alex".to_owned(),
            grade: 5,
        },
    )
    .unwrap();
    let exercises: Vec<_> = content::catalog()
        .unwrap()
        .exercises
        .iter()
        .filter(|e| e.topic_id == "number-line")
        .collect();
    assert_eq!(exercises.len(), 36);
    let mut total = 0;
    for (index, exercise) in exercises.iter().enumerate() {
        database::set_difficulty(
            &connection,
            if exercise.difficulty == Difficulty::Streber {
                "vorschule"
            } else {
                "streber"
            },
        )
        .unwrap();
        let wrong = submit_answer(
            &mut connection,
            &format!("wrong-{index}"),
            &exercise.id,
            "999999",
        )
        .unwrap();
        assert!(!wrong.correct);
        assert_eq!(wrong.points_awarded, 0);
        let request = format!("correct-{index}");
        let correct =
            submit_answer(&mut connection, &request, &exercise.id, &exercise.answer).unwrap();
        assert!(correct.correct);
        assert_eq!(
            correct.points_awarded,
            points_for_difficulty(exercise.difficulty)
        );
        total += correct.points_awarded;
        let replay =
            submit_answer(&mut connection, &request, &exercise.id, &exercise.answer).unwrap();
        assert_eq!(replay.points_awarded, correct.points_awarded);
        assert_eq!(replay.wallet.balance, total);
        assert!(submit_answer(&mut connection, &request, &exercise.id, "999999").is_err());
        let repeated = submit_answer(
            &mut connection,
            &format!("again-{index}"),
            &exercise.id,
            &exercise.answer,
        )
        .unwrap();
        assert_eq!(repeated.points_awarded, 0);
    }
    assert_eq!(total, 72);
    drop(connection);
    let mut reopened = database::open(&path).unwrap();
    for (index, exercise) in exercises.iter().enumerate() {
        let replay = submit_answer(
            &mut reopened,
            &format!("correct-{index}"),
            &exercise.id,
            &exercise.answer,
        )
        .unwrap();
        assert_eq!(
            replay.points_awarded,
            points_for_difficulty(exercise.difficulty)
        );
        assert_eq!(replay.wallet.balance, 72);
    }
    let progress = database::list_progress(&reopened).unwrap();
    assert_eq!(progress.iter().map(|p| p.attempts).sum::<u32>(), 108);
    assert_eq!(progress.iter().map(|p| p.correct).sum::<u32>(), 72);
    let state = get_state(&mut reopened).unwrap();
    assert_eq!(
        state
            .questions
            .iter()
            .filter(|q| q.topic_id == "number-line" && q.solved)
            .count(),
        36
    );
}

#[test]
fn question_ipc_exposes_only_diagram_data_without_answer_keys() {
    let mut connection = database::open(std::path::Path::new(":memory:")).unwrap();
    let state = serde_json::to_value(get_state(&mut connection).unwrap()).unwrap();
    let questions = state["questions"].as_array().unwrap();
    let diagrams: Vec<_> = questions
        .iter()
        .filter(|q| q["topicId"] == "number-line")
        .collect();
    assert_eq!(diagrams.len(), 36);
    for question in diagrams {
        assert!(question.get("answer").is_none());
        assert!(question.get("explanation").is_none());
        let diagram = question["numberLine"].as_object().unwrap();
        assert_eq!(diagram.len(), 7);
        for key in ["kind", "mode", "min", "max", "step", "labels", "markers"] {
            assert!(diagram.contains_key(key));
        }
        if diagram["mode"] == "place" {
            assert!(diagram["markers"].as_array().unwrap().is_empty());
        }
    }
    assert!(questions
        .iter()
        .filter(|q| q["topicId"] != "number-line")
        .all(|q| q.get("numberLine").is_none()));
}
