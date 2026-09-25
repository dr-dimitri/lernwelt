use super::*;
use rusqlite::types::Value;
use std::collections::BTreeMap;

fn schema_14(path: &Path) -> Connection {
    let connection = Connection::open(path).unwrap();
    connection
        .pragma_update(None, "foreign_keys", true)
        .unwrap();
    for migration in [
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
    ] {
        connection.execute_batch(migration).unwrap();
    }
    connection.execute_batch(
        "INSERT INTO learner_profile VALUES(1,'Bestehend',7);
         INSERT INTO learning_progress VALUES
             (1,'mathematics','historical.math',9,4,'2026-09-01 12:00:01'),
             (1,'english','historical.english',3,2,'2026-09-02 13:00:02');
         INSERT INTO point_entries(id,profile_id,kind,item_id,amount,created_at) VALUES
             (1,1,'answer','sample.english.cat.v1',10,'2026-09-01'),
             (2,1,'answer','historical.math',50,'2026-09-02'),
             (3,1,'reward','star',-20,'2026-09-03'),
             (4,1,'game','saved-game',-10,'2026-09-04'),
             (5,1,'vocabulary','saved-word',1,'2026-09-05'),
             (6,1,'multiplication','saved-table',1,'2026-09-06');
         INSERT INTO answer_submissions VALUES
             ('old-answer',1,'sample.english.cat.v1','cat',1,10,'2026-09-01');
         INSERT INTO game_sessions VALUES('saved-game',1,'maze',NULL,'2026-09-04');
         INSERT INTO vocabulary_progress VALUES(1,'saved-card','koenner',3,4,1900000000);
         INSERT INTO multiplication_worlds VALUES(1,'island',17,0,NULL,NULL);
         INSERT INTO multiplication_robots VALUES(1,'garden','amber',2);
         INSERT INTO mission_progress VALUES(1,'garden','koenner',1000,0,NULL,1000,87400,1);
         UPDATE learning_settings SET difficulty='streber';
         UPDATE multiplication_settings SET revision=4,world='island',design='garden',palette='amber',table_number=7;
         PRAGMA user_version=14;",
    ).unwrap();
    connection
}

// Compare complete stored rows, including IDs, old rewards and timestamps.
fn stored_rows(connection: &Connection) -> BTreeMap<String, Vec<Vec<Value>>> {
    let mut tables = connection.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    ).unwrap();
    tables
        .query_map([], |row| row.get::<_, String>(0))
        .unwrap()
        .map(|name| {
            let name = name.unwrap();
            let mut rows = connection
                .prepare(&format!("SELECT * FROM \"{name}\" ORDER BY rowid"))
                .unwrap();
            let columns = rows.column_count();
            let values = rows
                .query_map([], |row| {
                    (0..columns).map(|column| row.get(column)).collect()
                })
                .unwrap()
                .collect::<Result<Vec<Vec<Value>>, _>>()
                .unwrap();
            (name, values)
        })
        .collect()
}

#[test]
fn nature_migration_preserves_all_existing_rows_and_survives_reopening() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("schema14.sqlite3");
    let old = schema_14(&path);
    let before = stored_rows(&old);
    drop(old);

    let mut upgraded = open(&path).unwrap();
    assert_eq!(stored_rows(&upgraded), before);
    assert_eq!(
        upgraded
            .pragma_query_value(None, "user_version", |row| row.get::<_, i64>(0))
            .unwrap(),
        15
    );
    assert_eq!(
        get_profile(&upgraded).unwrap().unwrap(),
        Profile {
            display_name: "Bestehend".to_owned(),
            grade: 7
        }
    );
    assert_eq!(
        get_difficulty(&upgraded).unwrap(),
        crate::content::Difficulty::Streber
    );
    assert_eq!(
        crate::learning::submit_answer(&mut upgraded, "old-answer", "sample.english.cat.v1", "cat")
            .unwrap()
            .points_awarded,
        10
    );
    assert_eq!(stored_rows(&upgraded), before);
    record_attempt(&upgraded, Subject::Nature, "by.nature.5.research", false).unwrap();
    record_attempt(&upgraded, Subject::Nature, "by.nature.5.research", true).unwrap();
    let expected = stored_rows(&upgraded);
    drop(upgraded);

    let reopened = open(&path).unwrap();
    assert_eq!(stored_rows(&reopened), expected);
    let progress = list_progress(&reopened).unwrap();
    let nature = progress
        .iter()
        .find(|p| p.subject == Subject::Nature)
        .unwrap();
    assert_eq!((nature.attempts, nature.correct), (2, 1));
    assert_eq!(progress.len(), 3);
    assert_eq!(crate::learning::wallet(&reopened).unwrap().balance, 32);
    let failures: i64 = reopened
        .query_row("SELECT COUNT(*) FROM pragma_foreign_key_check", [], |r| {
            r.get(0)
        })
        .unwrap();
    assert_eq!(failures, 0);
}

#[test]
fn failed_nature_migration_keeps_schema_14_rows_and_constraints() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("schema14.sqlite3");
    let old = schema_14(&path);
    old.execute_batch("CREATE TABLE learning_progress_v15(collision TEXT);")
        .unwrap();
    let before = stored_rows(&old);
    drop(old);
    assert!(open(&path).is_err());
    let unchanged = Connection::open(&path).unwrap();
    assert_eq!(
        unchanged
            .pragma_query_value(None, "user_version", |row| row.get::<_, i64>(0))
            .unwrap(),
        14
    );
    assert_eq!(stored_rows(&unchanged), before);
    assert!(record_attempt(&unchanged, Subject::Nature, "by.nature.5.research", true).is_err());
    assert_eq!(stored_rows(&unchanged), before);
}

#[test]
fn nature_progress_rejects_invalid_competencies_subjects_and_missing_profile() {
    let mut connection = Connection::open_in_memory().unwrap();
    connection
        .pragma_update(None, "foreign_keys", true)
        .unwrap();
    migrate(&mut connection).unwrap();
    assert!(record_attempt(&connection, Subject::Nature, "research", true).is_err());
    save_profile(
        &connection,
        Profile {
            display_name: "Alex".to_owned(),
            grade: 5,
        },
    )
    .unwrap();
    for id in [
        "".to_owned(),
        "x".repeat(129),
        "research; DROP TABLE learner_profile".to_owned(),
        "research\n".to_owned(),
    ] {
        assert!(record_attempt(&connection, Subject::Nature, &id, true).is_err());
    }
    assert!(connection
        .execute(
            "INSERT INTO learning_progress VALUES(1,'unknown','test',1,1,'today')",
            []
        )
        .is_err());
    assert!(connection
        .execute(
            "INSERT INTO learning_progress VALUES(1,'nature','test',1,2,'today')",
            []
        )
        .is_err());
    assert!(list_progress(&connection).unwrap().is_empty());
    assert_eq!(serde_json::to_value(Subject::Nature).unwrap(), "nature");
    assert!(serde_json::from_str::<Subject>("\"unknown\"").is_err());
}
