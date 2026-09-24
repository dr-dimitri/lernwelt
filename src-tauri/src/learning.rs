use crate::database::{self, Subject};
use rusqlite::{params, Connection, OptionalExtension, TransactionBehavior};
use serde::Serialize;

const POINTS_PER_ANSWER: i64 = 10;

// Deliberately small starter examples, not a complete curriculum package.
struct Exercise {
    id: &'static str,
    subject: Subject,
    competency_id: &'static str,
    prompt: &'static str,
    answer: &'static str,
    explanation: &'static str,
}

const EXERCISES: &[Exercise] = &[
    Exercise {
        id: "sample.math.add.v1",
        subject: Subject::Mathematics,
        competency_id: "sample.math.arithmetic",
        prompt: "Was ist 17 + 25?",
        answer: "42",
        explanation: "17 + 20 = 37 und 37 + 5 = 42.",
    },
    Exercise {
        id: "sample.math.multiply.v1",
        subject: Subject::Mathematics,
        competency_id: "sample.math.arithmetic",
        prompt: "Was ist 6 × 7?",
        answer: "42",
        explanation: "6 × 7 = 42.",
    },
    Exercise {
        id: "sample.english.cat.v1",
        subject: Subject::English,
        competency_id: "sample.english.vocabulary",
        prompt: "Wie heißt „Katze“ auf Englisch?",
        answer: "cat",
        explanation: "„Katze“ heißt auf Englisch „cat“.",
    },
    Exercise {
        id: "sample.english.be.v1",
        subject: Subject::English,
        competency_id: "sample.english.grammar",
        prompt: "Ergänze das fehlende Wort: She ___ my friend.",
        answer: "is",
        explanation: "Bei „she“ verwendest du „is“: She is my friend.",
    },
];

