use super::nature_tests::{assert_preserved_rows, schema_14, stored_rows};
use super::*;

fn schema_15(path: &Path) -> Connection {
    let connection = schema_14(path);
    connection
        .execute_batch(include_str!("../../migrations/015_nature.sql"))
        .unwrap();
    connection.execute_batch("INSERT INTO learning_progress VALUES (1,'nature','historical.nature',5,3,'2026-09-28 11:12:13'); PRAGMA user_version=15;").unwrap();
    connection
}

#[test]
fn geography_migration_preserves_every_existing_row_and_historical_retry() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("geography.sqlite3");
    let old = schema_15(&path);
    let before = stored_rows(&old);
    drop(old);
    let mut upgraded = open(&path).unwrap();
    assert_preserved_rows(&upgraded, &before);
    assert_eq!(
        upgraded
            .pragma_query_value(None, "user_version", |row| row.get::<_, i64>(0))
            .unwrap(),
        SCHEMA_VERSION
    );
    assert_eq!(get_profile(&upgraded).unwrap().unwrap().grade, 7);
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
    assert_preserved_rows(&upgraded, &before);
    record_attempt(
        &upgraded,
        Subject::Geography,
        "by.geography.5.2.solar-system",
        false,
    )
    .unwrap();
    record_attempt(
        &upgraded,
        Subject::Geography,
        "by.geography.5.2.solar-system",
        true,
    )
    .unwrap();
    let expected = stored_rows(&upgraded);
    drop(upgraded);
    let reopened = open(&path).unwrap();
    assert_eq!(stored_rows(&reopened), expected);
    let progress = list_progress(&reopened).unwrap();
    assert_eq!(progress.len(), 4);
    let geography = progress
        .iter()
        .find(|row| row.subject == Subject::Geography)
        .unwrap();
    assert_eq!((geography.attempts, geography.correct), (2, 1));
    assert_eq!(crate::learning::wallet(&reopened).unwrap().balance, 32);
    let failures: i64 = reopened
        .query_row("SELECT COUNT(*) FROM pragma_foreign_key_check", [], |row| {
            row.get(0)
        })
        .unwrap();
    assert_eq!(failures, 0);
}

#[test]
fn failed_geography_migration_rolls_back_to_schema_15_and_keeps_all_data() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("collision.sqlite3");
    let old = schema_15(&path);
    old.execute_batch("CREATE TABLE learning_progress_v16(collision TEXT);")
        .unwrap();
    let before = stored_rows(&old);
    drop(old);
    assert!(open(&path).is_err());
    let unchanged = Connection::open(&path).unwrap();
    assert_eq!(
        unchanged
            .pragma_query_value(None, "user_version", |row| row.get::<_, i64>(0))
            .unwrap(),
        15
    );
    assert_eq!(stored_rows(&unchanged), before);
    assert!(record_attempt(&unchanged, Subject::Geography, "solar", true).is_err());
    assert_eq!(stored_rows(&unchanged), before);
}

#[test]
fn geography_progress_rejects_invalid_ids_subjects_and_missing_profile() {
    let mut connection = Connection::open_in_memory().unwrap();
    connection
        .pragma_update(None, "foreign_keys", true)
        .unwrap();
    migrate(&mut connection).unwrap();
    assert!(record_attempt(&connection, Subject::Geography, "solar", true).is_err());
    save_profile(
        &connection,
        Profile {
            display_name: "Alex".into(),
            grade: 5,
        },
    )
    .unwrap();
    for id in [
        "".to_owned(),
        "x".repeat(129),
        "solar; DROP TABLE learner_profile".to_owned(),
        "solar\n".to_owned(),
    ] {
        assert!(record_attempt(&connection, Subject::Geography, &id, true).is_err());
    }
    assert!(connection
        .execute(
            "INSERT INTO learning_progress VALUES(1,'unknown','solar',1,1,'today')",
            []
        )
        .is_err());
    assert!(list_progress(&connection).unwrap().is_empty());
    assert_eq!(
        serde_json::to_value(Subject::Geography).unwrap(),
        "geography"
    );
    assert!(serde_json::from_str::<Subject>("\"unknown\"").is_err());
}
