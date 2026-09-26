use super::adventure::{Design, Palette};
use super::*;
use tempfile::{tempdir, TempDir};
fn setup() -> (TempDir, Connection) {
    let d = tempdir().unwrap();
    let c = database::open(&d.path().join("build.db")).unwrap();
    database::save_profile(
        &c,
        database::Profile {
            display_name: "Baumeister".into(),
            grade: 5,
        },
    )
    .unwrap();
    (d, c)
}
fn config(c: &Connection) -> Configuration {
    let s = settings(c).unwrap();
    Configuration {
        request_id: format!("settings-{}", s.revision),
        expected_revision: s.revision,
        mode: s.mode,
        world: s.world,
        design: s.design,
        palette: s.palette,
        table: s.table,
        review: s.review,
        continue_stage: false,
    }
}
fn change(c: &mut Connection, edit: impl FnOnce(&mut Configuration)) -> TrainerState {
    let mut input = config(c);
    edit(&mut input);
    configure(c, input).unwrap()
}
fn current(c: &mut Connection) -> Task {
    get_state(c, None).unwrap().task.unwrap()
}
fn reply(c: &mut Connection, correct: Option<bool>) -> AnswerResult {
    let s = get_state(c, None).unwrap();
    let q = s.task.unwrap();
    answer(
        c,
        AnswerInput {
            mode: s.mode,
            sequence: q.sequence,
            answer: correct.map(|correct| {
                if correct {
                    (q.left * q.right).to_string()
                } else {
                    "0".into()
                }
            }),
        },
    )
    .unwrap()
}
fn active_world(s: &TrainerState) -> &adventure::WorldProgress {
    match s.adventure.world {
        World::Workshop => &s.adventure.worlds.workshop,
        World::Island => &s.adventure.worlds.island,
    }
}
fn advance(c: &mut Connection) {
    change(c, |s| s.continue_stage = true);
}

#[test]
fn eight_practiced_tasks_build_a_robot_even_with_mistakes_and_pause_until_explicit_continue() {
    let (d, mut c) = setup();
    for i in 0..8 {
        let result = reply(
            &mut c,
            match i % 3 {
                0 => Some(true),
                1 => Some(false),
                _ => None,
            },
        );
        assert_eq!(active_world(&result.state).answered, i + 1);
        assert_eq!(result.state.task.is_none(), i == 7);
    }
    let result = get_state(&mut c, None).unwrap();
    assert_eq!(result.wallet.balance, 3);
    assert_eq!(result.adventure.robots.len(), 1);
    assert_eq!(result.adventure.robots[0].count, 1);
    let world = active_world(&result);
    assert_eq!(world.completed_stages, 1);
    assert_eq!(world.stage_answered, 8);
    assert!(world.awaiting_continue);
    assert!(answer(
        &mut c,
        AnswerInput {
            mode: Mode::Tables,
            sequence: 8,
            answer: None
        }
    )
    .is_err());
    drop(c);
    let mut c = database::open(&d.path().join("build.db")).unwrap();
    assert!(active_world(&get_state(&mut c, None).unwrap()).awaiting_continue);
    advance(&mut c);
    let after = get_state(&mut c, None).unwrap();
    assert_eq!(active_world(&after).stage_answered, 0);
    assert!(after.task.is_some());
    assert_eq!(after.adventure.robots[0].count, 1);
}