const REWARDS: &[(&str, &str, &str, i64)] = &[
    (
        "star",
        "Sternsammler",
        "Dein erstes leuchtendes Sammelabzeichen.",
        20,
    ),
    (
        "fox",
        "Lernfuchs",
        "Ein Abzeichen für deine Entdeckerfreude.",
        20,
    ),
];

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Question {
    id: &'static str,
    subject: Subject,
    prompt: &'static str,
    solved: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Reward {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub cost: i64,
    pub owned: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Wallet {
    pub balance: i64,
    pub total_earned: i64,
    pub rewards: Vec<Reward>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LearningState {
    profile_ready: bool,
    points_per_answer: i64,
    questions: Vec<Question>,
    wallet: Wallet,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnswerResult {
    pub correct: bool,
    pub points_awarded: i64,
    pub explanation: &'static str,
    pub wallet: Wallet,
}

fn db_error(_: rusqlite::Error) -> String {
    "Deine Punkte konnten nicht verarbeitet werden. Bitte versuche es erneut.".to_owned()
}

fn has_entry(connection: &Connection, kind: &str, item_id: &str) -> Result<bool, String> {
    connection.query_row(
        "SELECT EXISTS(SELECT 1 FROM point_entries WHERE profile_id = 1 AND kind = ?1 AND item_id = ?2)",
        params![kind, item_id], |row| row.get(0),
    ).map_err(db_error)
}

pub fn wallet(connection: &Connection) -> Result<Wallet, String> {
    let (balance, total_earned) = connection.query_row(
        "SELECT COALESCE(SUM(amount), 0), COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) FROM point_entries WHERE profile_id = 1",
        [], |row| Ok((row.get(0)?, row.get(1)?)),
    ).map_err(db_error)?;
    let rewards = REWARDS
        .iter()
        .map(|&(id, name, description, cost)| {
            Ok(Reward {
                id,
                name,
                description,
                cost,
                owned: has_entry(connection, "reward", id)?,
            })
        })
        .collect::<Result<Vec<_>, String>>()?;
    Ok(Wallet {
        balance,
        total_earned,
        rewards,
    })
}

pub fn get_state(connection: &mut Connection) -> Result<LearningState, String> {
    let transaction = connection.transaction().map_err(db_error)?;
    let questions = EXERCISES
        .iter()
        .map(|exercise| {
            Ok(Question {
                id: exercise.id,
                subject: exercise.subject,
                prompt: exercise.prompt,
                solved: has_entry(&transaction, "answer", exercise.id)?,
            })
        })
        .collect::<Result<Vec<_>, String>>()?;
    let state = LearningState {
        profile_ready: database::get_profile(&transaction)?.is_some(),
        points_per_answer: POINTS_PER_ANSWER,
        questions,
        wallet: wallet(&transaction)?,
    };
    transaction.commit().map_err(db_error)?;
    Ok(state)
}

pub fn submit_answer(
    connection: &mut Connection,
    request_id: &str,
    question_id: &str,
    answer: &str,
) -> Result<AnswerResult, String> {
    if request_id.is_empty()
        || request_id.len() > 80
        || !request_id
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-')
    {
        return Err("Die Antwort-ID ist ungültig.".to_owned());
    }
    if answer.trim().is_empty()
        || answer.chars().count() > 120
        || answer.chars().any(char::is_control)
    {
        return Err("Bitte gib eine Antwort mit 1 bis 120 Zeichen ein.".to_owned());
    }
    let exercise = EXERCISES
        .iter()
        .find(|exercise| exercise.id == question_id)
        .ok_or("Diese Aufgabe ist nicht verfügbar.")?;
    let transaction = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(db_error)?;
    if database::get_profile(&transaction)?.is_none() {
        return Err("Bitte speichere zuerst dein Lernprofil.".to_owned());
    }
    let existing: Option<(String, String, bool, i64)> = transaction.query_row(
        "SELECT question_id, answer, correct, points_awarded FROM answer_submissions WHERE request_id = ?1 AND profile_id = 1",
        [request_id], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
    ).optional().map_err(db_error)?;
    let (correct, points_awarded) = if let Some((stored_question, stored_answer, correct, points)) =
        existing
    {
        if stored_question != question_id || stored_answer != answer {
            return Err(
                "Diese Antwort-ID wurde bereits für eine andere Antwort verwendet.".to_owned(),
            );
        }
        (correct, points)
    } else {
        // This first set uses integer values and case-insensitive English words.
        let correct = match exercise.subject {
            Subject::Mathematics => {
                answer.trim().parse::<i64>().ok() == exercise.answer.parse::<i64>().ok()
            }
            Subject::English => answer.trim().eq_ignore_ascii_case(exercise.answer),
        };
        let points = if correct && !has_entry(&transaction, "answer", question_id)? {
            POINTS_PER_ANSWER
        } else {
            0
        };
        database::record_attempt(
            &transaction,
            exercise.subject,
            exercise.competency_id,
            correct,
        )?;
        if points > 0 {
            transaction.execute("INSERT INTO point_entries (profile_id, kind, item_id, amount) VALUES (1, 'answer', ?1, ?2)", params![question_id, points]).map_err(db_error)?;
        }
        transaction.execute(
            "INSERT INTO answer_submissions (request_id, profile_id, question_id, answer, correct, points_awarded) VALUES (?1, 1, ?2, ?3, ?4, ?5)",
            params![request_id, question_id, answer, correct, points],
        ).map_err(db_error)?;
        (correct, points)
    };
    let result = AnswerResult {
        correct,
        points_awarded,
        explanation: exercise.explanation,
        wallet: wallet(&transaction)?,
    };
    transaction.commit().map_err(db_error)?;
    Ok(result)
}

pub fn redeem_reward(connection: &mut Connection, reward_id: &str) -> Result<Wallet, String> {
    let &(id, _, _, cost) = REWARDS
        .iter()
        .find(|reward| reward.0 == reward_id)
        .ok_or("Diese Belohnung ist nicht verfügbar.")?;
    let transaction = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(db_error)?;
    if database::get_profile(&transaction)?.is_none() {
        return Err("Bitte speichere zuerst dein Lernprofil.".to_owned());
    }
    // A one-time reward is naturally idempotent, including retries after a lost response.
    if !has_entry(&transaction, "reward", id)? {
        if wallet(&transaction)?.balance < cost {
            return Err("Dafür reichen deine Punkte noch nicht aus.".to_owned());
        }
        transaction.execute("INSERT INTO point_entries (profile_id, kind, item_id, amount) VALUES (1, 'reward', ?1, ?2)", params![id, -cost]).map_err(db_error)?;
    }
    let result = wallet(&transaction)?;
    transaction.commit().map_err(db_error)?;
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Profile;

    fn setup() -> (tempfile::TempDir, Connection) {
        let directory = tempfile::tempdir().unwrap();
        let connection = database::open(&directory.path().join("test.sqlite3")).unwrap();
        database::save_profile(
            &connection,
            Profile {
                display_name: "Alex".to_owned(),
                grade: 5,
            },
        )
        .unwrap();
        (directory, connection)
    }

    fn earn_twenty(connection: &mut Connection) {
        submit_answer(connection, "one", "sample.math.add.v1", "42").unwrap();
        submit_answer(connection, "two", "sample.math.multiply.v1", "42").unwrap();
    }

    #[test]
    fn awards_only_correct_answers_once_and_preserves_points_on_profile_edit() {
        let (_directory, mut connection) = setup();
        let wrong =
            submit_answer(&mut connection, "wrong", "sample.english.cat.v1", "dog").unwrap();
        assert!(!wrong.correct);
        assert_eq!(wrong.wallet.balance, 0);
        let correct =
            submit_answer(&mut connection, "correct", "sample.english.cat.v1", " CAT ").unwrap();
        assert!(correct.correct);
        assert_eq!((correct.points_awarded, correct.wallet.balance), (10, 10));
        let repeated =
            submit_answer(&mut connection, "again", "sample.english.cat.v1", "cat").unwrap();
        assert_eq!((repeated.points_awarded, repeated.wallet.balance), (0, 10));
        database::save_profile(
            &connection,
            Profile {
                display_name: "Alexandra".to_owned(),
                grade: 6,
            },
        )
        .unwrap();
        assert_eq!(wallet(&connection).unwrap().balance, 10);
        let progress = database::list_progress(&connection).unwrap();
        assert_eq!((progress[0].attempts, progress[0].correct), (3, 2));
    }

    #[test]
    fn request_replay_is_idempotent_and_conflicting_reuse_rejected() {
        let (_directory, mut connection) = setup();
        for _ in 0..2 {
            let result =
                submit_answer(&mut connection, "retry-id", "sample.math.add.v1", "42").unwrap();
            assert_eq!((result.points_awarded, result.wallet.balance), (10, 10));
        }
        assert!(submit_answer(&mut connection, "retry-id", "sample.math.add.v1", "43").is_err());
        assert_eq!(database::list_progress(&connection).unwrap()[0].attempts, 1);
    }

    #[test]
    fn redeem_checks_balance_and_is_persistent_and_idempotent() {
        let (directory, mut connection) = setup();
        assert!(redeem_reward(&mut connection, "star").is_err());
        assert!(redeem_reward(&mut connection, "unknown").is_err());
        earn_twenty(&mut connection);
        let redeemed = redeem_reward(&mut connection, "star").unwrap();
        assert_eq!((redeemed.balance, redeemed.total_earned), (0, 20));
        assert!(redeemed.rewards[0].owned);
        assert_eq!(redeem_reward(&mut connection, "star").unwrap().balance, 0);
        assert!(redeem_reward(&mut connection, "fox").is_err());
        drop(connection);
        let mut reopened = database::open(&directory.path().join("test.sqlite3")).unwrap();
        let state = get_state(&mut reopened).unwrap();
        assert_eq!((state.wallet.balance, state.wallet.total_earned), (0, 20));
        assert!(state.wallet.rewards[0].owned);
        assert!(state.questions[0].solved);
        assert_eq!(redeem_reward(&mut reopened, "star").unwrap().balance, 0);
    }

    #[test]
    fn rejects_missing_profile_and_invalid_arguments_without_writing() {
        let directory = tempfile::tempdir().unwrap();
        let mut connection = database::open(&directory.path().join("empty.sqlite3")).unwrap();
        assert!(!get_state(&mut connection).unwrap().profile_ready);
        assert!(submit_answer(&mut connection, "one", "sample.math.add.v1", "42").is_err());
        assert!(redeem_reward(&mut connection, "star").is_err());
        database::save_profile(
            &connection,
            Profile {
                display_name: "Alex".to_owned(),
                grade: 5,
            },
        )
        .unwrap();
        for (id, question, answer) in [
            ("", "sample.math.add.v1", "42"),
            ("one", "unknown", "42"),
            ("one", "sample.math.add.v1", ""),
            ("one", "sample.math.add.v1", "a\0b"),
        ] {
            assert!(submit_answer(&mut connection, id, question, answer).is_err());
        }
        assert!(submit_answer(
            &mut connection,
            "one",
            "sample.math.add.v1",
            &"x".repeat(121)
        )
        .is_err());
        assert_eq!(wallet(&connection).unwrap().balance, 0);
        assert!(database::list_progress(&connection).unwrap().is_empty());
    }

    #[test]
    fn failed_award_rolls_back_progress_and_submission() {
        let (_directory, mut connection) = setup();
        connection.execute_batch("CREATE TRIGGER fail_award BEFORE INSERT ON point_entries BEGIN SELECT RAISE(ABORT, 'test'); END;").unwrap();
        assert!(submit_answer(&mut connection, "one", "sample.math.add.v1", "42").is_err());
        assert!(database::list_progress(&connection).unwrap().is_empty());
        assert_eq!(wallet(&connection).unwrap().balance, 0);
        connection
            .execute_batch("DROP TRIGGER fail_award;")
            .unwrap();
        assert_eq!(
            submit_answer(&mut connection, "one", "sample.math.add.v1", "42")
                .unwrap()
                .points_awarded,
            10
        );
    }

    #[test]
    fn migrates_existing_v1_without_inventing_points() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("old.sqlite3");
        {
            let connection = Connection::open(&path).unwrap();
            connection
                .execute_batch(include_str!("../migrations/001_initial.sql"))
                .unwrap();
            connection.pragma_update(None, "user_version", 1).unwrap();
            database::save_profile(
                &connection,
                Profile {
                    display_name: "Existing".to_owned(),
                    grade: 8,
                },
            )
            .unwrap();
            database::record_attempt(&connection, Subject::English, "old.competency", true)
                .unwrap();
        }
        let mut connection = database::open(&path).unwrap();
        assert_eq!(get_state(&mut connection).unwrap().wallet.balance, 0);
        assert_eq!(
            database::get_profile(&connection)
                .unwrap()
                .unwrap()
                .display_name,
            "Existing"
        );
        assert_eq!(database::list_progress(&connection).unwrap()[0].correct, 1);
        drop(connection);
        assert_eq!(wallet(&database::open(&path).unwrap()).unwrap().balance, 0);
    }

    #[test]
    fn concurrent_redemptions_cannot_overdraw_balance() {
        let (directory, mut connection) = setup();
        earn_twenty(&mut connection);
        let barrier = std::sync::Arc::new(std::sync::Barrier::new(2));
        let handles: Vec<_> = ["star", "fox"]
            .into_iter()
            .map(|reward| {
                let path = directory.path().join("test.sqlite3");
                let barrier = barrier.clone();
                std::thread::spawn(move || {
                    let mut connection = database::open(&path).unwrap();
                    barrier.wait();
                    redeem_reward(&mut connection, reward).is_ok()
                })
            })
            .collect();
        let successes = handles
            .into_iter()
            .filter_map(|handle| handle.join().ok())
            .filter(|success| *success)
            .count();
        assert_eq!(successes, 1);
        let wallet = wallet(&connection).unwrap();
        assert_eq!(wallet.balance, 0);
        assert_eq!(
            wallet.rewards.iter().filter(|reward| reward.owned).count(),
            1
        );
    }
}
