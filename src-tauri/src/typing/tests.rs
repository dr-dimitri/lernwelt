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
    assert_eq!(bank.target_grade, 5);
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
        if station.id == "typing.finish.v1" {
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
    let json = include_str!("../../content/typing-v1.json").replacen(
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
        "blätter, Blüten.",
        "Blätter Blüten.",
        "Blaetter, Blueten.",
        " Blätter, Blüten.",
        "Blätter, Blüten. ",
        "Blätter,  Blüten.",
        "Blätter, Blüten",
    ]
    .into_iter()
    .enumerate()
    {
        let result = submit(
            &mut connection,
            input(&format!("wrong-{number}"), &task.id, wrong),
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
        17
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