#[test]
fn world_and_robot_selection_persist_independently_without_recounting_old_answers() {
    let (d, mut c) = setup();
    reply(&mut c, Some(true));
    reply(&mut c, None);
    change(&mut c, |s| {
        s.world = World::Island;
        s.mode = Mode::Squares;
        s.palette = Palette::Violet;
        s.design = Design::Aqua;
    });
    for _ in 0..8 {
        reply(&mut c, Some(true));
    }
    drop(c);
    let mut c = database::open(&d.path().join("build.db")).unwrap();
    let s = get_state(&mut c, None).unwrap();
    assert_eq!(s.mode, Mode::Squares);
    assert_eq!(s.adventure.world, World::Island);
    assert_eq!(s.adventure.palette, Palette::Violet);
    assert_eq!(s.adventure.design, Design::Aqua);
    assert_eq!(s.adventure.worlds.workshop.answered, 2);
    assert_eq!(s.adventure.worlds.island.answered, 8);
    assert!(s.adventure.robots.is_empty());
    change(&mut c, |s| {
        s.world = World::Workshop;
        s.mode = Mode::Tables;
    });
    for _ in 0..6 {
        reply(&mut c, Some(false));
    }
    let s = get_state(&mut c, None).unwrap();
    assert_eq!(s.adventure.robots[0].design, Design::Aqua);
    assert_eq!(s.adventure.robots[0].palette, Palette::Violet);
    assert_eq!(s.adventure.robots[0].count, 1);
    assert_eq!(s.wallet.balance, 9);
    change(&mut c, |s| s.world = World::Island);
    assert!(active_world(&get_state(&mut c, None).unwrap()).awaiting_continue);
}

#[test]
fn island_builds_six_landmarks_then_keeps_growing_without_reset() {
    let (_d, mut c) = setup();
    change(&mut c, |s| s.world = World::Island);
    for stage in 1..=7 {
        for _ in 0..8 {
            reply(&mut c, None);
        }
        let s = get_state(&mut c, None).unwrap();
        assert_eq!(s.adventure.worlds.island.completed_stages, stage);
        assert_eq!(s.wallet.balance, 0);
        if stage < 7 {
            advance(&mut c);
        }
    }
    assert_eq!(
        get_state(&mut c, None)
            .unwrap()
            .adventure
            .worlds
            .island
            .answered,
        56
    );
}

#[test]
fn every_selected_table_has_ten_distinct_products_and_resumes_after_filter_changes() {
    let (_d, mut c) = setup();
    for table in 1..=10 {
        change(&mut c, |s| s.table = Some(table));
        let mut factors = std::collections::HashSet::new();
        for i in 0..10 {
            if active_world(&get_state(&mut c, None).unwrap()).awaiting_continue {
                advance(&mut c);
            }
            let q = current(&mut c);
            assert_eq!(q.left, table);
            assert_eq!(q.round_size, 10);
            assert_eq!(q.position, i + 1);
            factors.insert(q.right);
            reply(&mut c, Some(true));
        }
        assert_eq!(factors.len(), 10);
    }
    if active_world(&get_state(&mut c, None).unwrap()).awaiting_continue {
        advance(&mut c);
    }
    change(&mut c, |s| s.table = Some(6));
    let q = current(&mut c);
    assert_eq!(q.round, 2);
    assert_eq!(q.position, 1);
    change(&mut c, |s| s.table = None);
    let mixed = current(&mut c);
    assert_eq!((mixed.round, mixed.position, mixed.round_size), (1, 1, 100));
    assert_eq!(get_state(&mut c, None).unwrap().wallet.balance, 100);
}

#[test]
fn changing_a_selection_retires_the_attempt_and_preserves_the_mathematical_position() {
    let (_d, mut c) = setup();
    let first = current(&mut c);
    change(&mut c, |s| s.table = Some(7));
    let seven = current(&mut c);
    assert_eq!(seven.left, 7);
    assert_ne!(seven.sequence, first.sequence);
    assert!(answer(
        &mut c,
        AnswerInput {
            mode: Mode::Tables,
            sequence: first.sequence,
            answer: Some((first.left * first.right).to_string())
        }
    )
    .is_err());
    change(&mut c, |s| s.table = None);
    let resumed = current(&mut c);
    assert_eq!((resumed.left, resumed.right), (first.left, first.right));
    assert!(resumed.sequence > seven.sequence);
    let result = reply(&mut c, Some(true));
    assert_eq!(result.state.wallet.balance, 1);
    assert_eq!(active_world(&result.state).answered, 1);
}

