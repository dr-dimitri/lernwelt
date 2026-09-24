use super::*;
use crate::database::Profile;
fn setup(path: &std::path::Path) -> Connection {
    let c = database::open(path).unwrap();
    database::save_profile(
        &c,
        Profile {
            display_name: "Wortfuchs".to_owned(),
            grade: 5,
        },
    )
    .unwrap();
    c
}
fn input(card: &str, n: i64, known: bool) -> ReviewInput {
    ReviewInput {
        request_id: format!("card-{n}-{known}"),
        card_id: card.to_owned(),
        deck_id: "hello".to_owned(),
        difficulty: Difficulty::Koenner,
        expected_reviews: n,
        known,
    }
}
fn first(c: &Connection, time: i64) -> String {
    state_at(c, "hello", time)
        .unwrap()
        .card
        .unwrap()
        .card
        .id
        .clone()
}
#[test]
fn unknown_repeats_before_new_while_known_waits_and_progress_survives_reopen() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("vocab.db");
    let mut c = setup(&path);
    let time = 1_000_000;
    let unknown = first(&c, time);
    let result = review_at(&mut c, &input(&unknown, 0, false), time).unwrap();
    assert_eq!((result.box_number, result.due_at), (1, time + 60));
    let known = result.state.card.unwrap().card.id.clone();
    assert_ne!(unknown, known);
    let mut req = input(&known, 0, true);
    req.request_id = "known".to_owned();
    let result = review_at(&mut c, &req, time + 1).unwrap();
    assert_eq!((result.box_number, result.due_at), (2, time + 1 + 86_400));
    assert_ne!(first(&c, time + 59), unknown);
    assert_eq!(first(&c, time + 60), unknown);
    assert_eq!(state_at(&c, "hello", time + 60).unwrap().due_count, 1);
    drop(c);
    let c = database::open(&path).unwrap();
    let s = state_at(&c, "hello", time + 60).unwrap();
    assert_eq!(s.card.unwrap().card.id, unknown);
    assert_eq!(s.boxes, [1, 1, 0, 0, 0]);
    assert_eq!(s.new_count, 8);
    assert_eq!(crate::learning::wallet(&c).unwrap().balance, 0);
}
#[test]
fn all_five_boxes_increase_intervals_and_unknown_resets_even_mastered_cards() {
    let dir = tempfile::tempdir().unwrap();
    let mut c = setup(&dir.path().join("v.db"));
    let mut time = 1_000_000;
    let id = first(&c, time);
    for (n, (box_number, days)) in [(2, 1), (3, 3), (4, 7), (5, 14), (5, 14)]
        .into_iter()
        .enumerate()
    {
        let r = review_at(&mut c, &input(&id, n as i64, true), time).unwrap();
        assert_eq!(r.box_number, box_number);
        assert_eq!(r.due_at - time, days * 86_400);
        time = r.due_at;
    }
    let r = review_at(&mut c, &input(&id, 5, false), time).unwrap();
    assert_eq!((r.box_number, r.due_at), (1, time + 60));
}
#[test]
fn requests_are_idempotent_and_stale_or_early_reviews_cannot_advance_cards() {
    let dir = tempfile::tempdir().unwrap();
    let mut c = setup(&dir.path().join("v.db"));
    let time = 1_000_000;
    let id = first(&c, time);
    let request = input(&id, 0, true);
    let original = review_at(&mut c, &request, time).unwrap();
    let retry = review_at(&mut c, &request, time + 100).unwrap();
    assert_eq!(original.due_at, retry.due_at);
    let mut changed = input(&id, 0, false);
    changed.request_id = request.request_id.clone();
    assert!(review_at(&mut c, &changed, time).is_err());
    let mut stale = input(&id, 0, true);
    stale.request_id = "different-request".to_owned();
    assert!(review_at(&mut c, &stale, time + 86_400).is_err());
    assert!(review_at(&mut c, &input(&id, 1, true), time + 86_399).is_err());
    assert_eq!(progress(&c, Difficulty::Koenner).unwrap()[&id].reviews, 1);
    assert!(review_at(&mut c, &input(&id, 1, true), time + 86_400).is_ok());
}
#[test]
fn filters_empty_state_and_difficulty_isolation_are_consistent() {
    let dir = tempfile::tempdir().unwrap();
    let mut c = setup(&dir.path().join("v.db"));
    let time = 1_000_000;
    let mut ids = Vec::new();
    for n in 0..10 {
        let id = first(&c, time);
        let mut request = input(&id, 0, true);
        request.request_id = format!("word-{n}");
        review_at(&mut c, &request, time).unwrap();
        ids.push(id);
    }
    let done = state_at(&c, "hello", time).unwrap();
    assert!(done.card.is_none());
    assert_eq!(done.new_count, 0);
    assert_eq!(done.due_count, 0);
    assert_eq!(done.next_due_at, Some(time + 86_400));
    assert_eq!(state_at(&c, "family", time).unwrap().new_count, 10);
    assert_eq!(state_at(&c, "all", time).unwrap().total, 120);
    assert_eq!(state_at(&c, "hello", time + 86_400).unwrap().due_count, 10);
    database::set_difficulty(&c, "streber").unwrap();
    let s = state_at(&c, "hello", time).unwrap();
    assert_eq!(s.new_count, 10);
    assert_eq!(s.boxes, [0; 5]);
    assert!(review_at(&mut c, &input(&ids[0], 1, true), time + 86_400).is_err());
    let mut request = input(&ids[0], 0, false);
    request.difficulty = Difficulty::Streber;
    review_at(&mut c, &request, time).unwrap();
    database::set_difficulty(&c, "koenner").unwrap();
    assert_eq!(state_at(&c, "hello", time).unwrap().boxes, [0, 10, 0, 0, 0]);
}
#[test]
fn profile_and_inputs_are_validated_without_writes() {
    let dir = tempfile::tempdir().unwrap();
    let mut c = database::open(&dir.path().join("v.db")).unwrap();
    let time = 1_000_000;
    let id = &bank().unwrap().cards[0].id;
    assert!(!state_at(&c, "all", time).unwrap().profile_ready);
    assert!(state_at(&c, "all", time).unwrap().card.is_none());
    assert!(review_at(&mut c, &input(id, 0, true), time).is_err());
    database::save_profile(
        &c,
        Profile {
            display_name: "Alex".to_owned(),
            grade: 5,
        },
    )
    .unwrap();
    for bad in ["", "bad request", "sql';", &"a".repeat(81)] {
        let mut r = input(id, 0, true);
        r.request_id = bad.to_owned();
        assert!(review_at(&mut c, &r, time).is_err());
    }
    assert!(review_at(&mut c, &input("unknown", 0, true), time).is_err());
    assert!(review_at(&mut c, &input(id, -1, true), time).is_err());
    let mut r = input(id, 0, true);
    r.deck_id = "family".to_owned();
    assert!(review_at(&mut c, &r, time).is_err());
    assert!(state_at(&c, "unknown", time).is_err());
    assert!(progress(&c, Difficulty::Koenner).unwrap().is_empty());
}
#[test]
fn failed_receipt_insert_rolls_back_progress_and_can_be_retried() {
    let dir = tempfile::tempdir().unwrap();
    let mut c = setup(&dir.path().join("v.db"));
    let time = 1_000_000;
    let id = first(&c, time);
    let r = input(&id, 0, true);
    c.execute_batch("CREATE TRIGGER fail_review BEFORE INSERT ON vocabulary_reviews BEGIN SELECT RAISE(ABORT,'test'); END;").unwrap();
    assert!(review_at(&mut c, &r, time).is_err());
    assert!(progress(&c, Difficulty::Koenner).unwrap().is_empty());
    c.execute_batch("DROP TRIGGER fail_review;").unwrap();
    assert!(review_at(&mut c, &r, time).is_ok());
}
#[test]
fn embedded_cards_have_consistent_cloze_examples_and_reject_broken_content() {
    let bank = bank().unwrap();
    assert_eq!(bank.cards.len(), 120);
    assert_eq!(bank.decks.len(), 12);
    let mut broken: Bank =
        serde_json::from_str(include_str!("../../content/vocabulary-5-v1.json")).unwrap();
    broken.cards[0].cloze = "No gap.".to_owned();
    assert!(broken.validate().is_err());
}

