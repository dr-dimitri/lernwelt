use super::*;
use crate::{
    arcade,
    content::Difficulty,
    database::{self, Profile, Subject},
    learning, mission, multiplication, roman, typing, vocabulary,
};
use rusqlite::Connection;
use serde::de::DeserializeOwned;
use serde_json::{json, Value};
use tempfile::{tempdir, TempDir};

fn setup() -> (TempDir, Connection) {
    let directory = tempdir().unwrap();
    let connection = database::open(&directory.path().join("achievements.sqlite3")).unwrap();
    database::save_profile(
        &connection,
        Profile {
            display_name: "Lernfuchs".to_owned(),
            grade: 5,
        },
    )
    .unwrap();
    (directory, connection)
}

fn input<T: DeserializeOwned>(value: Value) -> T {
    serde_json::from_value(value).unwrap()
}

fn value<T: Serialize>(data: &T) -> Value {
    serde_json::to_value(data).unwrap()
}

fn tasks(connection: &Connection) -> i64 {
    learning::wallet(connection)
        .unwrap()
        .achievements
        .completed_tasks
}

#[test]
fn first_start_has_a_truthful_start_rank_and_required_camel_case_projection() {
    let directory = tempdir().unwrap();
    let connection = database::open(&directory.path().join("empty.sqlite3")).unwrap();
    let wallet = learning::wallet(&connection).unwrap();
    assert_eq!((wallet.balance, wallet.total_earned), (0, 0));
    assert_eq!(
        value(&wallet)["achievements"],
        json!({
            "completedTasks": 0,
            "currentId": "startklar",
            "unlockedIds": ["startklar"],
            "nextId": "funkenfinder"
        })
    );
}

#[test]
fn each_rank_needs_both_inclusive_thresholds_and_keeps_all_lower_ranks() {
    let levels = levels().unwrap();
    for (index, level) in levels.iter().enumerate() {
        let earned = progress(level.required_points, level.required_tasks).unwrap();
        assert_eq!(earned.current_id, level.id);
        assert_eq!(
            earned.unlocked_ids,
            levels[..=index]
                .iter()
                .map(|level| level.id.clone())
                .collect::<Vec<_>>()
        );
        assert_eq!(
            earned.next_id,
            levels.get(index + 1).map(|level| level.id.clone())
        );
        if index > 0 {
            assert_eq!(
                progress(level.required_points - 1, i64::MAX)
                    .unwrap()
                    .current_id,
                levels[index - 1].id
            );
            assert_eq!(
                progress(i64::MAX, level.required_tasks - 1)
                    .unwrap()
                    .current_id,
                levels[index - 1].id
            );
        }
    }
    let highest = progress(i64::MAX, i64::MAX).unwrap();
    assert_eq!(highest.unlocked_ids.len(), levels.len());
    assert!(highest.next_id.is_none());
    assert!(progress(-1, 0).is_err());
    assert!(progress(0, -1).is_err());
}

#[test]
fn bundled_thresholds_are_exact_and_invalid_rank_sequences_are_rejected() {
    let original = levels().unwrap();
    assert_eq!(
        original
            .iter()
            .map(|level| (level.required_points, level.required_tasks))
            .collect::<Vec<_>>(),
        [
            (0, 0),
            (10, 5),
            (50, 20),
            (150, 60),
            (400, 150),
            (1000, 400)
        ]
    );
    assert!(validate(&[]).is_err());
    for (index, points, tasks) in [(0, 1, 0), (0, 0, 1), (1, 0, 5), (1, 10, 0), (1, -1, 5)] {
        let mut invalid = original.to_vec();
        invalid[index].required_points = points;
        invalid[index].required_tasks = tasks;
        assert!(validate(&invalid).is_err());
    }
    for id in ["", "Startklar", "../startklar", "startklar"] {
        let mut invalid = original.to_vec();
        invalid[1].id = id.to_owned();
        assert!(validate(&invalid).is_err());
    }
    let mut invalid = original.to_vec();
    invalid[2].required_points = invalid[1].required_points;
    assert!(validate(&invalid).is_err());
    invalid = original.to_vec();
    invalid[2].required_tasks = invalid[1].required_tasks;
    assert!(validate(&invalid).is_err());
}

