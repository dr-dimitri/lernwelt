use crate::{database, learning};
use rusqlite::{params, Connection, OptionalExtension, TransactionBehavior};
use serde::Serialize;

const GAMES: [&str; 5] = ["blocks", "runner", "maze", "space", "chickens"];
const ENTRY_COST: i64 = 10;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub id: String,
    pub game_id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BestScore {
    game_id: String,
    score: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ArcadeState {
    profile_ready: bool,
    entry_cost: i64,
    pub wallet: learning::Wallet,
    pub active_session: Option<Session>,
    best_scores: Vec<BestScore>,
}

fn db_error(_: rusqlite::Error) -> String {
    "Die Spielrunde konnte nicht gespeichert werden. Bitte versuche es erneut.".into()
}

fn state(connection: &Connection) -> Result<ArcadeState, String> {
    let active_session = connection
        .query_row(
            "SELECT id, game_id FROM game_sessions WHERE profile_id = 1 AND score IS NULL",
            [],
            |row| {
                Ok(Session {
                    id: row.get(0)?,
                    game_id: row.get(1)?,
                })
            },
        )
        .optional()
        .map_err(db_error)?;
    let mut statement = connection.prepare(
        "SELECT game_id, MAX(score) FROM game_sessions WHERE profile_id = 1 AND score IS NOT NULL GROUP BY game_id",
    ).map_err(db_error)?;
    let best_scores = statement
        .query_map([], |row| {
            Ok(BestScore {
                game_id: row.get(0)?,
                score: row.get(1)?,
            })
        })
        .map_err(db_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(db_error)?;
    Ok(ArcadeState {
        profile_ready: database::get_profile(connection)?.is_some(),
        entry_cost: ENTRY_COST,
        wallet: learning::wallet(connection)?,
        active_session,
        best_scores,
    })
}

pub fn get_state(connection: &mut Connection) -> Result<ArcadeState, String> {
    let transaction = connection.transaction().map_err(db_error)?;
    let result = state(&transaction)?;
    transaction.commit().map_err(db_error)?;
    Ok(result)
}

fn validate_id(id: &str) -> Result<(), String> {
    if id.is_empty() || id.len() > 80 || !id.bytes().all(|c| c.is_ascii_alphanumeric() || c == b'-')
    {
        return Err("Diese Spielrunde ist ungültig.".into());
    }
    Ok(())
}

pub fn start(
    connection: &mut Connection,
    session_id: &str,
    game_id: &str,
) -> Result<ArcadeState, String> {
    validate_id(session_id)?;
    if !GAMES.contains(&game_id) {
        return Err("Dieses Spiel gibt es nicht in der Spielhalle.".into());
    }
    let transaction = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(db_error)?;
    if database::get_profile(&transaction)?.is_none() {
        return Err("Speichere zuerst dein Lernprofil unten auf dieser Seite.".into());
    }
    let existing: Option<(String, Option<i64>)> = transaction
        .query_row(
            "SELECT game_id, score FROM game_sessions WHERE id = ?1 AND profile_id = 1",
            [session_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(db_error)?;
    if let Some((previous_game, score)) = existing {
        if previous_game != game_id || score.is_some() {
            return Err("Diese Runden-ID wurde bereits verwendet. Lade die Spielhalle neu.".into());
        }
    } else {
        if game_id == "runner" {
            return Err("Wähle das neue Sternenlabyrinth. Bereits bezahlte Wolkenflitzer-Runden bleiben spielbar.".into());
        }
        let before = state(&transaction)?;
        if before.active_session.is_some() {
            return Err(
                "Eine bezahlte Runde wartet noch auf dich. Lade die Spielhalle neu.".into(),
            );
        }
        if before.wallet.balance < ENTRY_COST {
            return Err(
                "Dir fehlen noch Lernpunkte. Löse eine neue Aufgabe und komm wieder!".into(),
            );
        }
        transaction
            .execute(
                "INSERT INTO game_sessions (id, profile_id, game_id) VALUES (?1, 1, ?2)",
                params![session_id, game_id],
            )
            .map_err(db_error)?;
        transaction.execute(
            "INSERT INTO point_entries (profile_id, kind, item_id, amount) VALUES (1, 'game', ?1, ?2)",
            params![session_id, -ENTRY_COST],
        ).map_err(db_error)?;
    }
    let result = state(&transaction)?;
    transaction.commit().map_err(db_error)?;
    Ok(result)
}

pub fn finish(
    connection: &mut Connection,
    session_id: &str,
    score: i64,
) -> Result<ArcadeState, String> {
    validate_id(session_id)?;
    if !(0..=1_000_000).contains(&score) {
        return Err("Dieser Spielstand ist ungültig.".into());
    }
    let transaction = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(db_error)?;
    let previous: Option<Option<i64>> = transaction
        .query_row(
            "SELECT score FROM game_sessions WHERE id = ?1 AND profile_id = 1",
            [session_id],
            |row| row.get(0),
        )
        .optional()
        .map_err(db_error)?;
    match previous {
        None => return Err("Diese bezahlte Runde wurde nicht gefunden.".into()),
        Some(Some(saved)) if saved != score => {
            return Err("Diese Runde ist bereits mit einem anderen Spielstand beendet.".into())
        }
        _ => {}
    }
    transaction
        .execute(
            "UPDATE game_sessions SET score = ?1 WHERE id = ?2 AND score IS NULL",
            params![score, session_id],
        )
        .map_err(db_error)?;
    let result = state(&transaction)?;
    transaction.commit().map_err(db_error)?;
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn funded(path: &std::path::Path) -> Connection {
        let connection = database::open(path).unwrap();
        database::save_profile(
            &connection,
            database::Profile {
                display_name: "Spieltest".into(),
                grade: 5,
            },
        )
        .unwrap();
        connection.execute("INSERT INTO point_entries (profile_id, kind, item_id, amount) VALUES (1, 'answer', 'fixture', 20)", []).unwrap();
        connection
    }

    #[test]
    fn paid_round_survives_reopen_and_retries_never_charge_twice() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("test.db");
        let mut connection = funded(&path);
        assert_eq!(
            start(&mut connection, "round-1", "blocks")
                .unwrap()
                .wallet
                .balance,
            10
        );
        drop(connection);
        let mut connection = database::open(&path).unwrap();
        assert_eq!(
            get_state(&mut connection)
                .unwrap()
                .active_session
                .unwrap()
                .id,
            "round-1"
        );
        assert_eq!(
            start(&mut connection, "round-1", "blocks")
                .unwrap()
                .wallet
                .balance,
            10
        );
        assert!(start(&mut connection, "round-1", "space").is_err());
        assert!(start(&mut connection, "round-2", "space").is_err());
        assert_eq!(
            finish(&mut connection, "round-1", 150)
                .unwrap()
                .wallet
                .balance,
            10
        );
        assert_eq!(
            finish(&mut connection, "round-1", 150).unwrap().best_scores[0].score,
            150
        );
        assert!(finish(&mut connection, "round-1", 200).is_err());
        assert!(start(&mut connection, "round-1", "blocks").is_err());
        start(&mut connection, "round-2", "blocks").unwrap();
        finish(&mut connection, "round-2", 50).unwrap();
        drop(connection);
        let mut connection = database::open(&path).unwrap();
        let state = get_state(&mut connection).unwrap();
        assert_eq!(state.best_scores[0].score, 150);
        assert_eq!(state.wallet.total_earned, 20);
        assert!(state.active_session.is_none());
        assert!(start(&mut connection, "round-3", "chickens").is_err());
    }

    #[test]
    fn validates_inputs_profile_and_rolls_back_failed_debit() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("test.db");
        let mut connection = database::open(&path).unwrap();
        assert!(start(&mut connection, "r1", "blocks").is_err());
        drop(connection);
        let mut connection = funded(&path);
        for (id, game) in [("", "blocks"), ("bad/id", "blocks"), ("r1", "unknown")] {
            assert!(start(&mut connection, id, game).is_err());
        }
        assert!(finish(&mut connection, "missing", 10).is_err());
        assert!(finish(&mut connection, "r1", -1).is_err());
        assert!(finish(&mut connection, "r1", 1_000_001).is_err());
        connection.execute_batch("CREATE TRIGGER fail_game BEFORE INSERT ON point_entries WHEN NEW.kind = 'game' BEGIN SELECT RAISE(ABORT, 'test'); END;").unwrap();
        assert!(start(&mut connection, "r1", "blocks").is_err());
        let state = get_state(&mut connection).unwrap();
        assert_eq!(state.wallet.balance, 20);
        assert!(state.active_session.is_none());
    }

    #[test]
    fn competing_connections_allow_only_one_entry() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("test.db");
        drop(funded(&path));
        let barrier = std::sync::Arc::new(std::sync::Barrier::new(2));
        let handles: Vec<_> = (0..2)
            .map(|i| {
                let mut connection = database::open(&path).unwrap();
                let barrier = barrier.clone();
                std::thread::spawn(move || {
                    barrier.wait();
                    start(&mut connection, &format!("r{i}"), "maze").is_ok()
                })
            })
            .collect();
        assert_eq!(
            handles
                .into_iter()
                .filter_map(|h| h.join().ok())
                .filter(|ok| *ok)
                .count(),
            1
        );
        assert_eq!(
            get_state(&mut database::open(&path).unwrap())
                .unwrap()
                .wallet
                .balance,
            10
        );
    }

    #[test]
    fn v3_migration_preserves_learning_and_badges() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("old.db");
        let connection = Connection::open(&path).unwrap();
        connection
            .execute_batch(include_str!("../migrations/001_initial.sql"))
            .unwrap();
        connection
            .execute_batch(include_str!("../migrations/002_points.sql"))
            .unwrap();
        connection
            .execute_batch(include_str!("../migrations/003_difficulty.sql"))
            .unwrap();
        connection.execute_batch("INSERT INTO learner_profile VALUES (1, 'Alt', 5); INSERT INTO point_entries (profile_id,kind,item_id,amount) VALUES (1,'answer','old',40),(1,'reward','star',-20); UPDATE learning_settings SET difficulty='streber'; PRAGMA user_version=3;").unwrap();
        database::record_attempt(
            &connection,
            database::Subject::Mathematics,
            "old.skill",
            true,
        )
        .unwrap();
        drop(connection);
        let mut connection = database::open(&path).unwrap();
        let state = get_state(&mut connection).unwrap();
        assert_eq!(state.wallet.balance, 20);
        assert!(state.wallet.rewards[0].owned);
        assert_eq!(
            database::get_profile(&connection)
                .unwrap()
                .unwrap()
                .display_name,
            "Alt"
        );
        assert_eq!(database::list_progress(&connection).unwrap()[0].correct, 1);
        assert_eq!(
            database::get_difficulty(&connection).unwrap().as_str(),
            "streber"
        );
        start(&mut connection, "migrated-round", "chickens").unwrap();
        assert_eq!(learning::wallet(&connection).unwrap().balance, 10);
    }
    #[test]
    fn failed_v4_migration_restores_original_journal_and_version() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("old.db");
        let connection = Connection::open(&path).unwrap();
        connection
            .execute_batch(include_str!("../migrations/001_initial.sql"))
            .unwrap();
        connection
            .execute_batch(include_str!("../migrations/002_points.sql"))
            .unwrap();
        connection
            .execute_batch(include_str!("../migrations/003_difficulty.sql"))
            .unwrap();
        connection.execute_batch("INSERT INTO learner_profile VALUES (1, 'Alt', 5); INSERT INTO point_entries (profile_id,kind,item_id,amount) VALUES (1,'answer','old',20); CREATE TABLE game_sessions (collision TEXT); PRAGMA user_version=3;").unwrap();
        drop(connection);
        assert!(database::open(&path).is_err());
        let connection = Connection::open(&path).unwrap();
        assert_eq!(
            connection
                .pragma_query_value(None, "user_version", |row| row.get::<_, i64>(0))
                .unwrap(),
            3
        );
        assert_eq!(learning::wallet(&connection).unwrap().balance, 20);
        // The old CHECK constraint must still reject the new journal kind after rollback.
        assert!(connection.execute("INSERT INTO point_entries (profile_id,kind,item_id,amount) VALUES (1,'game','r1',-10)", []).is_err());
    }
}

