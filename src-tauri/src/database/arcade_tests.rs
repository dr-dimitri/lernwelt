use super::nature_tests::{assert_preserved_rows, stored_rows};
use super::*;
use crate::{arcade, learning};

fn schema_17(path: &Path) -> Connection {
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
        include_str!("../../migrations/015_nature.sql"),
        include_str!("../../migrations/016_geography.sql"),
        include_str!("../../migrations/017_typing.sql"),
    ] {
        connection.execute_batch(migration).unwrap();
    }
    connection.execute_batch(
        "INSERT INTO learner_profile VALUES(1,'Bestehendes Profil',7);
         UPDATE learning_settings SET difficulty='streber';
         INSERT INTO learning_progress VALUES(1,'mathematics','historical.skill',3,2,'2026-10-01');
         INSERT INTO point_entries(profile_id,kind,item_id,amount,created_at) VALUES
         (1,'answer','historical-answer',50,'2026-10-01'),
         (1,'game','historical-runner',-10,'2026-10-02');
         INSERT INTO game_sessions VALUES
         ('historical-runner',1,'runner',NULL,'2026-10-02'),
         ('historical-blocks',1,'blocks',700,'2026-10-01');
         INSERT INTO typing_progress VALUES(1,'historical.typing','streber',2,1,1,'2026-10-01');
         INSERT INTO typing_submissions VALUES('historical-typing',1,'historical.typing','streber','fj',1,3,'2026-10-01');
         PRAGMA user_version=17;"
    ).unwrap();
    connection
}

#[test]
fn worms_migration_preserves_every_row_and_paid_legacy_round() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("schema17.sqlite3");
    let old = schema_17(&path);
    let before = stored_rows(&old);
    drop(old);
    let mut upgraded = open(&path).unwrap();
    assert_preserved_rows(&upgraded, &before);
    assert_eq!(
        upgraded
            .pragma_query_value(None, "user_version", |row| row.get::<_, i64>(0))
            .unwrap(),
        18
    );
    assert_eq!(
        arcade::start(&mut upgraded, "historical-runner", "runner")
            .unwrap()
            .wallet
            .balance,
        40
    );
    assert!(arcade::start(&mut upgraded, "worms-blocked", "worms").is_err());
    arcade::finish(&mut upgraded, "historical-runner", 400).unwrap();
    assert!(arcade::start(&mut upgraded, "new-runner", "runner").is_err());
    assert_eq!(
        arcade::start(&mut upgraded, "worms-paid", "worms")
            .unwrap()
            .wallet
            .balance,
        30
    );
    drop(upgraded);
    let mut reopened = open(&path).unwrap();
    let state = arcade::get_state(&mut reopened).unwrap();
    assert_eq!(state.active_session.unwrap().game_id, "worms");
    assert_eq!(
        arcade::start(&mut reopened, "worms-paid", "worms")
            .unwrap()
            .wallet
            .balance,
        30
    );
    arcade::finish(&mut reopened, "worms-paid", 1250).unwrap();
    arcade::finish(&mut reopened, "worms-paid", 1250).unwrap();
    assert!(arcade::finish(&mut reopened, "worms-paid", 999).is_err());
    drop(reopened);
    let mut reopened = open(&path).unwrap();
    let state = serde_json::to_value(arcade::get_state(&mut reopened).unwrap()).unwrap();
    assert_eq!(state["wallet"]["balance"], 30);
    assert_eq!(state["wallet"]["totalEarned"], 50);
    assert_eq!(state["activeSession"], serde_json::Value::Null);
    let scores = state["bestScores"].as_array().unwrap();
    assert!(scores
        .iter()
        .any(|score| score["gameId"] == "worms" && score["score"] == 1250));
    assert!(scores
        .iter()
        .any(|score| score["gameId"] == "blocks" && score["score"] == 700));
    assert!(scores
        .iter()
        .any(|score| score["gameId"] == "runner" && score["score"] == 400));
    assert_eq!(
        reopened
            .query_row(
                "SELECT COUNT(*) FROM point_entries WHERE kind='game' AND item_id='worms-paid'",
                [],
                |row| row.get::<_, i64>(0)
            )
            .unwrap(),
        1
    );
    assert_eq!(get_profile(&reopened).unwrap().unwrap().grade, 7);
    assert_eq!(get_difficulty(&reopened).unwrap().as_str(), "streber");
    assert_eq!(
        reopened
            .query_row(
                "SELECT answer FROM typing_submissions WHERE request_id='historical-typing'",
                [],
                |row| row.get::<_, String>(0)
            )
            .unwrap(),
        "fj"
    );
}