fn old_v5(path: &std::path::Path) -> Connection {
    let c = Connection::open(path).unwrap();
    for sql in [
        include_str!("../../migrations/001_initial.sql"),
        include_str!("../../migrations/002_points.sql"),
        include_str!("../../migrations/003_difficulty.sql"),
        include_str!("../../migrations/004_arcade.sql"),
        include_str!("../../migrations/005_difficulty_points.sql"),
    ] {
        c.execute_batch(sql).unwrap();
    }
    c.pragma_update(None, "user_version", 5).unwrap();
    database::save_profile(
        &c,
        Profile {
            display_name: "Bestand".to_owned(),
            grade: 5,
        },
    )
    .unwrap();
    database::set_difficulty(&c, "streber").unwrap();
    database::record_attempt(&c, database::Subject::English, "existing", true).unwrap();
    c.execute_batch("INSERT INTO point_entries(profile_id,kind,item_id,amount) VALUES (1,'answer','historical',50),(1,'reward','star',-20),(1,'game','existing-round',-10);
      INSERT INTO answer_submissions VALUES ('old-request',1,'sample.english.cat.v1','cat',1,10,'2026-09-01');
      INSERT INTO game_sessions VALUES ('existing-round',1,'space',NULL,'2026-09-01');").unwrap();
    c
}
#[test]
fn migration_from_v5_preserves_learning_points_rewards_games_and_profile() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("old.db");
    drop(old_v5(&path));
    let mut c = database::open(&path).unwrap();
    assert_eq!(
        c.pragma_query_value(None, "user_version", |r| r.get::<_, i64>(0))
            .unwrap(),
        6
    );
    assert_eq!(
        database::get_profile(&c).unwrap().unwrap().display_name,
        "Bestand"
    );
    assert_eq!(database::get_difficulty(&c).unwrap(), Difficulty::Streber);
    assert_eq!(database::list_progress(&c).unwrap()[0].correct, 1);
    let wallet = crate::learning::wallet(&c).unwrap();
    assert_eq!((wallet.balance, wallet.total_earned), (20, 50));
    assert!(wallet.rewards.iter().any(|r| r.id == "star" && r.owned));
    assert_eq!(
        c.query_row(
            "SELECT created_at FROM game_sessions WHERE id='existing-round' AND score IS NULL",
            [],
            |r| r.get::<_, String>(0)
        )
        .unwrap(),
        "2026-09-01"
    );
    assert_eq!(
        crate::learning::submit_answer(&mut c, "old-request", "sample.english.cat.v1", "cat")
            .unwrap()
            .points_awarded,
        10
    );
    let id = first(&c, 1_000_000);
    let mut req = input(&id, 0, true);
    req.difficulty = Difficulty::Streber;
    review_at(&mut c, &req, 1_000_000).unwrap();
    drop(c);
    let c = database::open(&path).unwrap();
    assert_eq!(
        state_at(&c, "hello", 1_000_000).unwrap().boxes,
        [0, 1, 0, 0, 0]
    );
    assert_eq!(crate::learning::wallet(&c).unwrap().balance, 20);
}
#[test]
fn failed_v6_migration_rolls_back_both_new_tables_and_keeps_old_data() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("old.db");
    let c = old_v5(&path);
    c.execute_batch("CREATE TABLE vocabulary_reviews (existing TEXT); INSERT INTO vocabulary_reviews VALUES ('keep');").unwrap();
    drop(c);
    assert!(database::open(&path).is_err());
    let c = Connection::open(&path).unwrap();
    assert_eq!(
        c.pragma_query_value(None, "user_version", |r| r.get::<_, i64>(0))
            .unwrap(),
        5
    );
    assert_eq!(
        c.query_row(
            "SELECT count(*) FROM sqlite_master WHERE name='vocabulary_progress'",
            [],
            |r| r.get::<_, i64>(0)
        )
        .unwrap(),
        0
    );
    assert_eq!(
        c.query_row("SELECT existing FROM vocabulary_reviews", [], |r| r
            .get::<_, String>(0))
            .unwrap(),
        "keep"
    );
    assert_eq!(crate::learning::wallet(&c).unwrap().balance, 20);
}