#[cfg(test)]
mod labyrinth_tests {
    use super::*;
    #[test]
    fn migration_preserves_paid_runner_and_separates_labyrinth_scores() {
        let d = tempfile::tempdir().unwrap();
        let path = d.path().join("arcade.db");
        let c = database::open(&path).unwrap();
        database::save_profile(
            &c,
            database::Profile {
                display_name: "Alt".into(),
                grade: 5,
            },
        )
        .unwrap();
        c.execute_batch("INSERT INTO point_entries (profile_id,kind,item_id,amount) VALUES (1,'answer','fixture',30),(1,'game','old-runner',-10); INSERT INTO game_sessions VALUES ('old-runner',1,'runner',NULL,'2026-09-01'); PRAGMA user_version=11;").unwrap();
        drop(c);
        let mut c = database::open(&path).unwrap();
        assert_eq!(
            get_state(&mut c).unwrap().active_session.unwrap().game_id,
            "runner"
        );
        assert_eq!(
            start(&mut c, "old-runner", "runner")
                .unwrap()
                .wallet
                .balance,
            20
        );
        finish(&mut c, "old-runner", 500).unwrap();
        assert!(start(&mut c, "new-runner", "runner").is_err());
        assert_eq!(
            start(&mut c, "maze-round", "maze").unwrap().wallet.balance,
            10
        );
        drop(c);
        let mut c = database::open(&path).unwrap();
        assert_eq!(
            start(&mut c, "maze-round", "maze").unwrap().wallet.balance,
            10
        );
        let state = finish(&mut c, "maze-round", 1000).unwrap();
        assert_eq!(state.best_scores.len(), 2);
        assert_eq!(
            state
                .best_scores
                .iter()
                .find(|s| s.game_id == "runner")
                .unwrap()
                .score,
            500
        );
        assert_eq!(
            state
                .best_scores
                .iter()
                .find(|s| s.game_id == "maze")
                .unwrap()
                .score,
            1000
        );
        assert_eq!(state.wallet.balance, 10);
    }
}
