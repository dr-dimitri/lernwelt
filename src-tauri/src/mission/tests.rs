use super::*;
use tempfile::{tempdir, TempDir};

const TIME: i64 = 1_000_000;
fn setup() -> (TempDir, Connection) {
    let dir = tempdir().unwrap();
    let c = database::open(&dir.path().join("mission.db")).unwrap();
    database::save_profile(
        &c,
        database::Profile {
            display_name: "Gartenfuchs".into(),
            grade: 5,
        },
    )
    .unwrap();
    (dir, c)
}
fn start_request(id: &str, difficulty: Difficulty) -> StartInput {
    StartInput {
        request_id: id.into(),
        difficulty,
    }
}
fn request(
    id: &str,
    session: &str,
    index: u8,
    action: Action,
    answer: Option<&str>,
) -> ActionInput {
    ActionInput {
        request_id: id.into(),
        session_id: session.into(),
        step_index: index,
        action,
        answer: answer.map(str::to_owned),
    }
}
fn answer_current(c: &mut Connection, id: &str, time: i64) -> MissionState {
    let s = latest_session(c, database::get_difficulty(c).unwrap())
        .unwrap()
        .unwrap();
    let answer = &exercise(variant(&s).unwrap(), s.current_step)
        .unwrap()
        .answer;
    act_at(
        c,
        request(id, &s.id, s.current_step, Action::Answer, Some(answer)),
        time,
    )
    .unwrap()
}
fn finish(c: &mut Connection, session: &str, time: i64) -> MissionState {
    loop {
        let s = latest_session(c, database::get_difficulty(c).unwrap())
            .unwrap()
            .unwrap();
        assert_eq!(s.id, session);
        if s.current_step == 5 {
            return get_state_at(c, time).unwrap();
        }
        let step = stored_step(c, session, s.current_step).unwrap();
        if exercise(variant(&s).unwrap(), s.current_step).is_some() && step.outcome.is_none() {
            answer_current(c, &format!("{session}-answer-{}", s.current_step), time);
        } else {
            let action = if s.current_step == 4 {
                Action::Skip
            } else {
                Action::Next
            };
            act_at(
                c,
                request(
                    &format!("{session}-next-{}", s.current_step),
                    session,
                    s.current_step,
                    action,
                    None,
                ),
                time,
            )
            .unwrap();
        }
    }
}

#[test]
fn content_is_bounded_and_ipc_hides_unearned_hints_and_answers() {
    let (_dir, mut c) = setup();
    assert_eq!(catalog().unwrap().variants.len(), 9);
    let s = start_at(&mut c, start_request("round", Difficulty::Koenner), TIME).unwrap();
    let json = serde_json::to_value(&s).unwrap();
    let step = &json["session"]["currentStep"];
    assert!(step["hint"].is_null());
    assert!(step["feedback"].is_null());
    assert!(step.get("answer").is_none());
    assert!(step.get("explanation").is_none());
    assert!(json.get("variants").is_none());
    for v in &catalog().unwrap().variants {
        for e in [&v.recall, &v.solve] {
            let d = e.diagram.as_ref().unwrap();
            assert_eq!(d.width.is_none(), v.difficulty == Difficulty::Streber);
            if let Some(width) = d.width {
                assert_eq!(
                    e.answer.parse::<u32>().unwrap(),
                    2 * (width + d.height.unwrap())
                );
            }
        }
        assert_eq!(
            v.detect
                .options
                .iter()
                .filter(|o| **o == v.detect.answer)
                .count(),
            1
        );
    }
}

