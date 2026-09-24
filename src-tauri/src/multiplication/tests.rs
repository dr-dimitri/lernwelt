use super::*;
use tempfile::{tempdir, TempDir};
fn setup() -> (TempDir, Connection) {
    let d = tempdir().unwrap();
    let c = database::open(&d.path().join("test.db")).unwrap();
    database::save_profile(
        &c,
        database::Profile {
            display_name: "Rechenfuchs".into(),
            grade: 5,
        },
    )
    .unwrap();
    (d, c)
}
fn input(mode: Mode, sequence: i64, answer: Option<String>) -> AnswerInput {
    AnswerInput {
        mode,
        sequence,
        answer,
    }
}
fn solve(c: &mut Connection, mode: Mode, sequence: i64) -> AnswerResult {
    let q = task(mode, sequence);
    answer(
        c,
        input(mode, sequence, Some((q.left * q.right).to_string())),
    )
    .unwrap()
}
#[test]
fn covers_every_product_and_square_within_bounds_and_repeats_in_a_new_cycle() {
    let (_d, mut c) = setup();
    for (mode, count) in [(Mode::Tables, 100), (Mode::Squares, 25)] {
        let mut pairs = std::collections::HashSet::new();
        for i in 0..count {
            let q = get_state(&mut c, mode).unwrap().task.unwrap();
            assert_eq!(q.sequence, i);
            pairs.insert((q.left, q.right));
            if mode == Mode::Tables {
                assert!((1..=10).contains(&q.left) && (1..=10).contains(&q.right));
            } else {
                assert_eq!(q.left, q.right);
                assert!((1..=25).contains(&q.left));
            }
            let result = solve(&mut c, mode, i);
            assert_eq!(result.points_awarded, 1);
            assert_eq!(result.solution, q.left * q.right);
            assert_eq!(result.state.answered, i + 1);
            assert_eq!(result.state.correct, i + 1);
        }
        assert_eq!(pairs.len(), count as usize);
        if mode == Mode::Tables {
            assert!(pairs.contains(&(10, 10)));
        } else {
            assert!(pairs.contains(&(25, 25)));
        }
        let first = task(mode, 0);
        let again = task(mode, count);
        assert_eq!((first.left, first.right), (again.left, again.right));
        assert_eq!(solve(&mut c, mode, count).points_awarded, 1);
    }
    assert_eq!(learning::wallet(&c).unwrap().balance, 127);
}
#[test]
fn awards_one_in_all_global_levels_and_preserves_retries_mode_progress_and_wallet_on_reopen() {
    let (d, mut c) = setup();
    for (i, level) in ["vorschule", "koenner", "streber"].iter().enumerate() {
        database::set_difficulty(&c, level).unwrap();
        solve(&mut c, Mode::Tables, i as i64);
        let retry = solve(&mut c, Mode::Tables, i as i64);
        assert_eq!(retry.points_awarded, 1);
        assert_eq!(retry.state.wallet.balance, i as i64 + 1);
    }
    solve(&mut c, Mode::Squares, 0);
    drop(c);
    let mut c = database::open(&d.path().join("test.db")).unwrap();
    assert_eq!(
        get_state(&mut c, Mode::Tables)
            .unwrap()
            .task
            .unwrap()
            .sequence,
        3
    );
    assert_eq!(
        get_state(&mut c, Mode::Squares)
            .unwrap()
            .task
            .unwrap()
            .sequence,
        1
    );
    assert_eq!(solve(&mut c, Mode::Tables, 0).state.wallet.balance, 4);
    assert_eq!(solve(&mut c, Mode::Squares, 0).state.wallet.total_earned, 4);
    assert!(answer(&mut c, input(Mode::Tables, 0, Some("0".into()))).is_err());
    assert_eq!(learning::wallet(&c).unwrap().balance, 4);
}
#[test]
fn wrong_and_reveal_give_zero_and_typing_validation_never_consumes_a_task() {
    let (_d, mut c) = setup();
    for (seq, value) in [(0, Some("0".into())), (1, None)] {
        let result = answer(&mut c, input(Mode::Tables, seq, value)).unwrap();
        assert!(!result.correct);
        assert_eq!(result.points_awarded, 0);
        assert_eq!(result.state.wallet.balance, 0);
        assert!(answer(
            &mut c,
            input(Mode::Tables, seq, Some(result.solution.to_string()))
        )
        .is_err());
    }
    for value in [
        "",
        " ",
        "2+2",
        "16.0",
        "16,0",
        "-1",
        "+1",
        "1e2",
        "16\n",
        "１２",
        "99999999999999999999999999999999",
    ] {
        assert!(
            answer(&mut c, input(Mode::Tables, 2, Some(value.into()))).is_err(),
            "{value}"
        );
    }
    for seq in [-1, 3, 1_000_000_000] {
        assert!(answer(&mut c, input(Mode::Tables, seq, Some("1".into()))).is_err());
    }
    assert_eq!(get_state(&mut c, Mode::Tables).unwrap().answered, 2);
    let q = task(Mode::Tables, 2);
    assert!(
        answer(
            &mut c,
            input(Mode::Tables, 2, Some(format!(" 00{} ", q.left * q.right)))
        )
        .unwrap()
        .correct
    );
    assert!(serde_json::from_str::<AnswerInput>(
        r#"{"mode":"tables","sequence":0,"answer":"16","correct":true}"#
    )
    .is_err());
    assert!(serde_json::from_str::<AnswerInput>(
        r#"{"mode":"invalid","sequence":0,"answer":"16"}"#
    )
    .is_err());
}
#[test]
fn missing_profile_and_failed_journal_write_never_leave_partial_progress() {
    let d = tempdir().unwrap();
    let mut c = database::open(&d.path().join("test.db")).unwrap();
    let state = get_state(&mut c, Mode::Tables).unwrap();
    assert!(!state.profile_ready);
    assert!(state.task.is_none());
    assert!(answer(&mut c, input(Mode::Tables, 0, Some("16".into()))).is_err());
    database::save_profile(
        &c,
        database::Profile {
            display_name: "Alex".into(),
            grade: 5,
        },
    )
    .unwrap();
    c.execute_batch("CREATE TRIGGER fail_award BEFORE INSERT ON point_entries BEGIN SELECT RAISE(ABORT,'test'); END;").unwrap();
    assert!(answer(&mut c, input(Mode::Tables, 0, Some("16".into()))).is_err());
    assert_eq!(get_state(&mut c, Mode::Tables).unwrap().answered, 0);
    c.execute_batch("DROP TRIGGER fail_award;").unwrap();
    assert_eq!(solve(&mut c, Mode::Tables, 0).state.wallet.balance, 1);
}
#[test]
fn ten_trainer_points_can_buy_a_regular_arcade_round() {
    let (_d, mut c) = setup();
    for i in 0..10 {
        solve(&mut c, Mode::Tables, i);
    }
    let result = crate::arcade::start(&mut c, "trainer-game", "blocks").unwrap();
    assert_eq!(result.wallet.balance, 0);
    assert_eq!(result.wallet.total_earned, 10);
    assert_eq!(solve(&mut c, Mode::Tables, 9).state.wallet.balance, 0);
}
#[test]
fn competing_connections_award_the_same_task_only_once() {
    let (d, c) = setup();
    drop(c);
    let barrier = std::sync::Arc::new(std::sync::Barrier::new(2));
    let handles: Vec<_> = (0..2)
        .map(|_| {
            let mut c = database::open(&d.path().join("test.db")).unwrap();
            let barrier = barrier.clone();
            std::thread::spawn(move || {
                barrier.wait();
                solve(&mut c, Mode::Tables, 0).state.wallet.balance
            })
        })
        .collect();
    for h in handles {
        assert_eq!(h.join().unwrap(), 1);
    }
    let mut c = database::open(&d.path().join("test.db")).unwrap();
    assert_eq!(get_state(&mut c, Mode::Tables).unwrap().answered, 1);
}
fn old_v8(path: &std::path::Path) -> Connection {
    let c = Connection::open(path).unwrap();
    for sql in [
        include_str!("../../migrations/001_initial.sql"),
        include_str!("../../migrations/002_points.sql"),
        include_str!("../../migrations/003_difficulty.sql"),
        include_str!("../../migrations/004_arcade.sql"),
        include_str!("../../migrations/005_difficulty_points.sql"),
        include_str!("../../migrations/006_vocabulary.sql"),
        include_str!("../../migrations/007_vocabulary_points.sql"),
        include_str!("../../migrations/008_learning_points.sql"),
    ] {
        c.execute_batch(sql).unwrap();
    }
    c.execute_batch("INSERT INTO learner_profile VALUES (1,'Bestehend',5); INSERT INTO point_entries (id,profile_id,kind,item_id,amount,created_at) VALUES (1,1,'answer','old',40,'2026-09-01'),(2,1,'reward','star',-20,'2026-09-02'),(3,1,'vocabulary','word',1,'2026-09-03'); UPDATE learning_settings SET difficulty='streber'; PRAGMA user_version=8;").unwrap();
    database::record_attempt(&c, database::Subject::English, "old.skill", true).unwrap();
    c
}
#[test]
fn upgrade_preserves_old_journal_profile_and_progress_and_rolls_back_after_rebuild_failure() {
    for fail in [false, true] {
        let d = tempdir().unwrap();
        let path = d.path().join("old.db");
        let old = old_v8(&path);
        if fail {
            old.execute_batch("CREATE TABLE multiplication_answers (collision TEXT);")
                .unwrap();
        }
        drop(old);
        if fail {
            assert!(database::open(&path).is_err());
            let old = Connection::open(&path).unwrap();
            assert_eq!(
                old.pragma_query_value(None, "user_version", |r| r.get::<_, i64>(0))
                    .unwrap(),
                8
            );
            assert_eq!(learning::wallet(&old).unwrap().balance, 21);
            assert!(old.execute("INSERT INTO point_entries (profile_id,kind,item_id,amount) VALUES (1,'multiplication','tables-0',1)",[]).is_err());
            continue;
        }
        let mut c = database::open(&path).unwrap();
        let state = get_state(&mut c, Mode::Tables).unwrap();
        assert_eq!(state.wallet.balance, 21);
        assert!(state.wallet.rewards[0].owned);
        assert_eq!(
            database::get_profile(&c).unwrap().unwrap().display_name,
            "Bestehend"
        );
        assert_eq!(database::list_progress(&c).unwrap()[0].correct, 1);
        assert_eq!(
            database::get_difficulty(&c).unwrap(),
            crate::content::Difficulty::Streber
        );
        assert_eq!(
            c.query_row("SELECT created_at FROM point_entries WHERE id=3", [], |r| r
                .get::<_, String>(0))
                .unwrap(),
            "2026-09-03"
        );
        assert_eq!(solve(&mut c, Mode::Tables, 0).state.wallet.balance, 22);
        drop(c);
        let mut c = database::open(&path).unwrap();
        assert_eq!(solve(&mut c, Mode::Tables, 0).state.wallet.balance, 22);
    }
}
