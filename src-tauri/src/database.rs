use rusqlite::{params, Connection, OptionalExtension, TransactionBehavior};
use serde::{Deserialize, Serialize};
use std::{path::Path, time::Duration};

const SCHEMA_VERSION: i64 = 3;
const DATABASE_ERROR: &str = "Die lokalen Lerndaten konnten nicht verarbeitet werden.";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    pub display_name: String,
    pub grade: u8,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Subject {
    Mathematics,
    English,
}

impl Subject {
    fn as_str(self) -> &'static str {
        match self {
            Self::Mathematics => "mathematics",
            Self::English => "english",
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    pub subject: Subject,
    pub competency_id: String,
    pub attempts: u32,
    pub correct: u32,
}

fn database_error(_: rusqlite::Error) -> String {
    DATABASE_ERROR.to_owned()
}

pub fn open(path: &Path) -> Result<Connection, String> {
    let mut connection = Connection::open(path).map_err(database_error)?;
    connection
        .busy_timeout(Duration::from_secs(5))
        .map_err(database_error)?;
    connection
        .pragma_update(None, "foreign_keys", true)
        .map_err(database_error)?;
    migrate(&mut connection)?;
    Ok(connection)
}

fn migrate(connection: &mut Connection) -> Result<(), String> {
    let transaction = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(database_error)?;
    let version: i64 = transaction
        .pragma_query_value(None, "user_version", |row| row.get(0))
        .map_err(database_error)?;
    if version > SCHEMA_VERSION {
        return Err("Diese Lerndaten benötigen eine neuere Version von Lernwelt.".to_owned());
    }
    if version == 0 {
        transaction
            .execute_batch(include_str!("../migrations/001_initial.sql"))
            .map_err(database_error)?;
    }
    if version < 2 {
        transaction
            .execute_batch(include_str!("../migrations/002_points.sql"))
            .map_err(database_error)?;
    }
    if version < 3 {
        transaction
            .execute_batch(include_str!("../migrations/003_difficulty.sql"))
            .map_err(database_error)?;
    }
    transaction
        .pragma_update(None, "user_version", SCHEMA_VERSION)
        .map_err(database_error)?;
    transaction.commit().map_err(database_error)
}

pub fn get_difficulty(connection: &Connection) -> Result<crate::content::Difficulty, String> {
    let value: String = connection
        .query_row(
            "SELECT difficulty FROM learning_settings WHERE id = 1",
            [],
            |row| row.get(0),
        )
        .map_err(database_error)?;
    crate::content::Difficulty::parse(&value)
}

pub fn set_difficulty(
    connection: &Connection,
    value: &str,
) -> Result<crate::content::Difficulty, String> {
    let difficulty = crate::content::Difficulty::parse(value)?;
    connection
        .execute(
            "UPDATE learning_settings SET difficulty = ?1 WHERE id = 1",
            [difficulty.as_str()],
        )
        .map_err(database_error)?;
    Ok(difficulty)
}

pub fn get_profile(connection: &Connection) -> Result<Option<Profile>, String> {
    connection
        .query_row(
            "SELECT display_name, grade FROM learner_profile WHERE id = 1",
            [],
            |row| {
                Ok(Profile {
                    display_name: row.get(0)?,
                    grade: row.get(1)?,
                })
            },
        )
        .optional()
        .map_err(database_error)
}

pub fn save_profile(connection: &Connection, profile: Profile) -> Result<Profile, String> {
    let name = profile.display_name.trim();
    if name.is_empty() || name.chars().count() > 60 || name.chars().any(char::is_control) {
        return Err(
            "Bitte gib einen Namen mit 1 bis 60 Zeichen ohne Steuerzeichen ein.".to_owned(),
        );
    }
    if !(5..=13).contains(&profile.grade) {
        return Err("Bitte wähle eine Jahrgangsstufe zwischen 5 und 13.".to_owned());
    }
    connection.execute(
        "INSERT INTO learner_profile (id, display_name, grade) VALUES (1, ?1, ?2)
         ON CONFLICT(id) DO UPDATE SET display_name = excluded.display_name, grade = excluded.grade",
        params![name, profile.grade],
    ).map_err(database_error)?;
    Ok(Profile {
        display_name: name.to_owned(),
        grade: profile.grade,
    })
}

pub fn record_attempt(
    connection: &Connection,
    subject: Subject,
    competency_id: &str,
    correct: bool,
) -> Result<(), String> {
    if competency_id.is_empty()
        || competency_id.len() > 128
        || !competency_id
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b"-_.:".contains(&byte))
    {
        return Err("Die Kompetenz-ID ist ungültig.".to_owned());
    }
    if get_profile(connection)?.is_none() {
        return Err("Bitte lege zuerst dein Lernprofil an.".to_owned());
    }
    connection.execute(
        "INSERT INTO learning_progress (profile_id, subject, competency_id, attempts, correct)
         VALUES (1, ?1, ?2, 1, ?3)
         ON CONFLICT(profile_id, subject, competency_id) DO UPDATE SET
         attempts = attempts + 1, correct = correct + excluded.correct, updated_at = CURRENT_TIMESTAMP",
        params![subject.as_str(), competency_id, correct],
    ).map_err(database_error)?;
    Ok(())
}