#[test]
fn review_repeats_mistakes_voluntarily_once_per_run_without_changing_normal_cursor() {
    let (_d, mut c) = setup();
    let wrong = current(&mut c);
    reply(&mut c, Some(false));
    let normal_next = current(&mut c);
    let s = change(&mut c, |s| s.review = true);
    assert_eq!(s.adventure.review_count, 1);
    let q = s.task.unwrap();
    assert!(q.review);
    assert_eq!((q.left, q.right), (wrong.left, wrong.right));
    let result = reply(&mut c, None);
    assert!(result.state.task.is_none());
    assert_eq!(result.state.adventure.review_count, 1);
    change(&mut c, |s| s.review = false);
    let resumed = current(&mut c);
    assert_eq!(
        (resumed.left, resumed.right, resumed.position),
        (normal_next.left, normal_next.right, normal_next.position)
    );
    change(&mut c, |s| s.review = true);
    let result = reply(&mut c, Some(true));
    assert_eq!(result.points_awarded, 1);
    assert!(result.state.task.is_none());
    assert_eq!(result.state.adventure.review_count, 0);
    change(&mut c, |s| s.review = false);
    let resumed = current(&mut c);
    assert_eq!(
        (resumed.left, resumed.right),
        (normal_next.left, normal_next.right)
    );
    assert_eq!(get_state(&mut c, None).unwrap().wallet.balance, 1);
}

#[test]
fn reviews_survive_restart_and_respect_mode_and_table_filter() {
    let (d, mut c) = setup();
    change(&mut c, |s| s.table = Some(6));
    reply(&mut c, None);
    change(&mut c, |s| s.table = Some(7));
    reply(&mut c, None);
    change(&mut c, |s| s.mode = Mode::Squares);
    reply(&mut c, None);
    drop(c);
    let mut c = database::open(&d.path().join("build.db")).unwrap();
    let square = change(&mut c, |s| s.review = true);
    assert_eq!(square.adventure.review_count, 1);
    assert_eq!(square.mode, Mode::Squares);
    assert!(square.task.unwrap().left >= 10);
    let six = change(&mut c, |s| {
        s.mode = Mode::Tables;
        s.table = Some(6);
    });
    assert_eq!(six.adventure.review_count, 1);
    assert_eq!(six.task.unwrap().left, 6);
    let all = change(&mut c, |s| s.table = None);
    assert_eq!(all.adventure.review_count, 2);
}

