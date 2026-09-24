use crate::content::{self, AnswerKind, Difficulty, Topic};
use crate::database::{self, Subject};
use rusqlite::{params, Connection, OptionalExtension, TransactionBehavior};
use serde::Serialize;

fn points_for_difficulty(difficulty: Difficulty) -> i64 {
    match difficulty {
        Difficulty::Vorschule => 1,
        Difficulty::Koenner => 2,
        Difficulty::Streber => 3,
    }
}

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
    topic_id: &'static str,
    difficulty: Difficulty,
    hint: &'static str,
    options: &'static [String],
    answer_kind: &'static AnswerKind,
    unit: Option<&'static str>,
    competency_id: &'static str,
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
    difficulty: Difficulty,
    topics: &'static [Topic],
    curriculum_source: &'static str,
    curriculum_version: &'static str,
    points_by_difficulty: std::collections::BTreeMap<&'static str, i64>,
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
    let catalog = content::catalog()?;
    let questions = catalog
        .exercises
        .iter()
        .filter(|exercise| !exercise.legacy)
        .map(|exercise| {
            Ok(Question {
                id: &exercise.id,
                subject: exercise.subject,
                prompt: &exercise.prompt,
                solved: has_entry(&transaction, "answer", &exercise.id)?,
                topic_id: &exercise.topic_id,
                difficulty: exercise.difficulty,
                hint: &exercise.hint,
                options: &exercise.options,
                answer_kind: &exercise.answer_kind,
                unit: exercise.unit.as_deref(),
                competency_id: &exercise.competency_id,
            })
        })
        .collect::<Result<Vec<_>, String>>()?;
    let state = LearningState {
        profile_ready: database::get_profile(&transaction)?.is_some(),
        difficulty: database::get_difficulty(&transaction)?,
        topics: &catalog.topics,
        curriculum_source: &catalog.source,
        curriculum_version: &catalog.curriculum_version,
        points_by_difficulty: [
            Difficulty::Vorschule,
            Difficulty::Koenner,
            Difficulty::Streber,
        ]
        .into_iter()
        .map(|difficulty| (difficulty.as_str(), points_for_difficulty(difficulty)))
        .collect(),
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
    let exercise = content::catalog()?
        .exercises
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
        let correct = content::is_correct(exercise, answer);
        let points = if correct && !has_entry(&transaction, "answer", question_id)? {
            points_for_difficulty(exercise.difficulty)
        } else {
            0
        };
        database::record_attempt(
            &transaction,
            exercise.subject,
            &exercise.competency_id,
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
        explanation: &exercise.explanation,
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
        connection.execute_batch("INSERT INTO point_entries (profile_id,kind,item_id,amount) VALUES (1,'answer','sample.english.plural.v1',10),(1,'answer','sample.english.we.v1',10);
            INSERT INTO answer_submissions (request_id,profile_id,question_id,answer,correct,points_awarded) VALUES ('one',1,'sample.english.plural.v1','books',1,10),('two',1,'sample.english.we.v1','are',1,10);").unwrap();
        for _ in 0..2 {
            database::record_attempt(connection, Subject::English, "fixture", true).unwrap();
        }
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
        assert_eq!((correct.points_awarded, correct.wallet.balance), (1, 1));
        let repeated =
            submit_answer(&mut connection, "again", "sample.english.cat.v1", "cat").unwrap();
        assert_eq!((repeated.points_awarded, repeated.wallet.balance), (0, 1));
        database::save_profile(
            &connection,
            Profile {
                display_name: "Alexandra".to_owned(),
                grade: 6,
            },
        )
        .unwrap();
        assert_eq!(wallet(&connection).unwrap().balance, 1);
        let progress = database::list_progress(&connection).unwrap();
        assert_eq!((progress[0].attempts, progress[0].correct), (3, 2));
    }

    #[test]
    fn request_replay_is_idempotent_and_conflicting_reuse_rejected() {
        let (_directory, mut connection) = setup();
        for _ in 0..2 {
            let result =
                submit_answer(&mut connection, "retry-id", "sample.math.add.v1", "42").unwrap();
            assert_eq!((result.points_awarded, result.wallet.balance), (1, 1));
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
        assert_eq!(database::list_progress(&reopened).unwrap()[0].correct, 2);
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
            1
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
    fn new_questions_grade_decimals_choices_and_negative_numbers_with_persistent_progress() {
        let (directory, mut connection) = setup();
        for (id, question, answer) in [
            ("decimal", "by.math.5.units.money.koenner.v1", "4.150"),
            ("negative", "by.math.5.add.equations.koenner.v1", "−13"),
            ("choice", "by.math.5.geometry.lines.vorschule.v1", "Strecke"),
            ("large", "by.math.5.add.written.koenner.v1", "4 282 221"),
        ] {
            let result = submit_answer(&mut connection, id, question, answer).unwrap();
            assert!(result.correct, "{question}");
            assert_eq!(result.points_awarded, if id == "choice" { 1 } else { 2 });
        }
        let wrong = submit_answer(
            &mut connection,
            "wrong-number",
            "by.math.5.units.money.koenner.v1",
            "415",
        )
        .unwrap();
        assert!(!wrong.correct);
        assert_eq!(wrong.wallet.balance, 7);
        drop(connection);
        let mut connection = database::open(&directory.path().join("test.sqlite3")).unwrap();
        let state = get_state(&mut connection).unwrap();
        assert_eq!(state.wallet.balance, 7);
        assert_eq!(
            state
                .questions
                .iter()
                .filter(|question| question.solved)
                .count(),
            4
        );
        assert!(!serde_json::to_value(state).unwrap()["questions"][0]
            .as_object()
            .unwrap()
            .contains_key("answer"));
    }

    #[test]
    fn version_two_upgrade_preserves_wallet_reward_retries_and_global_difficulty() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("v2.sqlite3");
        {
            let mut old = Connection::open(&path).unwrap();
            old.execute_batch(include_str!("../migrations/001_initial.sql"))
                .unwrap();
            old.execute_batch(include_str!("../migrations/002_points.sql"))
                .unwrap();
            old.pragma_update(None, "user_version", 2).unwrap();
            database::save_profile(
                &old,
                Profile {
                    display_name: "Existing".to_owned(),
                    grade: 5,
                },
            )
            .unwrap();
            earn_twenty(&mut old);
            redeem_reward(&mut old, "star").unwrap();
        }
        {
            let mut connection = database::open(&path).unwrap();
            assert_eq!(
                database::get_difficulty(&connection).unwrap(),
                Difficulty::Koenner
            );
            database::set_difficulty(&connection, "streber").unwrap();
            assert!(database::set_difficulty(&connection, "invented").is_err());
            database::save_profile(
                &connection,
                Profile {
                    display_name: "Renamed".to_owned(),
                    grade: 6,
                },
            )
            .unwrap();
            let replay =
                submit_answer(&mut connection, "one", "sample.english.plural.v1", "books").unwrap();
            assert!(replay.correct);
            assert_eq!(
                (
                    replay.points_awarded,
                    replay.wallet.balance,
                    replay.wallet.total_earned
                ),
                (10, 0, 20)
            );
            assert!(replay.wallet.rewards[0].owned);
            assert_eq!(database::list_progress(&connection).unwrap()[0].attempts, 2);
        }
        let mut reopened = database::open(&path).unwrap();
        let state = get_state(&mut reopened).unwrap();
        assert_eq!(state.difficulty, Difficulty::Streber);
        assert!(state.wallet.rewards[0].owned);
        assert_eq!(
            database::get_profile(&reopened)
                .unwrap()
                .unwrap()
                .display_name,
            "Renamed"
        );
        assert!(state
            .questions
            .iter()
            .any(|q| q.subject == Subject::English && q.difficulty == state.difficulty));
        assert!(state
            .questions
            .iter()
            .any(|q| q.subject == Subject::Mathematics && q.difficulty == state.difficulty));
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
    #[test]
    fn complete_math_catalog_awards_once_and_survives_reopening() {
        let (directory, mut connection) = setup();
        let exercises: Vec<_> = content::catalog()
            .unwrap()
            .exercises
            .iter()
            .filter(|e| !e.legacy && e.subject == Subject::Mathematics)
            .collect();
        assert_eq!(exercises.len(), 363);
        for (i, exercise) in exercises.iter().enumerate() {
            let wrong = submit_answer(
                &mut connection,
                &format!("bad-{i}"),
                &exercise.id,
                "keine passende Antwort",
            )
            .unwrap();
            assert!(!wrong.correct, "{}", exercise.id);
            assert_eq!(wrong.points_awarded, 0);
            let request = format!("good-{i}");
            let good =
                submit_answer(&mut connection, &request, &exercise.id, &exercise.answer).unwrap();
            assert!(good.correct, "{}", exercise.id);
            assert_eq!(
                good.points_awarded,
                match exercise.difficulty {
                    Difficulty::Vorschule => 1,
                    Difficulty::Koenner => 2,
                    Difficulty::Streber => 3,
                }
            );
            let replay =
                submit_answer(&mut connection, &request, &exercise.id, &exercise.answer).unwrap();
            assert_eq!(replay.wallet.balance, good.wallet.balance);
            let repeated = submit_answer(
                &mut connection,
                &format!("again-{i}"),
                &exercise.id,
                &exercise.answer,
            )
            .unwrap();
            assert_eq!(repeated.points_awarded, 0);
        }
        drop(connection);
        let mut connection = database::open(&directory.path().join("test.sqlite3")).unwrap();
        let state = get_state(&mut connection).unwrap();
        assert_eq!(state.wallet.balance, 726);
        assert_eq!(state.questions.iter().filter(|q| q.solved).count(), 363);
        for question in serde_json::to_value(&state).unwrap()["questions"]
            .as_array()
            .unwrap()
        {
            assert!(question.get("answer").is_none());
        }
        let progress = database::list_progress(&connection).unwrap();
        assert_eq!(progress.iter().map(|p| p.correct).sum::<u32>(), 726);
    }
    #[test]
    fn awards_one_two_three_in_both_subjects_independent_of_selected_level() {
        let (directory, mut connection) = setup();
        for (subject, prefix) in [
            (Subject::Mathematics, "math"),
            (Subject::English, "english"),
        ] {
            for (difficulty, expected) in [
                (Difficulty::Vorschule, 1),
                (Difficulty::Koenner, 2),
                (Difficulty::Streber, 3),
            ] {
                database::set_difficulty(
                    &connection,
                    if difficulty == Difficulty::Streber {
                        "vorschule"
                    } else {
                        "streber"
                    },
                )
                .unwrap();
                let exercise = content::catalog()
                    .unwrap()
                    .exercises
                    .iter()
                    .find(|e| !e.legacy && e.subject == subject && e.difficulty == difficulty)
                    .unwrap();
                let id = format!("{prefix}-{}", difficulty.as_str());
                let wrong = submit_answer(
                    &mut connection,
                    &format!("{id}-wrong"),
                    &exercise.id,
                    "wrong",
                )
                .unwrap();
                assert_eq!(wrong.points_awarded, 0);
                let correct =
                    submit_answer(&mut connection, &id, &exercise.id, &exercise.answer).unwrap();
                assert_eq!(correct.points_awarded, expected);
                let replay =
                    submit_answer(&mut connection, &id, &exercise.id, &exercise.answer).unwrap();
                assert_eq!(replay.points_awarded, expected);
                assert_eq!(replay.wallet.balance, correct.wallet.balance);
                let repeated = submit_answer(
                    &mut connection,
                    &format!("{id}-again"),
                    &exercise.id,
                    &exercise.answer,
                )
                .unwrap();
                assert_eq!(repeated.points_awarded, 0);
            }
        }
        drop(connection);
        let mut reopened = database::open(&directory.path().join("test.sqlite3")).unwrap();
        let state = get_state(&mut reopened).unwrap();
        assert_eq!(state.wallet.balance, 12);
        let json = serde_json::to_value(state).unwrap();
        assert_eq!(
            json["pointsByDifficulty"],
            serde_json::json!({"vorschule": 1, "koenner": 2, "streber": 3})
        );
    }

    fn old_v4(path: &std::path::Path) -> Connection {
        let old = Connection::open(path).unwrap();
        for migration in [
            include_str!("../migrations/001_initial.sql"),
            include_str!("../migrations/002_points.sql"),
            include_str!("../migrations/003_difficulty.sql"),
            include_str!("../migrations/004_arcade.sql"),
        ] {
            old.execute_batch(migration).unwrap();
        }
        old.execute_batch("INSERT INTO learner_profile VALUES (1,'Alt',5);
            INSERT INTO point_entries (profile_id,kind,item_id,amount) VALUES
            (1,'answer','sample.english.cat.v1',10),(1,'answer','sample.english.negation.v1',10),(1,'answer','sample.math.add.v1',10),(1,'reward','star',-20),(1,'game','old-game',-10);
            INSERT INTO answer_submissions VALUES ('old-easy',1,'sample.english.cat.v1','cat',1,10,'2026-09-01'),('old-hard',1,'sample.english.negation.v1','not',1,10,'2026-09-01');
            INSERT INTO game_sessions (id,profile_id,game_id) VALUES ('old-game',1,'blocks');
            UPDATE learning_settings SET difficulty='streber'; PRAGMA user_version=4;").unwrap();
        database::record_attempt(&old, Subject::English, "old.competency", true).unwrap();
        old
    }

    #[test]
    fn v5_migration_preserves_old_awards_replays_and_active_games() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("old.sqlite3");
        drop(old_v4(&path));
        let mut connection = database::open(&path).unwrap();
        for (request, question, answer) in [
            ("old-easy", "sample.english.cat.v1", "cat"),
            ("old-hard", "sample.english.negation.v1", "not"),
        ] {
            let replay = submit_answer(&mut connection, request, question, answer).unwrap();
            assert_eq!(replay.points_awarded, 10);
            assert_eq!(replay.wallet.balance, 0);
            assert_eq!(replay.wallet.total_earned, 30);
            assert!(replay.wallet.rewards[0].owned);
            assert_eq!(
                submit_answer(
                    &mut connection,
                    &format!("{request}-again"),
                    question,
                    answer
                )
                .unwrap()
                .points_awarded,
                0
            );
        }
        assert_eq!(
            crate::arcade::get_state(&mut connection)
                .unwrap()
                .active_session
                .unwrap()
                .id,
            "old-game"
        );
        assert_eq!(
            database::get_difficulty(&connection).unwrap(),
            Difficulty::Streber
        );
        assert_eq!(
            database::get_profile(&connection)
                .unwrap()
                .unwrap()
                .display_name,
            "Alt"
        );
        assert!(database::list_progress(&connection)
            .unwrap()
            .iter()
            .any(|p| p.competency_id == "old.competency" && p.correct == 1));
        assert_eq!(
            connection
                .query_row(
                    "SELECT created_at FROM answer_submissions WHERE request_id='old-easy'",
                    [],
                    |row| row.get::<_, String>(0)
                )
                .unwrap(),
            "2026-09-01"
        );
        assert_eq!(
            submit_answer(&mut connection, "new-easy", "sample.english.be.v1", "is")
                .unwrap()
                .points_awarded,
            1
        );
        assert_eq!(
            submit_answer(
                &mut connection,
                "new-hard",
                "sample.english.repair.v1",
                "goes"
            )
            .unwrap()
            .points_awarded,
            3
        );
        drop(connection);
        let mut reopened = database::open(&path).unwrap();
        assert_eq!(wallet(&reopened).unwrap().balance, 4);
        assert_eq!(
            submit_answer(&mut reopened, "old-easy", "sample.english.cat.v1", "cat")
                .unwrap()
                .points_awarded,
            10
        );
    }

    #[test]
    fn failed_v5_migration_keeps_old_answer_table_and_version() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("old.sqlite3");
        let old = old_v4(&path);
        old.execute_batch("CREATE TABLE answer_submissions_v5 (collision TEXT);")
            .unwrap();
        drop(old);
        assert!(database::open(&path).is_err());
        let old = Connection::open(&path).unwrap();
        assert_eq!(
            old.pragma_query_value(None, "user_version", |row| row.get::<_, i64>(0))
                .unwrap(),
            4
        );
        assert_eq!(
            old.query_row(
                "SELECT points_awarded FROM answer_submissions WHERE request_id='old-easy'",
                [],
                |row| row.get::<_, i64>(0)
            )
            .unwrap(),
            10
        );
        assert!(old
            .execute(
                "INSERT INTO answer_submissions VALUES ('new',1,'q','a',1,5,'today')",
                []
            )
            .is_err());
        assert_eq!(wallet(&old).unwrap().total_earned, 30);
    }
    #[test]
    fn v8_preserves_five_ten_fifteen_receipts_and_rolls_back_failed_upgrade() {
        for fail in [false, true] {
            let directory = tempfile::tempdir().unwrap();
            let path = directory.path().join("v7.db");
            let old = old_v4(&path);
            for sql in [
                include_str!("../migrations/005_difficulty_points.sql"),
                include_str!("../migrations/006_vocabulary.sql"),
                include_str!("../migrations/007_vocabulary_points.sql"),
            ] {
                old.execute_batch(sql).unwrap();
            }
            old.execute_batch("INSERT INTO answer_submissions (request_id,profile_id,question_id,answer,correct,points_awarded,created_at) VALUES ('five',1,'sample.english.be.v1','is',1,5,'2026-09-23'),('fifteen',1,'sample.english.repair.v1','goes',1,15,'2026-09-23'); INSERT INTO point_entries (profile_id,kind,item_id,amount) VALUES (1,'answer','sample.english.be.v1',5),(1,'answer','sample.english.repair.v1',15); PRAGMA user_version=7;").unwrap();
            if fail {
                old.execute_batch("CREATE TABLE answer_submissions_v8 (collision TEXT);")
                    .unwrap();
            }
            drop(old);
            if fail {
                assert!(database::open(&path).is_err());
                let old = Connection::open(&path).unwrap();
                assert_eq!(
                    old.pragma_query_value(None, "user_version", |r| r.get::<_, i64>(0))
                        .unwrap(),
                    7
                );
                assert_eq!(wallet(&old).unwrap().balance, 20);
                assert!(old
                    .execute(
                        "INSERT INTO answer_submissions VALUES ('invalid',1,'q','a',1,1,'today')",
                        []
                    )
                    .is_err());
                continue;
            }
            let mut c = database::open(&path).unwrap();
            for (id, q, a, points) in [
                ("five", "sample.english.be.v1", "is", 5),
                ("old-easy", "sample.english.cat.v1", "cat", 10),
                ("fifteen", "sample.english.repair.v1", "goes", 15),
            ] {
                let replay = submit_answer(&mut c, id, q, a).unwrap();
                assert_eq!(replay.points_awarded, points);
                assert_eq!(replay.wallet.balance, 20);
            }
            assert_eq!(
                c.query_row(
                    "SELECT created_at FROM answer_submissions WHERE request_id='five'",
                    [],
                    |r| r.get::<_, String>(0)
                )
                .unwrap(),
                "2026-09-23"
            );
            assert_eq!(
                submit_answer(&mut c, "new", "sample.english.plural.v1", "books")
                    .unwrap()
                    .points_awarded,
                2
            );
            drop(c);
            assert_eq!(wallet(&database::open(&path).unwrap()).unwrap().balance, 22);
        }
    }
}
