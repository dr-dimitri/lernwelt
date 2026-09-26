use super::tests::{request, setup, start_request, TIME};
use super::*;

const ENGLISH: &str = "by.english.5.round.school.v1";
const NATURE: &str = "by.nature.5.round.research.v1";
fn start_topic(c: &mut Connection, id: &str, topic: &str, time: i64) -> MissionState {
    start_at(
        c,
        StartInput {
            request_id: id.into(),
            difficulty: database::get_difficulty(c).unwrap(),
            topic_id: Some(topic.into()),
        },
        time,
    )
    .unwrap()
}
fn finish_topic(c: &mut Connection, topic: &str, time: i64) -> MissionState {
    loop {
        let s = latest_session(c, database::get_difficulty(c).unwrap(), topic)
            .unwrap()
            .unwrap();
        if s.current_step == 5 {
            return get_state_at(c, topic, time).unwrap();
        }
        let e = exercise(variant(&s).unwrap(), s.current_step);
        let stored = stored_step(c, &s.id, s.current_step).unwrap();
        let (action, answer, suffix) = if let Some(e) = e.filter(|_| stored.outcome.is_none()) {
            (Action::Answer, Some(e.answer.as_str()), "answer")
        } else if s.current_step == 4 {
            (Action::Skip, None, "skip")
        } else {
            (Action::Next, None, "next")
        };
        act_at(
            c,
            request(
                &format!("{}-{}-{suffix}", s.id, s.current_step),
                &s.id,
                s.current_step,
                action,
                answer,
            ),
            time,
        )
        .unwrap();
    }
}
#[test]
fn all_subjects_complete_all_variants_and_award_once_per_stable_exercise() {
    let (_dir, mut c) = setup();
    assert_eq!(catalogs().unwrap().len(), 3);
    let mut expected = 0;
    for (subject_index, topic) in catalogs().unwrap().iter().enumerate() {
        assert_eq!(
            topic.foreign_language_sequence,
            (topic.subject == database::Subject::English).then_some(1)
        );
        for (difficulty, reward) in [
            (Difficulty::Vorschule, 1),
            (Difficulty::Koenner, 2),
            (Difficulty::Streber, 3),
        ] {
            database::set_difficulty(&c, difficulty.as_str()).unwrap();
            for round in 1..=4 {
                let s = start_topic(
                    &mut c,
                    &format!("topic-{subject_index}-{}-{round}", difficulty.as_str()),
                    &topic.id,
                    TIME + round * DAY,
                );
                assert_eq!(s.metadata.subject, topic.subject);
                assert_eq!(s.session.unwrap().variant, ((round - 1) % 3 + 1) as u8);
                let finished = finish_topic(&mut c, &topic.id, TIME + round * DAY);
                expected += if round <= 3 { reward * 3 } else { 0 };
                assert_eq!(finished.wallet.balance, expected);
                assert_eq!(finished.progress.completed_rounds, round);
                assert!(finished.progress.solved_independently);
                if round > 1 {
                    assert!(finished.progress.recalled_later);
                }
            }
        }
    }
    let progress = database::list_progress(&c).unwrap();
    assert_eq!(progress.len(), 3);
    for p in progress {
        assert_eq!(p.attempts, 36);
        assert_eq!(p.correct, 36);
    }
}
#[test]
fn interrupted_topics_and_legacy_requests_survive_reopen_without_crossing_progress() {
    let (dir, mut c) = setup();
    start_at(
        &mut c,
        start_request("old-garden", Difficulty::Koenner),
        TIME,
    )
    .unwrap();
    // This is the exact payload written before topic selection was introduced.
    let old_payload = r#"start:{"requestId":"old-garden","difficulty":"koenner"}"#;
    let saved: String = c
        .query_row(
            "SELECT payload FROM mission_requests WHERE request_id='old-garden'",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(saved, old_payload);
    act_at(
        &mut c,
        request("garden-answer", "old-garden", 0, Action::Answer, Some("22")),
        TIME,
    )
    .unwrap();
    start_topic(&mut c, "english", ENGLISH, TIME);
    let answer = catalog(ENGLISH)
        .unwrap()
        .variants
        .iter()
        .find(|v| v.difficulty == Difficulty::Koenner && v.variant == 0)
        .unwrap()
        .recall
        .answer
        .clone();
    act_at(
        &mut c,
        request(
            "english-answer",
            "english",
            0,
            Action::Answer,
            Some(&answer),
        ),
        TIME,
    )
    .unwrap();
    act_at(
        &mut c,
        request("english-next", "english", 0, Action::Next, None),
        TIME,
    )
    .unwrap();
    start_topic(&mut c, "nature", NATURE, TIME);
    act_at(
        &mut c,
        request("nature-hint", "nature", 0, Action::Hint, None),
        TIME,
    )
    .unwrap();
    drop(c);
    let mut c = database::open(&dir.path().join("mission.db")).unwrap();
    let garden = start_at(
        &mut c,
        start_request("old-garden", Difficulty::Koenner),
        TIME,
    )
    .unwrap();
    assert_eq!(
        garden
            .session
            .unwrap()
            .current_step
            .unwrap()
            .feedback
            .unwrap()
            .points_awarded,
        2
    );
    assert_eq!(garden.wallet.balance, 4);
    let english = get_state_at(&mut c, ENGLISH, TIME).unwrap();
    assert_eq!(english.session.unwrap().current_step.unwrap().index, 1);
    let nature = get_state_at(&mut c, NATURE, TIME).unwrap();
    assert!(!nature.progress.solved_independently);
    assert!(nature.session.unwrap().current_step.unwrap().hint.is_some());
    assert_eq!(
        nature
            .topics
            .iter()
            .map(|t| t.active_step)
            .collect::<Vec<_>>(),
        [Some(0), Some(1), Some(0)]
    );
    let replay = act_at(
        &mut c,
        request(
            "english-answer",
            "english",
            0,
            Action::Answer,
            Some(&answer),
        ),
        TIME,
    )
    .unwrap();
    assert_eq!(replay.metadata.id, ENGLISH);
    assert_eq!(replay.session.unwrap().current_step.unwrap().index, 1);
    assert_eq!(replay.wallet.balance, 4);
    let replay = act_at(
        &mut c,
        request("garden-answer", "old-garden", 0, Action::Answer, Some("22")),
        TIME,
    )
    .unwrap();
    assert_eq!(replay.metadata.id, GARDEN_TOPIC);
    assert_eq!(replay.wallet.balance, 4);
    assert_eq!(
        c.query_row(
            "SELECT payload FROM mission_requests WHERE request_id='old-garden'",
            [],
            |r| r.get::<_, String>(0)
        )
        .unwrap(),
        old_payload
    );
    let progress = database::list_progress(&c).unwrap();
    assert_eq!(progress.len(), 2);
    assert!(progress.iter().all(|p| p.attempts == 1 && p.correct == 1));
}
#[test]
fn due_overview_and_rounds_are_separate_for_each_topic_and_level() {
    let (_dir, mut c) = setup();
    for (index, topic) in [GARDEN_TOPIC, ENGLISH, NATURE].iter().enumerate() {
        start_topic(&mut c, &format!("round-{index}"), topic, TIME);
        finish_topic(&mut c, topic, TIME);
    }
    let overview = get_state_at(&mut c, GARDEN_TOPIC, TIME + DAY).unwrap();
    assert!(overview
        .topics
        .iter()
        .all(|t| t.due && t.active_step.is_none()));
    database::set_difficulty(&c, "streber").unwrap();
    let overview = get_state_at(&mut c, ENGLISH, TIME + DAY).unwrap();
    assert!(overview.topics.iter().all(|t| !t.due && t.due_at.is_none()));
    start_topic(&mut c, "english-streber", ENGLISH, TIME + DAY);
    database::set_difficulty(&c, "koenner").unwrap();
    start_topic(&mut c, "english-review", ENGLISH, TIME + DAY);
    let english = finish_topic(&mut c, ENGLISH, TIME + DAY);
    assert!(english.progress.recalled_later);
    assert!(
        !english
            .topics
            .iter()
            .find(|t| t.metadata.id == ENGLISH)
            .unwrap()
            .due
    );
    for topic in [GARDEN_TOPIC, NATURE] {
        let s = get_state_at(&mut c, topic, TIME + DAY).unwrap();
        assert!(s.due);
        assert_eq!(s.progress.completed_rounds, 1);
        assert!(!s.progress.recalled_later);
    }
    database::set_difficulty(&c, "streber").unwrap();
    assert_eq!(
        get_state_at(&mut c, ENGLISH, TIME + DAY)
            .unwrap()
            .session
            .unwrap()
            .id,
        "english-streber"
    );
}
#[test]
fn invalid_topics_cross_topic_replays_and_changed_levels_write_nothing() {
    let (_dir, mut c) = setup();
    let invalid = StartInput {
        request_id: "invalid".into(),
        difficulty: Difficulty::Koenner,
        topic_id: Some("unknown".into()),
    };
    assert!(start_at(&mut c, invalid, TIME).is_err());
    assert!(get_state_at(&mut c, "unknown", TIME).is_err());
    assert_eq!(
        c.query_row("SELECT COUNT(*) FROM mission_sessions", [], |r| r
            .get::<_, i64>(0))
            .unwrap(),
        0
    );
    start_topic(&mut c, "english", ENGLISH, TIME);
    start_topic(&mut c, "nature", NATURE, TIME);
    act_at(
        &mut c,
        request("same-request", "english", 0, Action::Hint, None),
        TIME,
    )
    .unwrap();
    assert!(act_at(
        &mut c,
        request("same-request", "nature", 0, Action::Hint, None),
        TIME
    )
    .is_err());
    assert!(!stored_step(&c, "nature", 0).unwrap().hinted);
    assert!(start_at(
        &mut c,
        StartInput {
            request_id: "english".into(),
            difficulty: Difficulty::Koenner,
            topic_id: Some(NATURE.into())
        },
        TIME
    )
    .is_err());
    database::set_difficulty(&c, "streber").unwrap();
    assert!(act_at(
        &mut c,
        request("wrong-level", "english", 0, Action::Reveal, None),
        TIME
    )
    .is_err());
    assert!(stored_step(&c, "english", 0).unwrap().outcome.is_none());
    assert_eq!(learning::wallet(&c).unwrap().balance, 0);
    assert_eq!(
        c.query_row("SELECT COUNT(*) FROM mission_requests", [], |r| r
            .get::<_, i64>(0))
            .unwrap(),
        3
    );
}