#[test]
fn failed_worms_migration_rolls_back_drop_copy_and_schema_version() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("rollback.sqlite3");
    let old = schema_17(&path);
    // Fail the last migration statement, after the original table has been dropped.
    old.execute_batch(
        "DROP INDEX one_active_game;
        CREATE UNIQUE INDEX legacy_active_game ON game_sessions(profile_id) WHERE score IS NULL;
        CREATE TABLE index_collision(id INTEGER PRIMARY KEY);
        CREATE INDEX one_active_game ON index_collision(id);",
    )
    .unwrap();
    let before = stored_rows(&old);
    drop(old);
    assert!(open(&path).is_err());
    let old = Connection::open(&path).unwrap();
    assert_preserved_rows(&old, &before);
    assert_eq!(
        old.pragma_query_value(None, "user_version", |row| row.get::<_, i64>(0))
            .unwrap(),
        17
    );
    assert_eq!(learning::wallet(&old).unwrap().balance, 40);
    assert!(old.execute("INSERT INTO game_sessions(id,profile_id,game_id,score) VALUES('new-worms',1,'worms',0)", []).is_err());
    assert!(old
        .execute(
            "INSERT INTO game_sessions(id,profile_id,game_id) VALUES('second-active',1,'blocks')",
            []
        )
        .is_err());
    assert_eq!(
        old.query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE name='game_sessions_v18'",
            [],
            |row| row.get::<_, i64>(0)
        )
        .unwrap(),
        0
    );
}

#[test]
fn worms_start_validates_and_rolls_back_failed_entry_without_double_charge() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("worms-validation.sqlite3");
    let mut connection = open(&path).unwrap();
    assert!(arcade::start(&mut connection, "no-profile", "worms").is_err());
    save_profile(
        &connection,
        Profile {
            display_name: "Wurmtest".into(),
            grade: 5,
        },
    )
    .unwrap();
    assert!(arcade::start(&mut connection, "no-points", "worms").is_err());
    connection.execute("INSERT INTO point_entries(profile_id,kind,item_id,amount) VALUES(1,'answer','funding',20)", []).unwrap();
    for (id, game) in [("bad/id", "worms"), ("", "worms"), ("valid", "unlisted")] {
        assert!(arcade::start(&mut connection, id, game).is_err());
    }
    connection.execute_batch("CREATE TRIGGER fail_worms_entry BEFORE INSERT ON point_entries WHEN NEW.kind='game' BEGIN SELECT RAISE(ABORT,'fixture'); END;").unwrap();
    assert!(arcade::start(&mut connection, "worms-retry", "worms").is_err());
    let state = arcade::get_state(&mut connection).unwrap();
    assert_eq!(state.wallet.balance, 20);
    assert!(state.active_session.is_none());
    connection
        .execute_batch("DROP TRIGGER fail_worms_entry;")
        .unwrap();
    assert_eq!(
        arcade::start(&mut connection, "worms-retry", "worms")
            .unwrap()
            .wallet
            .balance,
        10
    );
    assert_eq!(
        arcade::start(&mut connection, "worms-retry", "worms")
            .unwrap()
            .wallet
            .balance,
        10
    );
    assert!(arcade::start(&mut connection, "worms-retry", "space").is_err());
    assert!(arcade::finish(&mut connection, "worms-retry", -1).is_err());
    assert!(arcade::finish(&mut connection, "worms-retry", 1_000_001).is_err());
    assert!(connection.execute("INSERT INTO game_sessions(id,profile_id,game_id,score) VALUES('sql-unknown',1,'unlisted',0)", []).is_err());
    assert_eq!(
        arcade::finish(&mut connection, "worms-retry", 800)
            .unwrap()
            .wallet
            .balance,
        10
    );
}
