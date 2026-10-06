use super::*;
use tempfile::{tempdir, TempDir};

fn setup() -> (TempDir, Connection) {
    let directory = tempdir().unwrap();
    let connection = database::open(&directory.path().join("typing.sqlite3")).unwrap();
    database::save_profile(
        &connection,
        database::Profile {
            display_name: "Tastenfuchs".to_owned(),
            grade: 5,
        },
    )
    .unwrap();
    (directory, connection)
}

fn input(request_id: &str, task_id: &str, answer: &str) -> SubmitInput {
    SubmitInput {
        request_id: request_id.to_owned(),
        task_id: task_id.to_owned(),
        answer: answer.to_owned(),
    }
}

fn solved_task(state: &TypingState, id: &str) -> bool {
    state
        .stations
        .iter()
        .flat_map(|station| &station.tasks)
        .find(|task| task.id == id)
        .unwrap()
        .solved
}

fn row_counts(connection: &Connection) -> (i64, i64, i64) {
    connection
        .query_row(
            "SELECT (SELECT COUNT(*) FROM typing_progress), (SELECT COUNT(*) FROM typing_submissions), (SELECT COUNT(*) FROM point_entries WHERE item_id LIKE 'typing.%')",
            [],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .unwrap()
}

#[test]
fn authored_content_has_all_stations_levels_sources_and_cumulative_keys() {
    let bank = bank().unwrap();
    bank.validate().unwrap();
    assert_eq!(bank.stations.len(), 12);
    assert_eq!(
        bank.stations.iter().map(|s| s.tasks.len()).sum::<usize>(),
        108
    );
    assert_eq!(bank.subject, "fachübergreifend");
    assert_eq!(bank.version, 2);
    assert_eq!(bank.title, "Weltraumreise");
    assert_eq!(bank.target_grade, 7);
    assert!(bank.competency.contains("Zusatzfertigkeit"));
    assert!(bank.orientation.contains("kein") || bank.orientation.contains("Kein"));
    assert_eq!(bank.source_date, "2026-10-03");
    assert!(bank
        .sources
        .iter()
        .any(|source| source.url.contains("tipp10.com")));
    let mut allowed = HashSet::new();
    let mut ids = HashSet::new();
    for (station, (_, _, characters)) in bank.stations.iter().zip(STATIONS) {
        allowed.extend(characters.chars());
        if station.id == "typing.finish.v2" {
            let uppercase: String = allowed.iter().collect::<String>().to_uppercase();
            allowed.extend(uppercase.chars());
        }
        for level in LEVELS {
            assert_eq!(
                station
                    .tasks
                    .iter()
                    .filter(|t| t.difficulty == level)
                    .count(),
                3
            );
        }
        for task in &station.tasks {
            assert!(ids.insert(&task.id));
            assert!(task.id.starts_with("typing."));
            assert!((1..=120).contains(&task.text.chars().count()));
            assert!(
                task.text.chars().all(|c| allowed.contains(&c)),
                "{}",
                task.id
            );
        }
    }
}

#[test]
fn content_loader_rejects_broken_ids_levels_keys_text_and_metadata() {
    let original = bank().unwrap();
    let mut invalid = original.clone();
    invalid.stations[0].tasks[0].id = invalid.stations[0].tasks[1].id.clone();
    assert!(invalid.validate().is_err());
    invalid = original.clone();
    invalid.stations[0].tasks[0].difficulty = Difficulty::Streber;
    assert!(invalid.validate().is_err());
    invalid = original.clone();
    invalid.stations[0].new_keys.push("D".to_owned());
    assert!(invalid.validate().is_err());
    for text in ["f d", "F J", "f\nj", "", " f j", "f j "] {
        invalid = original.clone();
        invalid.stations[0].tasks[0].text = text.to_owned();
        assert!(invalid.validate().is_err(), "{text:?}");
    }
    invalid = original.clone();
    invalid.stations[0].tasks[0].text = "f".repeat(121);
    assert!(invalid.validate().is_err());
    invalid = original.clone();
    invalid.stations.remove(0);
    assert!(invalid.validate().is_err());
    invalid = original.clone();
    invalid.target_grade = 9;
    assert!(invalid.validate().is_err());
    let json = include_str!("../../content/typing-v2.json").replacen(
        "\"difficulty\": \"vorschule\"",
        "\"difficulty\": \"expert\"",
        1,
    );
    assert!(serde_json::from_str::<Bank>(&json).is_err());
}

#[test]
fn state_is_available_without_profile_but_writing_requires_one() {
    let directory = tempdir().unwrap();
    let mut connection = database::open(&directory.path().join("unregistered.sqlite3")).unwrap();
    let state = get_state(&mut connection).unwrap();
    assert!(!state.profile_ready);
    assert_eq!(state.stations.len(), 12);
    assert_eq!(state.difficulty, Difficulty::Koenner);
    assert_eq!(state.wallet.balance, 0);
    assert!(state
        .stations
        .iter()
        .flat_map(|s| &s.tasks)
        .all(|t| !t.solved));
    let task = &bank().unwrap().stations[0].tasks[3];
    let error = submit(
        &mut connection,
        input("without-profile", &task.id, &task.text),
    )
    .unwrap_err();
    assert!(error.contains("Lernprofil"));
    assert_eq!(row_counts(&connection), (0, 0, 0));
    let json = serde_json::to_value(state).unwrap();
    assert_eq!(json.as_object().unwrap().len(), 4);
    assert_eq!(
        json["stations"][0]["newKeys"],
        serde_json::json!(["F", "J", "Leertaste"])
    );
    assert!(json["stations"][0]["tasks"][0].get("solved").is_some());
}

#[test]
fn all_108_tasks_award_first_solution_points_and_keep_level_progress_after_reopen() {
    let (directory, mut connection) = setup();
    let bank = bank().unwrap();
    let mut request = 0;
    for level in LEVELS {
        database::set_difficulty(&connection, level.as_str()).unwrap();
        for task in bank
            .stations
            .iter()
            .flat_map(|s| &s.tasks)
            .filter(|t| t.difficulty == level)
        {
            request += 1;
            let result = submit(
                &mut connection,
                input(&format!("first-{request}"), &task.id, &task.text),
            )
            .unwrap();
            assert!(result.correct);
            assert_eq!(
                result.points_awarded,
                match level {
                    Difficulty::Vorschule => 1,
                    Difficulty::Koenner => 2,
                    Difficulty::Streber => 3,
                }
            );
            let repeated = submit(
                &mut connection,
                input(&format!("again-{request}"), &task.id, &task.text),
            )
            .unwrap();
            assert!(repeated.correct);
            assert_eq!(repeated.points_awarded, 0);
        }
    }
    assert_eq!(row_counts(&connection), (108, 216, 108));
    let state = get_state(&mut connection).unwrap();
    assert_eq!(state.wallet.balance, 216);
    assert_eq!(state.wallet.total_earned, 216);
    assert!(state
        .stations
        .iter()
        .flat_map(|s| &s.tasks)
        .all(|t| t.solved));
    database::save_profile(
        &connection,
        database::Profile {
            display_name: "Neuer Name".to_owned(),
            grade: 7,
        },
    )
    .unwrap();
    drop(connection);
    let mut reopened = database::open(&directory.path().join("typing.sqlite3")).unwrap();
    let state = get_state(&mut reopened).unwrap();
    assert!(state.profile_ready);
    assert_eq!(state.difficulty, Difficulty::Streber);
    assert_eq!(state.wallet.balance, 216);
    assert!(state
        .stations
        .iter()
        .flat_map(|s| &s.tasks)
        .all(|t| t.solved));
    assert_eq!(row_counts(&reopened), (108, 216, 108));
    assert!(database::list_progress(&reopened).unwrap().is_empty());
}

#[test]
fn comparison_preserves_case_spaces_and_punctuation_and_never_deducts_points() {
    let (_directory, mut connection) = setup();
    database::set_difficulty(&connection, "vorschule").unwrap();
    let task = &bank().unwrap().stations[11].tasks[2];
    for (number, wrong) in [
        task.text.to_lowercase(),
        task.text.replace(',', ""),
        task.text.replace('ß', "ss"),
        format!(" {}", task.text),
        format!("{} ", task.text),
        task.text.replace(' ', "  "),
        task.text.trim_end_matches('.').to_owned(),
    ]
    .into_iter()
    .enumerate()
    {
        let result = submit(
            &mut connection,
            input(&format!("wrong-{number}"), &task.id, &wrong),
        )
        .unwrap();
        assert!(!result.correct, "{wrong:?}");
        assert_eq!((result.points_awarded, result.wallet.balance), (0, 0));
        assert!(!solved_task(&get_state(&mut connection).unwrap(), &task.id));
    }
    let correct = submit(&mut connection, input("exact", &task.id, &task.text)).unwrap();
    assert!(correct.correct);
    assert_eq!(correct.points_awarded, 1);
    let wrong = submit(
        &mut connection,
        input("wrong-after-solved", &task.id, "anders"),
    )
    .unwrap();
    assert!(!wrong.correct);
    assert_eq!((wrong.points_awarded, wrong.wallet.balance), (0, 1));
    assert!(solved_task(&get_state(&mut connection).unwrap(), &task.id));
    let progress: (i64, i64, bool) = connection
        .query_row(
            "SELECT attempts,correct,solved FROM typing_progress WHERE task_id=?1",
            [&task.id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .unwrap();
    assert_eq!(progress, (9, 1, true));
    let sharp_s = &bank().unwrap().stations[11].tasks[0];
    assert!(
        !submit(&mut connection, input("wrong-sharp-s", &sharp_s.id, "ä ss"))
            .unwrap()
            .correct
    );
    assert!(
        submit(&mut connection, input("right-sharp-s", &sharp_s.id, "ä ß"))
            .unwrap()
            .correct
    );
}

#[test]
fn retries_do_not_duplicate_attempts_or_points_and_conflicting_ids_fail() {
    let (directory, mut connection) = setup();
    let task = &bank().unwrap().stations[0].tasks[3];
    let first = submit(&mut connection, input("reliable", &task.id, &task.text)).unwrap();
    assert_eq!(first.points_awarded, 2);
    drop(connection);
    let mut reopened = database::open(&directory.path().join("typing.sqlite3")).unwrap();
    database::set_difficulty(&reopened, "streber").unwrap();
    let replay = submit(&mut reopened, input("reliable", &task.id, &task.text)).unwrap();
    assert!(replay.correct);
    assert_eq!(replay.points_awarded, 2);
    assert_eq!(row_counts(&reopened), (1, 1, 1));
    assert!(submit(&mut reopened, input("reliable", &task.id, "different")).is_err());
    let other = &bank().unwrap().stations[0].tasks[4];
    assert!(submit(&mut reopened, input("reliable", &other.id, &other.text)).is_err());
    assert_eq!(row_counts(&reopened), (1, 1, 1));
    let attempts: i64 = reopened
        .query_row(
            "SELECT attempts FROM typing_progress WHERE task_id=?1",
            [&task.id],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(attempts, 1);
    let current = &bank().unwrap().stations[0].tasks[6];
    submit(&mut reopened, input("current", &current.id, &current.text)).unwrap();
    let replay = submit(&mut reopened, input("reliable", &task.id, &task.text)).unwrap();
    assert_eq!((replay.points_awarded, replay.wallet.balance), (2, 5));
}

#[test]
fn invalid_commands_unknown_fields_and_inactive_levels_do_not_write() {
    let (_directory, mut connection) = setup();
    let task = &bank().unwrap().stations[0].tasks[3];
    for request in [
        "".to_owned(),
        "x".repeat(81),
        "bad.id".to_owned(),
        "id\n".to_owned(),
        "ö".to_owned(),
    ] {
        assert!(submit(&mut connection, input(&request, &task.id, &task.text)).is_err());
    }
    for id in [
        "".to_owned(),
        "typing.unknown.v1".to_owned(),
        "x".repeat(129),
        "typing; DROP TABLE learner_profile".to_owned(),
    ] {
        assert!(submit(&mut connection, input("invalid-task", &id, &task.text)).is_err());
    }
    for answer in [
        "".to_owned(),
        "f".repeat(121),
        "f\nj".to_owned(),
        "f\tj".to_owned(),
        "f\u{007f}j".to_owned(),
    ] {
        assert!(submit(&mut connection, input("invalid-answer", &task.id, &answer)).is_err());
    }
    let other_level = &bank().unwrap().stations[0].tasks[0];
    assert!(submit(
        &mut connection,
        input("wrong-level", &other_level.id, &other_level.text)
    )
    .unwrap_err()
    .contains("Stufe"));
    assert!(serde_json::from_value::<SubmitInput>(
        serde_json::json!({"requestId":"a","taskId":task.id,"answer":task.text,"correct":true})
    )
    .is_err());
    assert!(serde_json::from_value::<SubmitInput>(serde_json::json!({"requestId":"a","taskId":task.id,"answer":task.text,"difficulty":"expert"})).is_err());
    assert_eq!(row_counts(&connection), (0, 0, 0));
    assert_eq!(learning::wallet(&connection).unwrap().balance, 0);
}

#[test]
fn answer_receipt_progress_and_points_roll_back_together_on_storage_failure() {
    for table in ["point_entries", "typing_submissions"] {
        let (_directory, mut connection) = setup();
        let task = &bank().unwrap().stations[0].tasks[3];
        connection.execute_batch(&format!("CREATE TRIGGER stop_typing BEFORE INSERT ON {table} BEGIN SELECT RAISE(ABORT, 'test storage failure'); END;")).unwrap();
        assert!(submit(
            &mut connection,
            input("retry-after-error", &task.id, &task.text)
        )
        .is_err());
        assert_eq!(row_counts(&connection), (0, 0, 0));
        assert_eq!(learning::wallet(&connection).unwrap().balance, 0);
        connection
            .execute_batch("DROP TRIGGER stop_typing;")
            .unwrap();
        let result = submit(
            &mut connection,
            input("retry-after-error", &task.id, &task.text),
        )
        .unwrap();
        assert_eq!((result.points_awarded, result.wallet.balance), (2, 2));
        assert_eq!(row_counts(&connection), (1, 1, 1));
    }
}

fn legacy_rows(connection: &Connection) -> Vec<Vec<Vec<rusqlite::types::Value>>> {
    [
        "SELECT * FROM typing_progress WHERE task_id LIKE '%.v1' ORDER BY task_id",
        "SELECT * FROM typing_submissions WHERE task_id LIKE '%.v1' ORDER BY request_id",
        "SELECT * FROM point_entries WHERE item_id LIKE 'typing.%.v1' ORDER BY id",
    ]
    .into_iter()
    .map(|sql| {
        let mut statement = connection.prepare(sql).unwrap();
        let columns = statement.column_count();
        statement
            .query_map([], |row| {
                (0..columns)
                    .map(|column| row.get(column))
                    .collect::<rusqlite::Result<Vec<rusqlite::types::Value>>>()
            })
            .unwrap()
            .collect::<Result<_, _>>()
            .unwrap()
    })
    .collect()
}

#[test]
fn all_legacy_solutions_transfer_without_rewriting_history_or_rewarding_again() {
    let (directory, mut connection) = setup();
    let content = content().unwrap();
    // Represent a database already written by v0.5.0, independently of the new submit path.
    let transaction = connection.transaction().unwrap();
    for task in content.legacy.stations.iter().flat_map(|s| &s.tasks) {
        let amount = match task.difficulty {
            Difficulty::Vorschule => 1,
            Difficulty::Koenner => 2,
            Difficulty::Streber => 3,
        };
        transaction
            .execute(
                "INSERT INTO typing_progress VALUES (1,?1,?2,4,1,1,'2026-10-03 10:11:12')",
                params![task.id, task.difficulty.as_str()],
            )
            .unwrap();
        transaction
            .execute(
                "INSERT INTO typing_submissions VALUES (?1,1,?2,?3,?4,1,?5,'2026-10-03 10:11:12')",
                params![
                    format!("old-{}", task.id.replace('.', "-")),
                    task.id,
                    task.difficulty.as_str(),
                    task.text,
                    amount
                ],
            )
            .unwrap();
        transaction.execute(
            "INSERT INTO point_entries (profile_id,kind,item_id,amount,created_at) VALUES (1,'answer',?1,?2,'2026-10-03 10:11:12')",
            params![task.id, amount],
        ).unwrap();
    }
    transaction.commit().unwrap();
    let before = legacy_rows(&connection);
    drop(connection);
    let mut reopened = database::open(&directory.path().join("typing.sqlite3")).unwrap();
    let state = get_state(&mut reopened).unwrap();
    assert_eq!(state.wallet.balance, 216);
    assert!(state
        .stations
        .iter()
        .flat_map(|s| &s.tasks)
        .all(|t| t.id.ends_with(".v2") && t.solved));
    assert_eq!(legacy_rows(&reopened), before);
    assert_eq!(row_counts(&reopened), (108, 108, 108));
    for level in LEVELS {
        database::set_difficulty(&reopened, level.as_str()).unwrap();
        for task in content
            .current
            .stations
            .iter()
            .flat_map(|s| &s.tasks)
            .filter(|t| t.difficulty == level)
        {
            let result = submit(
                &mut reopened,
                input(
                    &format!("new-{}", task.id.replace('.', "-")),
                    &task.id,
                    &task.text,
                ),
            )
            .unwrap();
            assert!(result.correct);
            assert_eq!((result.points_awarded, result.wallet.balance), (0, 216));
        }
    }
    assert_eq!(row_counts(&reopened), (216, 216, 108));
    let old = &content.legacy.stations[5].tasks[3];
    let current = &content.current.stations[5].tasks[3];
    assert_ne!(old.text, current.text);
    // The saved result wins even after a content, target text and level change.
    let replay = submit(
        &mut reopened,
        input(
            &format!("old-{}", old.id.replace('.', "-")),
            &old.id,
            &old.text,
        ),
    )
    .unwrap();
    assert_eq!(
        (replay.correct, replay.points_awarded, replay.wallet.balance),
        (true, 2, 216)
    );
    assert!(submit(
        &mut reopened,
        input(
            &format!("old-{}", old.id.replace('.', "-")),
            &old.id,
            &current.text
        )
    )
    .is_err());
    assert_eq!(legacy_rows(&reopened), before);
    assert_eq!(row_counts(&reopened), (216, 216, 108));
    drop(reopened);
    let mut reopened = database::open(&directory.path().join("typing.sqlite3")).unwrap();
    assert_eq!(legacy_rows(&reopened), before);
    assert!(get_state(&mut reopened)
        .unwrap()
        .stations
        .iter()
        .flat_map(|s| &s.tasks)
        .all(|t| t.solved));
    assert_eq!(
        reopened
            .pragma_query_value(None, "user_version", |r| r.get::<_, i64>(0))
            .unwrap(),
        database::SCHEMA_VERSION
    );
}

#[test]
fn old_and_new_payloads_keep_their_own_answers_and_share_only_the_matching_line() {
    let (directory, mut connection) = setup();
    let content = content().unwrap();
    let old = &content.legacy.stations[6].tasks[3];
    let current = &content.current.stations[6].tasks[3];
    assert_ne!(old.text, current.text);
    let wrong = submit(
        &mut connection,
        input("old-unsolved", &old.id, &current.text),
    )
    .unwrap();
    assert_eq!((wrong.correct, wrong.points_awarded), (false, 0));
    assert!(!solved_task(
        &get_state(&mut connection).unwrap(),
        &current.id
    ));
    // A v1 request with no previous receipt remains valid after the upgrade.
    let first = submit(
        &mut connection,
        input("old-undelivered", &old.id, &old.text),
    )
    .unwrap();
    assert_eq!((first.correct, first.points_awarded), (true, 2));
    let state = get_state(&mut connection).unwrap();
    assert!(solved_task(&state, &current.id));
    assert!(!solved_task(
        &state,
        &content.current.stations[6].tasks[4].id
    ));
    assert!(!solved_task(
        &state,
        &content.current.stations[6].tasks[0].id
    ));
    drop(connection);
    let mut reopened = database::open(&directory.path().join("typing.sqlite3")).unwrap();
    let new = submit(
        &mut reopened,
        input("new-after-old", &current.id, &current.text),
    )
    .unwrap();
    assert_eq!(
        (new.correct, new.points_awarded, new.wallet.balance),
        (true, 0, 2)
    );
    let replay = submit(&mut reopened, input("old-unsolved", &old.id, &current.text)).unwrap();
    assert_eq!(
        (replay.correct, replay.points_awarded, replay.wallet.balance),
        (false, 0, 2)
    );
    let next = &content.current.stations[6].tasks[4];
    assert_eq!(
        submit(&mut reopened, input("next-line", &next.id, &next.text))
            .unwrap()
            .points_awarded,
        2
    );
    database::set_difficulty(&reopened, "vorschule").unwrap();
    let easier = &content.current.stations[6].tasks[0];
    assert_eq!(
        submit(
            &mut reopened,
            input("other-level", &easier.id, &easier.text)
        )
        .unwrap()
        .points_awarded,
        1
    );
    assert_eq!(learning::wallet(&reopened).unwrap().balance, 5);
}

#[test]
fn current_solution_blocks_a_later_legacy_reward_and_forged_versions_do_not_write() {
    let (_directory, mut connection) = setup();
    let content = content().unwrap();
    let old = &content.legacy.stations[10].tasks[3];
    let current = &content.current.stations[10].tasks[3];
    let first = submit(
        &mut connection,
        input("new-first", &current.id, &current.text),
    )
    .unwrap();
    assert_eq!(first.points_awarded, 2);
    let before = row_counts(&connection);
    for id in [
        "typing.lower.koenner.1.v0",
        "typing.lower.koenner.1.v3",
        "typing.lower.koenner.4.v1",
        "typing.lower.unknown.1.v1",
    ] {
        assert!(submit(&mut connection, input("forged-family", id, &old.text)).is_err());
    }
    assert_eq!(row_counts(&connection), before);
    let old_with_new_text = submit(
        &mut connection,
        input("old-wrong-version-text", &old.id, &current.text),
    )
    .unwrap();
    assert_eq!(
        (old_with_new_text.correct, old_with_new_text.points_awarded),
        (false, 0)
    );
    let later = submit(&mut connection, input("old-after-new", &old.id, &old.text)).unwrap();
    assert_eq!(
        (later.correct, later.points_awarded, later.wallet.balance),
        (true, 0, 2)
    );
    assert_eq!(row_counts(&connection), (2, 3, 1));
}

#[test]
fn simultaneous_old_and_new_solutions_over_two_connections_award_only_once() {
    let (directory, connection) = setup();
    let content = content().unwrap();
    let old = &content.legacy.stations[10].tasks[3];
    let current = &content.current.stations[10].tasks[3];
    let path = directory.path().join("typing.sqlite3");
    let second = database::open(&path).unwrap();
    let barrier = std::sync::Arc::new(std::sync::Barrier::new(2));
    let handles: Vec<_> = [
        (connection, input("race-old", &old.id, &old.text)),
        (second, input("race-new", &current.id, &current.text)),
    ]
    .into_iter()
    .map(|(mut connection, input)| {
        let barrier = barrier.clone();
        std::thread::spawn(move || {
            barrier.wait();
            submit(&mut connection, input).unwrap()
        })
    })
    .collect();
    let mut awards: Vec<_> = handles
        .into_iter()
        .map(|handle| {
            let result = handle.join().unwrap();
            assert!(result.correct);
            result.points_awarded
        })
        .collect();
    awards.sort_unstable();
    assert_eq!(awards, [0, 2]);
    let mut reopened = database::open(&path).unwrap();
    assert_eq!(row_counts(&reopened), (2, 2, 1));
    let state = get_state(&mut reopened).unwrap();
    assert_eq!(state.wallet.balance, 2);
    assert!(solved_task(&state, &current.id));
}

#[test]
fn confirmed_legacy_progress_without_a_booking_gets_no_retroactive_points() {
    let (_directory, mut connection) = setup();
    let content = content().unwrap();
    let old = &content.legacy.stations[7].tasks[3];
    let current = &content.current.stations[7].tasks[3];
    connection
        .execute(
            "INSERT INTO typing_progress VALUES (1,?1,?2,1,1,1,'2026-10-03 10:11:12')",
            params![old.id, old.difficulty.as_str()],
        )
        .unwrap();
    let before = legacy_rows(&connection);
    assert!(solved_task(
        &get_state(&mut connection).unwrap(),
        &current.id
    ));
    let result = submit(
        &mut connection,
        input("confirm-existing", &current.id, &current.text),
    )
    .unwrap();
    assert_eq!(
        (result.correct, result.points_awarded, result.wallet.balance),
        (true, 0, 0)
    );
    assert_eq!(legacy_rows(&connection), before);
    assert_eq!(row_counts(&connection), (2, 1, 0));
}

fn schema_16(path: &std::path::Path) -> Connection {
    let connection = Connection::open(path).unwrap();
    connection
        .pragma_update(None, "foreign_keys", true)
        .unwrap();
    for sql in [
        include_str!("../../migrations/001_initial.sql"),
        include_str!("../../migrations/002_points.sql"),
        include_str!("../../migrations/003_difficulty.sql"),
        include_str!("../../migrations/004_arcade.sql"),
        include_str!("../../migrations/005_difficulty_points.sql"),
        include_str!("../../migrations/006_vocabulary.sql"),
        include_str!("../../migrations/007_vocabulary_points.sql"),
        include_str!("../../migrations/008_learning_points.sql"),
        include_str!("../../migrations/009_multiplication.sql"),
        include_str!("../../migrations/010_square_rounds.sql"),
        include_str!("../../migrations/011_squares_from_ten.sql"),
        include_str!("../../migrations/012_starlabyrinth.sql"),
        include_str!("../../migrations/013_missions.sql"),
        include_str!("../../migrations/014_multiplication_adventures.sql"),
        include_str!("../../migrations/015_nature.sql"),
        include_str!("../../migrations/016_geography.sql"),
    ] {
        connection.execute_batch(sql).unwrap();
    }
    database::save_profile(
        &connection,
        database::Profile {
            display_name: "Alter Lernfuchs".to_owned(),
            grade: 7,
        },
    )
    .unwrap();
    database::set_difficulty(&connection, "streber").unwrap();
    connection.execute_batch("INSERT INTO learning_progress VALUES (1,'geography','historical.solar',4,3,'2026-10-02 12:13:14');
        INSERT INTO point_entries (profile_id,kind,item_id,amount,created_at) VALUES (1,'answer','sample.english.cat.v1',10,'2026-09-01 12:13:14');
        INSERT INTO answer_submissions VALUES ('old-answer',1,'sample.english.cat.v1','cat',1,10,'2026-09-01 12:13:14');
        INSERT INTO vocabulary_progress (profile_id,card_id,difficulty,box_number,reviews,due_at) VALUES (1,'old.card','koenner',3,4,1800000000);
        PRAGMA user_version=16;").unwrap();
    connection
}

fn all_rows(connection: &Connection) -> Vec<(String, Vec<Vec<rusqlite::types::Value>>)> {
    let mut names = connection.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'typing_%' AND name NOT LIKE 'sqlite_%' ORDER BY name").unwrap();
    let tables: Vec<String> = names
        .query_map([], |row| row.get(0))
        .unwrap()
        .collect::<Result<_, _>>()
        .unwrap();
    tables
        .into_iter()
        .map(|table| {
            let mut statement = connection
                .prepare(&format!("SELECT * FROM \"{table}\" ORDER BY rowid"))
                .unwrap();
            let columns = statement.column_count();
            let rows = statement
                .query_map([], |row| {
                    (0..columns)
                        .map(|column| row.get(column))
                        .collect::<rusqlite::Result<Vec<rusqlite::types::Value>>>()
                })
                .unwrap()
                .collect::<Result<_, _>>()
                .unwrap();
            (table, rows)
        })
        .collect()
}

#[test]
fn migration_17_preserves_every_schema_16_row_and_historical_answer_replay() {
    let directory = tempdir().unwrap();
    let path = directory.path().join("upgrade.sqlite3");
    let old = schema_16(&path);
    let before = all_rows(&old);
    drop(old);
    let mut upgraded = database::open(&path).unwrap();
    assert_eq!(all_rows(&upgraded), before);
    assert_eq!(
        upgraded
            .pragma_query_value(None, "user_version", |row| row.get::<_, i64>(0))
            .unwrap(),
        database::SCHEMA_VERSION
    );
    assert_eq!(row_counts(&upgraded), (0, 0, 0));
    assert_eq!(database::get_profile(&upgraded).unwrap().unwrap().grade, 7);
    let replay =
        learning::submit_answer(&mut upgraded, "old-answer", "sample.english.cat.v1", "cat")
            .unwrap();
    assert_eq!(replay.points_awarded, 10);
    assert_eq!(all_rows(&upgraded), before);
    let task = &bank().unwrap().stations[0].tasks[6];
    submit(&mut upgraded, input("new-typing", &task.id, &task.text)).unwrap();
    drop(upgraded);
    let mut reopened = database::open(&path).unwrap();
    assert!(solved_task(&get_state(&mut reopened).unwrap(), &task.id));
    assert_eq!(learning::wallet(&reopened).unwrap().balance, 13);
    assert_eq!(
        reopened
            .query_row("SELECT COUNT(*) FROM pragma_foreign_key_check", [], |row| {
                row.get::<_, i64>(0)
            })
            .unwrap(),
        0
    );
}

#[test]
fn failed_migration_17_rolls_back_schema_and_preserves_existing_data() {
    let directory = tempdir().unwrap();
    let path = directory.path().join("collision.sqlite3");
    let old = schema_16(&path);
    old.execute_batch("CREATE TABLE typing_submissions (collision TEXT); INSERT INTO typing_submissions VALUES ('keep me');").unwrap();
    let before = all_rows(&old);
    drop(old);
    assert!(database::open(&path).is_err());
    let unchanged = Connection::open(&path).unwrap();
    assert_eq!(all_rows(&unchanged), before);
    assert_eq!(
        unchanged
            .pragma_query_value(None, "user_version", |row| row.get::<_, i64>(0))
            .unwrap(),
        16
    );
    assert_eq!(
        unchanged
            .query_row("SELECT collision FROM typing_submissions", [], |row| row
                .get::<_, String>(
                0
            ))
            .unwrap(),
        "keep me"
    );
    assert_eq!(
        unchanged
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='typing_progress'",
                [],
                |row| row.get::<_, i64>(0)
            )
            .unwrap(),
        0
    );
}