#[test]
fn profile_and_commands_reject_invalid_inputs_without_writes() {
    let d = tempdir().unwrap();
    let mut c = database::open(&d.path().join("none.db")).unwrap();
    assert!(!get_state_at(&mut c, TIME).unwrap().profile_ready);
    assert!(start_at(&mut c, start_request("start", Difficulty::Koenner), TIME).is_err());
    database::save_profile(
        &c,
        database::Profile {
            display_name: "Test".into(),
            grade: 5,
        },
    )
    .unwrap();
    assert!(start_at(&mut c, start_request("bad id", Difficulty::Koenner), TIME).is_err());
    assert!(start_at(
        &mut c,
        start_request("wrong-level", Difficulty::Streber),
        TIME
    )
    .is_err());
    start_at(&mut c, start_request("round", Difficulty::Koenner), TIME).unwrap();
    for input in [
        request("wrong", "missing", 0, Action::Answer, Some("22")),
        request("wrong", "round", 0, Action::Answer, Some("22 m")),
        request("wrong", "round", 0, Action::Answer, Some("")),
        request("wrong", "round", 0, Action::Hint, Some("22")),
        request("wrong", "round", 0, Action::Next, None),
        request("wrong", "round", 0, Action::Skip, None),
    ] {
        assert!(act_at(&mut c, input, TIME).is_err());
    }
    assert!(serde_json::from_str::<ActionInput>(r#"{"requestId":"a","sessionId":"round","stepIndex":0,"action":"answer","answer":"22","points":100}"#).is_err());
    assert!(
        serde_json::from_str::<StartInput>(r#"{"requestId":"a","difficulty":"easy"}"#).is_err()
    );
    assert_eq!(learning::wallet(&c).unwrap().balance, 0);
    assert!(stored_step(&c, "round", 0).unwrap().outcome.is_none());
}

#[test]
fn committed_feedback_and_hint_survive_reopen_retries_and_stale_calls() {
    let (dir, mut c) = setup();
    start_at(&mut c, start_request("round", Difficulty::Koenner), TIME).unwrap();
    let s = act_at(
        &mut c,
        request("hint", "round", 0, Action::Hint, None),
        TIME,
    )
    .unwrap();
    assert!(s.session.unwrap().current_step.unwrap().hint.is_some());
    drop(c);
    let mut c = database::open(&dir.path().join("mission.db")).unwrap();
    let s = answer_current(&mut c, "answer", TIME);
    let f = s.session.unwrap().current_step.unwrap().feedback.unwrap();
    assert_eq!(f.correct, Some(true));
    assert_eq!(f.points_awarded, 2);
    assert!(!f.independent);
    assert!(!s.progress.solved_independently);
    drop(c);
    let mut c = database::open(&dir.path().join("mission.db")).unwrap();
    assert!(get_state_at(&mut c, TIME)
        .unwrap()
        .session
        .unwrap()
        .current_step
        .unwrap()
        .feedback
        .is_some());
    let s = act_at(
        &mut c,
        request("answer", "round", 0, Action::Answer, Some("22")),
        TIME,
    )
    .unwrap();
    assert_eq!(s.wallet.balance, 2);
    assert!(act_at(
        &mut c,
        request("answer", "round", 0, Action::Answer, Some("1")),
        TIME
    )
    .is_err());
    assert!(act_at(
        &mut c,
        request("different-answer", "round", 0, Action::Answer, Some("22")),
        TIME
    )
    .is_err());
    act_at(
        &mut c,
        request("next", "round", 0, Action::Next, None),
        TIME,
    )
    .unwrap();
    let replay = act_at(
        &mut c,
        request("answer", "round", 0, Action::Answer, Some("22")),
        TIME,
    )
    .unwrap();
    assert_eq!(replay.session.unwrap().current_step.unwrap().index, 1);
    assert_eq!(replay.wallet.balance, 2);
    assert!(act_at(
        &mut c,
        request("stale-next", "round", 0, Action::Next, None),
        TIME
    )
    .is_err());
    assert!(act_at(
        &mut c,
        request("stale-hint", "round", 0, Action::Hint, None),
        TIME
    )
    .is_err());
}

#[test]
fn wrong_reveal_and_optional_activity_keep_truthful_feedback_without_points() {
    let (_dir, mut c) = setup();
    start_at(&mut c, start_request("round", Difficulty::Koenner), TIME).unwrap();
    let s = act_at(
        &mut c,
        request("wrong", "round", 0, Action::Answer, Some("1")),
        TIME,
    )
    .unwrap();
    let f = s.session.unwrap().current_step.unwrap().feedback.unwrap();
    assert_eq!(f.correct, Some(false));
    assert!(!f.explanation.is_empty());
    assert_eq!(s.wallet.balance, 0);
    act_at(
        &mut c,
        request("next0", "round", 0, Action::Next, None),
        TIME,
    )
    .unwrap();
    assert!(act_at(
        &mut c,
        request("bad-reveal", "round", 1, Action::Reveal, None),
        TIME
    )
    .is_err());
    act_at(
        &mut c,
        request("next1", "round", 1, Action::Next, None),
        TIME,
    )
    .unwrap();
    let s = act_at(
        &mut c,
        request("reveal2", "round", 2, Action::Reveal, None),
        TIME,
    )
    .unwrap();
    assert_eq!(s.wallet.balance, 0);
    assert!(
        s.session
            .unwrap()
            .current_step
            .unwrap()
            .feedback
            .unwrap()
            .revealed
    );
    act_at(
        &mut c,
        request("next2", "round", 2, Action::Next, None),
        TIME,
    )
    .unwrap();
    assert!(act_at(
        &mut c,
        request(
            "invalid-choice",
            "round",
            3,
            Action::Answer,
            Some("invented")
        ),
        TIME
    )
    .is_err());
    act_at(
        &mut c,
        request("reveal3", "round", 3, Action::Reveal, None),
        TIME,
    )
    .unwrap();
    act_at(
        &mut c,
        request("next3", "round", 3, Action::Next, None),
        TIME,
    )
    .unwrap();
    assert!(act_at(
        &mut c,
        request("bad-next4", "round", 4, Action::Next, None),
        TIME
    )
    .is_err());
    let s = act_at(
        &mut c,
        request("check", "round", 4, Action::Reveal, None),
        TIME,
    )
    .unwrap();
    let f = s.session.unwrap().current_step.unwrap().feedback.unwrap();
    assert_eq!(f.correct, None);
    assert_eq!(f.points_awarded, 0);
    let s = act_at(
        &mut c,
        request("done", "round", 4, Action::Next, None),
        TIME,
    )
    .unwrap();
    assert!(s.session.unwrap().completed);
    assert_eq!(s.progress.completed_rounds, 1);
    assert!(!s.progress.solved_independently);
    assert_eq!(s.wallet.balance, 0);
}

#[test]
fn each_difficulty_and_finite_variant_award_only_first_solutions() {
    let (_dir, mut c) = setup();
    let mut expected = 0;
    for (difficulty, points) in [
        (Difficulty::Vorschule, 1),
        (Difficulty::Koenner, 2),
        (Difficulty::Streber, 3),
    ] {
        database::set_difficulty(&c, difficulty.as_str()).unwrap();
        for round in 1..=4 {
            let id = format!("{}-{round}", difficulty.as_str());
            let s = start_at(&mut c, start_request(&id, difficulty), TIME).unwrap();
            assert_eq!(s.session.unwrap().variant, (round - 1) % 3 + 1);
            let s = finish(&mut c, &id, TIME);
            if round <= 3 {
                expected += 3 * points;
            }
            assert_eq!(s.wallet.balance, expected);
            assert!(s.progress.solved_independently);
            assert!(!s.progress.recalled_later);
        }
    }
    assert_eq!(expected, 54);
}

#[test]
fn difficulty_switch_preserves_sessions_and_rejects_old_level_actions() {
    let (_dir, mut c) = setup();
    start_at(&mut c, start_request("koenner", Difficulty::Koenner), TIME).unwrap();
    answer_current(&mut c, "answer", TIME);
    database::set_difficulty(&c, "streber").unwrap();
    assert!(get_state_at(&mut c, TIME).unwrap().session.is_none());
    assert!(act_at(
        &mut c,
        request("stale", "koenner", 0, Action::Next, None),
        TIME
    )
    .is_err());
    start_at(&mut c, start_request("streber", Difficulty::Streber), TIME).unwrap();
    database::set_difficulty(&c, "koenner").unwrap();
    let state = start_at(&mut c, start_request("resume", Difficulty::Koenner), TIME).unwrap();
    assert_eq!(state.session.as_ref().unwrap().id, "koenner");
    assert!(state
        .session
        .unwrap()
        .current_step
        .unwrap()
        .feedback
        .is_some());
    let count: i64 = c
        .query_row("SELECT COUNT(*) FROM mission_sessions", [], |r| r.get(0))
        .unwrap();
    assert_eq!(count, 2);
}

#[test]
fn schedule_requires_delayed_unassisted_recall_and_caps_at_fourteen_days() {
    let (_dir, mut c) = setup();
    let mut time = TIME;
    for (round, days) in [(1, 1), (2, 3), (3, 7), (4, 14), (5, 14)] {
        let id = format!("round-{round}");
        start_at(&mut c, start_request(&id, Difficulty::Koenner), time).unwrap();
        let s = finish(&mut c, &id, time);
        assert_eq!(s.progress.recalled_later, round > 1);
        assert_eq!(s.due_at, Some(time + days * DAY));
        assert!(!s.due);
        assert!(get_state_at(&mut c, time + days * DAY).unwrap().due);
        time += days * DAY;
    }
    start_at(&mut c, start_request("hinted", Difficulty::Koenner), time).unwrap();
    act_at(
        &mut c,
        request("hint", "hinted", 0, Action::Hint, None),
        time,
    )
    .unwrap();
    let s = finish(&mut c, "hinted", time);
    assert_eq!(s.due_at, Some(time + DAY));
    assert!(s.progress.recalled_later); // historical achievement is retained
}

#[test]
fn extra_practice_and_old_open_round_never_invent_delayed_recall() {
    let (_dir, mut c) = setup();
    start_at(&mut c, start_request("first", Difficulty::Koenner), TIME).unwrap();
    let first = finish(&mut c, "first", TIME);
    start_at(
        &mut c,
        start_request("extra", Difficulty::Koenner),
        TIME + 100,
    )
    .unwrap();
    let extra = finish(&mut c, "extra", TIME + 100);
    assert_eq!(extra.due_at, first.due_at);
    assert!(!extra.progress.recalled_later);
    start_at(
        &mut c,
        start_request("left-open", Difficulty::Koenner),
        TIME + 200,
    )
    .unwrap();
    let s = answer_current(&mut c, "late-answer", TIME + 2 * DAY);
    assert!(!s.progress.recalled_later);
    finish(&mut c, "left-open", TIME + 2 * DAY);
    // Starting after enough time still requires a genuinely different variant.
    c.execute("UPDATE mission_progress SET independent_variant=0", [])
        .unwrap();
    start_at(
        &mut c,
        start_request("same-variant", Difficulty::Koenner),
        TIME + 4 * DAY,
    )
    .unwrap();
    let s = answer_current(&mut c, "same-answer", TIME + 4 * DAY);
    assert!(!s.progress.recalled_later);
}

#[test]
fn answer_and_start_receipt_failures_roll_back_every_effect_and_retry() {
    let (_dir, mut c) = setup();
    c.execute_batch("CREATE TRIGGER fail_receipt BEFORE INSERT ON mission_requests BEGIN SELECT RAISE(ABORT,'disk full'); END;").unwrap();
    assert!(start_at(&mut c, start_request("round", Difficulty::Koenner), TIME).is_err());
    assert!(get_state_at(&mut c, TIME).unwrap().session.is_none());
    c.execute_batch("DROP TRIGGER fail_receipt;").unwrap();
    start_at(&mut c, start_request("round", Difficulty::Koenner), TIME).unwrap();
    c.execute_batch("CREATE TRIGGER fail_receipt BEFORE INSERT ON mission_requests BEGIN SELECT RAISE(ABORT,'disk full'); END;").unwrap();
    assert!(act_at(
        &mut c,
        request("answer", "round", 0, Action::Answer, Some("22")),
        TIME
    )
    .is_err());
    assert_eq!(learning::wallet(&c).unwrap().balance, 0);
    assert!(database::list_progress(&c).unwrap().is_empty());
    assert!(stored_step(&c, "round", 0).unwrap().outcome.is_none());
    assert!(
        !get_state_at(&mut c, TIME)
            .unwrap()
            .progress
            .solved_independently
    );
    assert!(act_at(
        &mut c,
        request("hint", "round", 0, Action::Hint, None),
        TIME
    )
    .is_err());
    assert!(!stored_step(&c, "round", 0).unwrap().hinted);
    c.execute_batch("DROP TRIGGER fail_receipt;").unwrap();
    assert_eq!(
        act_at(
            &mut c,
            request("answer", "round", 0, Action::Answer, Some("22")),
            TIME
        )
        .unwrap()
        .wallet
        .balance,
        2
    );
}

#[test]
fn second_connection_can_replay_but_not_overwrite_committed_answer() {
    let (dir, mut first) = setup();
    let mut second = database::open(&dir.path().join("mission.db")).unwrap();
    start_at(
        &mut first,
        start_request("round", Difficulty::Koenner),
        TIME,
    )
    .unwrap();
    assert_eq!(
        get_state_at(&mut second, TIME)
            .unwrap()
            .session
            .unwrap()
            .current_step
            .unwrap()
            .index,
        0
    );
    answer_current(&mut first, "answer", TIME);
    assert!(act_at(
        &mut second,
        request("new-answer", "round", 0, Action::Answer, Some("1")),
        TIME
    )
    .is_err());
    assert_eq!(
        act_at(
            &mut second,
            request("answer", "round", 0, Action::Answer, Some("22")),
            TIME
        )
        .unwrap()
        .wallet
        .balance,
        2
    );
    assert_eq!(database::list_progress(&second).unwrap()[0].attempts, 1);
}

#[test]
fn migration_from_twelve_preserves_existing_data_and_does_not_infer_mastery() {
    let (dir, mut c) = setup();
    database::set_difficulty(&c, "streber").unwrap();
    database::record_attempt(
        &c,
        database::Subject::Mathematics,
        "by.math.5.area.perimeter",
        true,
    )
    .unwrap();
    learning::submit_answer(&mut c, "historical-answer", "sample.english.cat.v1", "cat").unwrap();
    c.execute_batch("INSERT INTO point_entries(profile_id,kind,item_id,amount) VALUES(1,'answer','historical',50),(1,'reward','star',-20),(1,'game','open-game',-10); INSERT INTO game_sessions VALUES('open-game',1,'maze',NULL,'2026-09-24'); DROP TABLE multiplication_configurations; DROP TABLE multiplication_review_queue; DROP TABLE multiplication_tasks; DROP TABLE multiplication_cursors; DROP TABLE multiplication_robots; DROP TABLE multiplication_worlds; DROP TABLE multiplication_settings; DROP TABLE mission_requests; DROP TABLE mission_steps; DROP TABLE mission_sessions; DROP TABLE mission_progress; PRAGMA user_version=12;").unwrap();
    let balance = learning::wallet(&c).unwrap().balance;
    let progress_count = database::list_progress(&c).unwrap().len();
    drop(c);
    let mut c = database::open(&dir.path().join("mission.db")).unwrap();
    let state = get_state_at(&mut c, TIME).unwrap();
    assert_eq!(state.wallet.balance, balance);
    assert_eq!(state.difficulty, Difficulty::Streber);
    assert!(!state.progress.tried);
    assert!(!state.progress.solved_independently);
    assert!(!state.progress.recalled_later);
    assert_eq!(database::list_progress(&c).unwrap().len(), progress_count);
    assert_eq!(
        database::get_profile(&c).unwrap().unwrap().display_name,
        "Gartenfuchs"
    );
    assert!(state
        .wallet
        .rewards
        .iter()
        .any(|r| r.id == "star" && r.owned));
    assert_eq!(
        crate::arcade::get_state(&mut c)
            .unwrap()
            .active_session
            .unwrap()
            .id,
        "open-game"
    );
    assert_eq!(
        learning::submit_answer(&mut c, "historical-answer", "sample.english.cat.v1", "cat")
            .unwrap()
            .wallet
            .balance,
        balance
    );
    assert_eq!(
        c.pragma_query_value(None, "user_version", |r| r.get::<_, i64>(0))
            .unwrap(),
        14
    );
}

#[test]
fn migration_failure_preserves_schema_version_and_previous_history() {
    let (dir, c) = setup();
    c.execute_batch("DROP TABLE multiplication_configurations; DROP TABLE multiplication_review_queue; DROP TABLE multiplication_tasks; DROP TABLE multiplication_cursors; DROP TABLE multiplication_robots; DROP TABLE multiplication_worlds; DROP TABLE multiplication_settings; DROP TABLE mission_requests; DROP TABLE mission_steps; DROP TABLE mission_sessions; DROP TABLE mission_progress; CREATE TABLE mission_sessions(collision TEXT); PRAGMA user_version=12; INSERT INTO point_entries(profile_id,kind,item_id,amount) VALUES(1,'answer','saved',3);").unwrap();
    drop(c);
    assert!(database::open(&dir.path().join("mission.db")).is_err());
    let c = Connection::open(dir.path().join("mission.db")).unwrap();
    assert_eq!(
        c.pragma_query_value(None, "user_version", |r| r.get::<_, i64>(0))
            .unwrap(),
        12
    );
    assert_eq!(learning::wallet(&c).unwrap().balance, 3);
    let count: i64 = c
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE name='mission_progress'",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(count, 0);
}

#[test]
fn numeric_answers_reuse_exact_decimal_normalization() {
    for answer in ["22,0", "22.0", " 00022 ", "+22", "22,000000"] {
        let (_dir, mut c) = setup();
        start_at(&mut c, start_request("round", Difficulty::Koenner), TIME).unwrap();
        let result = act_at(
            &mut c,
            request("answer", "round", 0, Action::Answer, Some(answer)),
            TIME,
        )
        .unwrap();
        assert_eq!(
            result
                .session
                .unwrap()
                .current_step
                .unwrap()
                .feedback
                .unwrap()
                .correct,
            Some(true),
            "{answer}"
        );
    }
    let (_dir, mut c) = setup();
    start_at(&mut c, start_request("round", Difficulty::Koenner), TIME).unwrap();
    assert!(act_at(
        &mut c,
        request("bad", "round", 0, Action::Answer, Some("2+20")),
        TIME
    )
    .is_err());
    let result = act_at(
        &mut c,
        request("answer", "round", 0, Action::Answer, Some("22,0001")),
        TIME,
    )
    .unwrap();
    assert_eq!(
        result
            .session
            .unwrap()
            .current_step
            .unwrap()
            .feedback
            .unwrap()
            .correct,
        Some(false)
    );
}

#[test]
fn start_replays_never_create_an_extra_round_even_after_completion() {
    let (_dir, mut c) = setup();
    let first = start_at(&mut c, start_request("round", Difficulty::Koenner), TIME).unwrap();
    assert_eq!(first.session.unwrap().round, 1);
    let replay = start_at(
        &mut c,
        start_request("round", Difficulty::Koenner),
        TIME + 50,
    )
    .unwrap();
    assert_eq!(replay.session.unwrap().round, 1);
    let resume = start_at(
        &mut c,
        start_request("other-start", Difficulty::Koenner),
        TIME + 50,
    )
    .unwrap();
    assert_eq!(resume.session.unwrap().id, "round");
    finish(&mut c, "round", TIME + 100);
    let replay = start_at(
        &mut c,
        start_request("round", Difficulty::Koenner),
        TIME + 200,
    )
    .unwrap();
    assert!(replay.session.unwrap().completed);
    assert_eq!(replay.progress.completed_rounds, 1);
    let next = start_at(
        &mut c,
        start_request("new-round", Difficulty::Koenner),
        TIME + 200,
    )
    .unwrap();
    assert_eq!(next.session.unwrap().round, 2);
}

#[test]
fn failed_completion_does_not_lose_activity_or_create_a_review_date() {
    let (_dir, mut c) = setup();
    start_at(&mut c, start_request("round", Difficulty::Koenner), TIME).unwrap();
    for index in 0..4 {
        if index != 1 {
            answer_current(&mut c, &format!("answer-{index}"), TIME);
        }
        act_at(
            &mut c,
            request(&format!("next-{index}"), "round", index, Action::Next, None),
            TIME,
        )
        .unwrap();
    }
    c.execute_batch("CREATE TRIGGER fail_receipt BEFORE INSERT ON mission_requests BEGIN SELECT RAISE(ABORT,'disk full'); END;").unwrap();
    assert!(act_at(
        &mut c,
        request("complete", "round", 4, Action::Skip, None),
        TIME
    )
    .is_err());
    let current = get_state_at(&mut c, TIME).unwrap();
    assert_eq!(current.session.unwrap().current_step.unwrap().index, 4);
    assert_eq!(current.progress.completed_rounds, 0);
    assert_eq!(current.due_at, None);
    c.execute_batch("DROP TRIGGER fail_receipt;").unwrap();
    let done = act_at(
        &mut c,
        request("complete", "round", 4, Action::Skip, None),
        TIME,
    )
    .unwrap();
    assert_eq!(done.due_at, Some(TIME + DAY));
    let replay = act_at(
        &mut c,
        request("complete", "round", 4, Action::Skip, None),
        TIME + DAY,
    )
    .unwrap();
    assert_eq!(replay.due_at, done.due_at);
    assert_eq!(replay.progress.completed_rounds, 1);
}