#[test]
fn historical_credits_survive_upgrade_profile_edit_spending_replays_and_reopen() {
    let directory = tempdir().unwrap();
    let path = directory.path().join("legacy.sqlite3");
    let old = Connection::open(&path).unwrap();
    old.execute_batch(include_str!("../../migrations/001_initial.sql"))
        .unwrap();
    old.execute_batch(include_str!("../../migrations/002_points.sql"))
        .unwrap();
    database::save_profile(
        &old,
        Profile {
            display_name: "Alte Entdeckungen".to_owned(),
            grade: 5,
        },
    )
    .unwrap();
    for id in ["sample.english.cat.v1", "old-2", "old-3", "old-4", "old-5"] {
        old.execute(
            "INSERT INTO point_entries (profile_id,kind,item_id,amount,created_at) VALUES (1,'answer',?1,10,'2026-09-01')",
            [id],
        )
        .unwrap();
    }
    old.execute_batch(
        "INSERT INTO answer_submissions (request_id,profile_id,question_id,answer,correct,points_awarded) VALUES
         ('legacy-answer',1,'sample.english.cat.v1','cat',1,10),
         ('legacy-repeat',1,'sample.english.cat.v1','cat',1,0),
         ('legacy-wrong',1,'sample.english.cat.v1','dog',0,0);
         PRAGMA user_version=2;",
    )
    .unwrap();
    database::record_attempt(&old, Subject::English, "manual-old-progress", true).unwrap();
    drop(old);

    let mut connection = database::open(&path).unwrap();
    let initial = learning::wallet(&connection).unwrap();
    assert_eq!(
        (initial.total_earned, initial.achievements.completed_tasks),
        (50, 5)
    );
    assert_eq!(initial.achievements.current_id, "funkenfinder");
    assert_eq!(initial.achievements.next_id.as_deref(), Some("lernfuchs"));
    let replay = learning::submit_answer(
        &mut connection,
        "legacy-answer",
        "sample.english.cat.v1",
        "cat",
    )
    .unwrap();
    assert_eq!(replay.points_awarded, 10);
    assert_eq!(replay.wallet.achievements, initial.achievements);
    let redeemed = learning::redeem_reward(&mut connection, "star").unwrap();
    assert_eq!(redeemed.balance, 30);
    assert_eq!(redeemed.achievements, initial.achievements);
    assert!(redeemed
        .rewards
        .iter()
        .any(|reward| reward.id == "star" && reward.owned));
    arcade::start(&mut connection, "paid-game", "blocks").unwrap();
    database::save_profile(
        &connection,
        Profile {
            display_name: "Neuer Name".to_owned(),
            grade: 5,
        },
    )
    .unwrap();
    drop(connection);

    let mut reopened = database::open(&path).unwrap();
    let wallet = learning::wallet(&reopened).unwrap();
    assert_eq!((wallet.balance, wallet.total_earned), (20, 50));
    assert_eq!(wallet.achievements, initial.achievements);
    assert!(wallet
        .rewards
        .iter()
        .any(|reward| reward.id == "star" && reward.owned));
    let historical: i64 = reopened
        .query_row(
            "SELECT COUNT(*) FROM point_entries WHERE amount=10 AND created_at='2026-09-01'",
            [],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(historical, 5);
    assert_eq!(
        learning::submit_answer(&mut reopened, "new-repeat", "sample.english.cat.v1", "cat")
            .unwrap()
            .wallet
            .achievements,
        initial.achievements
    );
}

#[test]
fn ordinary_and_roman_answers_count_first_solutions_without_counting_retries_or_wrong_answers() {
    let (_directory, mut connection) = setup();
    let wrong =
        learning::submit_answer(&mut connection, "wrong", "sample.math.add.v1", "43").unwrap();
    assert!(!wrong.correct);
    assert_eq!(wrong.wallet.achievements.completed_tasks, 0);
    for request in ["first", "first", "new-request-same-exercise"] {
        let result =
            learning::submit_answer(&mut connection, request, "sample.math.add.v1", "42").unwrap();
        assert_eq!(result.wallet.achievements.completed_tasks, 1);
    }
    let question =
        roman::get_question(&mut connection, roman::Direction::RomanToDecimal, None).unwrap();
    let question = value(&question);
    let id = question["id"].as_str().unwrap();
    let exercise = roman::exercise_from_id(id).unwrap();
    for request in ["roman", "roman", "roman-repeat"] {
        let result =
            learning::submit_answer(&mut connection, request, id, &exercise.answer).unwrap();
        assert!(result.correct);
        assert_eq!(result.wallet.achievements.completed_tasks, 2);
    }
}

#[test]
fn typing_counts_a_confirmed_first_solution_only_and_returns_the_updated_projection() {
    let (_directory, mut connection) = setup();
    let state = value(&typing::get_state(&mut connection).unwrap());
    let task = state["stations"][0]["tasks"]
        .as_array()
        .unwrap()
        .iter()
        .find(|task| task["difficulty"] == "koenner")
        .unwrap();
    let id = task["id"].as_str().unwrap();
    let text = task["text"].as_str().unwrap();
    let wrong = typing::submit(
        &mut connection,
        input(json!({"requestId":"typing-wrong","taskId":id,"answer":"wrong"})),
    )
    .unwrap();
    assert_eq!(value(&wrong)["wallet"]["achievements"]["completedTasks"], 0);
    for request in ["typing-correct", "typing-correct", "typing-repeat"] {
        let result = typing::submit(
            &mut connection,
            input(json!({"requestId":request,"taskId":id,"answer":text})),
        )
        .unwrap();
        assert_eq!(
            value(&result)["wallet"]["achievements"]["completedTasks"],
            1
        );
    }
    assert_eq!(tasks(&connection), 1);
}

#[test]
fn vocabulary_counts_new_checked_reviews_including_due_repetition_but_not_reveal_wrong_or_retry() {
    let (_directory, mut connection) = setup();
    let current = value(
        &vocabulary::get_state(&mut connection, "all", vocabulary::Selection::default()).unwrap(),
    );
    let reveal = json!({"requestId":"vocab-reveal","cardId":current["card"]["card"]["id"],"deckId":"all","difficulty":"koenner","expectedReviews":0,"answer":null});
    let result = vocabulary::review(&mut connection, input(reveal)).unwrap();
    assert_eq!(tasks(&connection), 0);
    let current = value(&result)["state"].clone();
    let wrong = json!({"requestId":"vocab-wrong","cardId":current["card"]["card"]["id"],"deckId":"all","difficulty":"koenner","expectedReviews":0,"answer":"never-the-correct-translation"});
    let result = vocabulary::review(&mut connection, input(wrong)).unwrap();
    assert_eq!(tasks(&connection), 0);
    let current = value(&result)["state"].clone();
    let card = &current["card"]["card"];
    let first = json!({"requestId":"vocab-first","cardId":card["id"],"deckId":"all","difficulty":"koenner","expectedReviews":0,"answer":card["english"]});
    for _ in 0..2 {
        let result = vocabulary::review(&mut connection, input(first.clone())).unwrap();
        assert_eq!(
            value(&result)["state"]["wallet"]["achievements"]["completedTasks"],
            1
        );
    }
    connection
        .execute(
            "UPDATE vocabulary_progress SET due_at=0 WHERE card_id=?1 AND difficulty='koenner'",
            [card["id"].as_str().unwrap()],
        )
        .unwrap();
    let due = json!({"requestId":"vocab-due","cardId":card["id"],"deckId":"all","difficulty":"koenner","expectedReviews":1,"answer":card["english"]});
    for _ in 0..2 {
        let result = vocabulary::review(&mut connection, input(due.clone())).unwrap();
        assert_eq!(
            value(&result)["state"]["wallet"]["achievements"]["completedTasks"],
            2
        );
    }
    assert!(serde_json::from_value::<vocabulary::ReviewInput>(json!({"requestId":"manual","cardId":card["id"],"deckId":"all","difficulty":"koenner","expectedReviews":2,"known":true})).is_err());
}

#[test]
fn multiplication_counts_new_correct_sequences_but_not_wrong_reveal_or_replay() {
    let (_directory, mut connection) = setup();
    for answer in [Some("0".to_owned()), None] {
        let task = multiplication::get_state(&mut connection, multiplication::Mode::Tables)
            .unwrap()
            .task
            .unwrap();
        let result = multiplication::answer(
            &mut connection,
            multiplication::AnswerInput {
                mode: multiplication::Mode::Tables,
                sequence: task.sequence,
                answer,
            },
        )
        .unwrap();
        assert_eq!(result.state.wallet.achievements.completed_tasks, 0);
    }
    for count in 1..=2 {
        let task = multiplication::get_state(&mut connection, multiplication::Mode::Tables)
            .unwrap()
            .task
            .unwrap();
        for _ in 0..2 {
            let result = multiplication::answer(
                &mut connection,
                multiplication::AnswerInput {
                    mode: multiplication::Mode::Tables,
                    sequence: task.sequence,
                    answer: Some((task.left * task.right).to_string()),
                },
            )
            .unwrap();
            assert_eq!(result.state.wallet.achievements.completed_tasks, count);
        }
    }
}

#[test]
fn mission_answers_count_confirmed_solutions_while_reveal_and_activity_give_no_progress() {
    let (_directory, mut connection) = setup();
    let state = mission::start(
        &mut connection,
        mission::StartInput {
            request_id: "mission-round".to_owned(),
            difficulty: Difficulty::Koenner,
            topic_id: None,
        },
    )
    .unwrap();
    let state = value(&state);
    let session = state["session"]["id"].as_str().unwrap();
    // The presented variant is numbered from 1; authored variants start at 0.
    let variant = state["session"]["variant"].as_u64().unwrap() - 1;
    let catalog: Value =
        serde_json::from_str(include_str!("../../content/mission-garden-v1.json")).unwrap();
    let authored = catalog["variants"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["difficulty"] == "koenner" && v["variant"] == variant)
        .unwrap();
    let act = |connection: &mut Connection,
               request: &str,
               index: u8,
               action: mission::Action,
               answer: Option<String>| {
        mission::act(
            connection,
            mission::ActionInput {
                request_id: request.to_owned(),
                session_id: session.to_owned(),
                step_index: index,
                action,
                answer,
            },
        )
        .unwrap()
    };
    for _ in 0..2 {
        let result = act(
            &mut connection,
            "mission-answer",
            0,
            mission::Action::Answer,
            Some(authored["recall"]["answer"].as_str().unwrap().to_owned()),
        );
        assert_eq!(
            value(&result)["wallet"]["achievements"]["completedTasks"],
            1
        );
    }
    act(
        &mut connection,
        "mission-next-0",
        0,
        mission::Action::Next,
        None,
    );
    act(
        &mut connection,
        "mission-next-1",
        1,
        mission::Action::Next,
        None,
    );
    act(
        &mut connection,
        "mission-reveal",
        2,
        mission::Action::Reveal,
        None,
    );
    act(
        &mut connection,
        "mission-next-2",
        2,
        mission::Action::Next,
        None,
    );
    let wrong = authored["detect"]["options"]
        .as_array()
        .unwrap()
        .iter()
        .find(|option| **option != authored["detect"]["answer"])
        .unwrap()
        .as_str()
        .unwrap();
    act(
        &mut connection,
        "mission-wrong",
        3,
        mission::Action::Answer,
        Some(wrong.to_owned()),
    );
    act(
        &mut connection,
        "mission-next-3",
        3,
        mission::Action::Next,
        None,
    );
    let finished = act(
        &mut connection,
        "mission-activity",
        4,
        mission::Action::Reveal,
        None,
    );
    assert_eq!(
        value(&finished)["wallet"]["achievements"]["completedTasks"],
        1
    );
    assert_eq!(tasks(&connection), 1);
}

#[test]
fn database_failure_does_not_fabricate_an_achievement_projection() {
    let (_directory, connection) = setup();
    connection
        .execute_batch("DROP TABLE point_entries;")
        .unwrap();
    assert!(learning::wallet(&connection).is_err());
}