pub fn list_progress(connection: &Connection) -> Result<Vec<Progress>, String> {
    let mut statement = connection.prepare(
        "SELECT subject, competency_id, attempts, correct FROM learning_progress WHERE profile_id = 1 ORDER BY subject, competency_id",
    ).map_err(database_error)?;
    let rows = statement
        .query_map([], |row| {
            let subject: String = row.get(0)?;
            let subject = match subject.as_str() {
                "mathematics" => Subject::Mathematics,
                "english" => Subject::English,
                _ => return Err(rusqlite::Error::InvalidQuery),
            };
            Ok(Progress {
                subject,
                competency_id: row.get(1)?,
                attempts: row.get(2)?,
                correct: row.get(3)?,
            })
        })
        .map_err(database_error)?;
    rows.collect::<Result<Vec<_>, _>>().map_err(database_error)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn profile() -> Profile {
        Profile {
            display_name: "  Alex  ".to_owned(),
            grade: 7,
        }
    }

    #[test]
    fn profile_and_progress_survive_reopen_and_repeated_migration() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("learning.db");
        {
            let connection = open(&path).unwrap();
            assert_eq!(get_profile(&connection).unwrap(), None);
            assert!(list_progress(&connection).unwrap().is_empty());
            save_profile(&connection, profile()).unwrap();
            record_attempt(&connection, Subject::Mathematics, "by.math.7.example", true).unwrap();
            record_attempt(
                &connection,
                Subject::Mathematics,
                "by.math.7.example",
                false,
            )
            .unwrap();
            record_attempt(&connection, Subject::English, "by.english.7.example", true).unwrap();
            // Updating the profile must not replace/delete its progress.
            save_profile(
                &connection,
                Profile {
                    display_name: "Alexandra".to_owned(),
                    grade: 8,
                },
            )
            .unwrap();
        }
        let connection = open(&path).unwrap();
        assert_eq!(
            get_profile(&connection).unwrap().unwrap(),
            Profile {
                display_name: "Alexandra".to_owned(),
                grade: 8
            }
        );
        let progress = list_progress(&connection).unwrap();
        assert_eq!(progress.len(), 2);
        assert_eq!((progress[1].attempts, progress[1].correct), (2, 1));
    }

    #[test]
    fn invalid_profiles_leave_existing_data_unchanged() {
        let mut connection = Connection::open_in_memory().unwrap();
        migrate(&mut connection).unwrap();
        let saved = save_profile(&connection, profile()).unwrap();
        assert_eq!(saved.display_name, "Alex");
        for name in [
            "".to_owned(),
            "   ".to_owned(),
            "x".repeat(61),
            "a\0b".to_owned(),
        ] {
            assert!(save_profile(
                &connection,
                Profile {
                    display_name: name,
                    grade: 7
                }
            )
            .is_err());
        }
        for grade in [0, 4, 14, 255] {
            assert!(save_profile(
                &connection,
                Profile {
                    display_name: "Alex".to_owned(),
                    grade
                }
            )
            .is_err());
        }
        assert_eq!(get_profile(&connection).unwrap(), Some(saved));
    }

    #[test]
    fn names_are_stored_as_data_not_sql() {
        let mut connection = Connection::open_in_memory().unwrap();
        migrate(&mut connection).unwrap();
        let expected = Profile {
            display_name: "O'Brien'); DROP TABLE learner_profile; --".to_owned(),
            grade: 5,
        };
        save_profile(&connection, expected.clone()).unwrap();
        assert_eq!(get_profile(&connection).unwrap(), Some(expected));
    }

    #[test]
    fn attempts_require_profile_and_valid_competency() {
        let mut connection = Connection::open_in_memory().unwrap();
        migrate(&mut connection).unwrap();
        assert!(record_attempt(&connection, Subject::English, "test", true).is_err());
        save_profile(&connection, profile()).unwrap();
        for id in [
            "".to_owned(),
            "space id".to_owned(),
            "x".repeat(129),
            "sql';".to_owned(),
        ] {
            assert!(record_attempt(&connection, Subject::English, &id, true).is_err());
        }
        assert!(list_progress(&connection).unwrap().is_empty());
    }

    #[test]
    fn newer_schema_is_rejected_without_changing_data() {
        let mut connection = Connection::open_in_memory().unwrap();
        migrate(&mut connection).unwrap();
        let saved = save_profile(&connection, profile()).unwrap();
        connection
            .pragma_update(None, "user_version", SCHEMA_VERSION + 1)
            .unwrap();
        assert!(migrate(&mut connection)
            .unwrap_err()
            .contains("neuere Version"));
        assert_eq!(get_profile(&connection).unwrap(), Some(saved));
        let version: i64 = connection
            .pragma_query_value(None, "user_version", |row| row.get(0))
            .unwrap();
        assert_eq!(version, SCHEMA_VERSION + 1);
    }

    #[test]
    fn failed_v3_upgrade_keeps_existing_v2_data_and_schema_version() {
        let mut connection = Connection::open_in_memory().unwrap();
        connection
            .execute_batch(include_str!("../migrations/001_initial.sql"))
            .unwrap();
        connection
            .execute_batch(include_str!("../migrations/002_points.sql"))
            .unwrap();
        connection.pragma_update(None, "user_version", 2).unwrap();
        let saved = save_profile(&connection, profile()).unwrap();
        connection.execute_batch("CREATE TABLE learning_settings (existing TEXT); INSERT INTO learning_settings VALUES ('preserve');").unwrap();
        assert!(migrate(&mut connection).is_err());
        assert_eq!(get_profile(&connection).unwrap(), Some(saved));
        assert_eq!(
            connection
                .pragma_query_value::<i64, _>(None, "user_version", |row| row.get(0))
                .unwrap(),
            2
        );
        assert_eq!(
            connection
                .query_row::<String, _, _>("SELECT existing FROM learning_settings", [], |row| row
                    .get(0))
                .unwrap(),
            "preserve"
        );
    }

    #[test]
    fn failed_migration_rolls_back() {
        let mut connection = Connection::open_in_memory().unwrap();
        connection
            .execute_batch("CREATE TABLE learning_progress (existing TEXT);")
            .unwrap();
        assert!(migrate(&mut connection).is_err());
        let count: i64 = connection
            .query_row(
                "SELECT count(*) FROM sqlite_master WHERE name = 'learner_profile'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 0);
        let version: i64 = connection
            .pragma_query_value(None, "user_version", |row| row.get(0))
            .unwrap();
        assert_eq!(version, 0);
    }
}