#[test]
fn task_and_configuration_replays_do_not_double_build_or_award_and_stale_changes_fail() {
    let (_d, mut c) = setup();
    let q = current(&mut c);
    let mut oldconfig = config(&c);
    oldconfig.world = World::Island;
    let req = || AnswerInput {
        mode: Mode::Tables,
        sequence: q.sequence,
        answer: Some((q.left * q.right).to_string()),
    };
    answer(&mut c, req()).unwrap();
    assert!(configure(&mut c, oldconfig).is_err());
    let s = answer(&mut c, req()).unwrap().state;
    assert_eq!(s.wallet.balance, 1);
    assert_eq!(active_world(&s).answered, 1);
    let mut input = config(&c);
    input.palette = Palette::Amber;
    let json = serde_json::to_string(&input).unwrap();
    let s = configure(&mut c, input).unwrap();
    let sequence = s.task.unwrap().sequence;
    let replay = configure(&mut c, serde_json::from_str(&json).unwrap()).unwrap();
    assert_eq!(replay.task.unwrap().sequence, sequence);
    let mut changed: Configuration = serde_json::from_str(&json).unwrap();
    changed.palette = Palette::Violet;
    assert!(configure(&mut c, changed).is_err());
    let mut invalid = config(&c);
    invalid.table = Some(11);
    assert!(configure(&mut c, invalid).is_err());
    let mut invalid = config(&c);
    invalid.continue_stage = true;
    assert!(configure(&mut c, invalid).is_err());
    assert!(serde_json::from_str::<Configuration>(r#"{"requestId":"x","expectedRevision":0,"mode":"tables","world":"space","design":"scout","palette":"mint","table":null,"review":false,"continueStage":false}"#).is_err());
}

#[test]
fn answer_world_count_shelf_and_points_rollback_together() {
    let (_d, mut c) = setup();
    for _ in 0..7 {
        reply(&mut c, Some(true));
    }
    let q = current(&mut c);
    let req = || AnswerInput {
        mode: Mode::Tables,
        sequence: q.sequence,
        answer: Some((q.left * q.right).to_string()),
    };
    c.execute_batch("CREATE TRIGGER fail_robot BEFORE INSERT ON multiplication_robots BEGIN SELECT RAISE(ABORT,'disk full'); END;").unwrap();
    assert!(answer(&mut c, req()).is_err());
    let s = get_state(&mut c, None).unwrap();
    assert_eq!(s.wallet.balance, 7);
    assert_eq!(active_world(&s).answered, 7);
    assert!(s.adventure.robots.is_empty());
    assert_eq!(s.task.unwrap().sequence, q.sequence);
    c.execute_batch("DROP TRIGGER fail_robot;").unwrap();
    let s = answer(&mut c, req()).unwrap().state;
    assert_eq!(s.wallet.balance, 8);
    assert_eq!(s.adventure.robots[0].count, 1);
    let s = answer(&mut c, req()).unwrap().state;
    assert_eq!(s.wallet.balance, 8);
    assert_eq!(s.adventure.robots[0].count, 1);
}

#[test]
fn failed_configuration_rolls_back_settings_and_preserves_offered_task() {
    let (_d, mut c) = setup();
    let before = current(&mut c);
    let mut input = config(&c);
    input.world = World::Island;
    input.table = Some(9);
    c.execute_batch("CREATE TRIGGER fail_config BEFORE INSERT ON multiplication_configurations BEGIN SELECT RAISE(ABORT,'disk full'); END;").unwrap();
    assert!(configure(&mut c, input).is_err());
    let s = get_state(&mut c, None).unwrap();
    assert_eq!(s.adventure.world, World::Workshop);
    assert_eq!(s.adventure.table, None);
    assert_eq!(s.task.unwrap().sequence, before.sequence);
}

fn drop_adventure(c: &Connection) {
    c.execute_batch("DROP TABLE multiplication_configurations; DROP TABLE multiplication_review_queue; DROP TABLE multiplication_tasks; DROP TABLE multiplication_cursors; DROP TABLE multiplication_robots; DROP TABLE multiplication_worlds; DROP TABLE multiplication_settings; PRAGMA user_version=13;").unwrap();
}

#[test]
fn migration_retains_factor_twenty_five_replays_and_missions_but_new_tasks_stop_at_twenty() {
    let (d, mut c) = setup();
    drop_adventure(&c);
    c.execute_batch("INSERT INTO square_round_tasks VALUES(1,0,25,1,1),(1,1,24,1,2); INSERT INTO multiplication_answers(profile_id,mode,sequence,answer,correct) VALUES(1,'squares',0,'625',1); INSERT INTO point_entries(profile_id,kind,item_id,amount) VALUES(1,'multiplication','squares-0',1);").unwrap();
    crate::mission::start(
        &mut c,
        crate::mission::StartInput {
            request_id: "saved-mission".into(),
            topic_id: None,
            difficulty: crate::content::Difficulty::Koenner,
        },
    )
    .unwrap();
    drop(c);
    let mut c = database::open(&d.path().join("build.db")).unwrap();
    let replay = answer(
        &mut c,
        AnswerInput {
            mode: Mode::Squares,
            sequence: 0,
            answer: Some("625".into()),
        },
    )
    .unwrap();
    assert_eq!(replay.solution, 625);
    assert_eq!(replay.state.wallet.balance, 1);
    assert_eq!(active_world(&replay.state).answered, 0);
    assert!(replay.state.adventure.robots.is_empty());
    let q = replay.state.task.unwrap();
    assert!((10..=20).contains(&q.left));
    assert_eq!(q.sequence, 1);
    assert_eq!(
        c.query_row(
            "SELECT COUNT(*) FROM mission_sessions WHERE id='saved-mission'",
            [],
            |r| r.get::<_, i64>(0)
        )
        .unwrap(),
        1
    );
    let old = saved_square(&c, 0).unwrap().unwrap();
    assert_eq!(old.left, 25);
    assert_eq!(
        database::get_profile(&c).unwrap().unwrap().display_name,
        "Baumeister"
    );
}

#[test]
fn failed_migration_rolls_back_even_the_removal_of_unanswered_square_plans() {
    let (d, c) = setup();
    drop_adventure(&c);
    c.execute_batch("INSERT INTO square_round_tasks VALUES(1,0,25,1,1); CREATE TABLE multiplication_worlds(collision TEXT);").unwrap();
    drop(c);
    assert!(database::open(&d.path().join("build.db")).is_err());
    let c = Connection::open(d.path().join("build.db")).unwrap();
    assert_eq!(
        c.pragma_query_value(None, "user_version", |r| r.get::<_, i64>(0))
            .unwrap(),
        13
    );
    assert_eq!(saved_square(&c, 0).unwrap().unwrap().left, 25);
    assert_eq!(
        c.query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE name='multiplication_settings'",
            [],
            |r| r.get::<_, i64>(0)
        )
        .unwrap(),
        0
    );
}

#[test]
fn completed_robot_keeps_its_appearance_when_the_next_design_is_selected() {
    let (d, mut c) = setup();
    for _ in 0..8 {
        reply(&mut c, Some(true));
    }
    change(&mut c, |s| {
        s.design = Design::Garden;
        s.palette = Palette::Amber;
    });
    drop(c);
    let mut c = database::open(&d.path().join("build.db")).unwrap();
    let s = get_state(&mut c, None).unwrap();
    assert_eq!(s.adventure.design, Design::Garden);
    assert_eq!(s.adventure.palette, Palette::Amber);
    let robot = s.adventure.last_robot.unwrap();
    assert_eq!(robot.design, Design::Scout);
    assert_eq!(robot.palette, Palette::Mint);
    advance(&mut c);
    for _ in 0..8 {
        reply(&mut c, None);
    }
    let s = get_state(&mut c, None).unwrap();
    let robot = s.adventure.last_robot.unwrap();
    assert_eq!(robot.design, Design::Garden);
    assert_eq!(robot.palette, Palette::Amber);
    assert_eq!(s.adventure.robots.len(), 2);
}

#[test]
fn square_plan_resumes_unchanged_after_world_and_review_detours() {
    let (_d, mut c) = setup();
    change(&mut c, |s| s.mode = Mode::Squares);
    let first = current(&mut c);
    reply(&mut c, None);
    let next = current(&mut c);
    change(&mut c, |s| s.world = World::Island);
    let same = current(&mut c);
    assert_eq!(
        (same.left, same.position, same.round),
        (next.left, next.position, next.round)
    );
    change(&mut c, |s| s.review = true);
    let repeat = current(&mut c);
    assert_eq!(repeat.left, first.left);
    assert!(repeat.review);
    reply(&mut c, Some(true));
    change(&mut c, |s| s.review = false);
    let resumed = current(&mut c);
    assert_eq!(
        (resumed.left, resumed.position, resumed.round),
        (next.left, next.position, next.round)
    );
    let result = reply(&mut c, Some(true));
    assert_eq!(result.state.task.unwrap().position, next.position + 1);
    assert_eq!(result.state.wallet.balance, 2);
}
