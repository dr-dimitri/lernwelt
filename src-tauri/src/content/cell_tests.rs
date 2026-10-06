use super::*;

#[test]
fn cell_expedition_keeps_forty_five_old_ids_and_adds_six_new_per_level() {
    let content = catalog().unwrap();
    let study = crate::study::catalog(content).unwrap();
    let unit = study.units.iter().find(|u| u.id == "nature-cells").unwrap();
    assert_eq!(unit.exercise_ids.len(), 63);
    let original: Catalog =
        serde_json::from_str(include_str!("../../content/nature-5-v1.json")).unwrap();
    let additional: Vec<Exercise> =
        serde_json::from_str(include_str!("../../content/topic-practice-v1.json")).unwrap();
    let old: Vec<_> = original
        .exercises
        .iter()
        .chain(additional.iter())
        .filter(|e| e.topic_id == "nature-cells")
        .collect();
    assert_eq!(old.len(), 45);
    for before in old {
        let after = content
            .exercises
            .iter()
            .find(|e| e.id == before.id)
            .unwrap();
        assert_eq!(after.answer, before.answer);
        assert_eq!(after.prompt, before.prompt);
        assert_eq!(after.difficulty, before.difficulty);
        assert_eq!(after.competency_id, before.competency_id);
        assert!(unit.exercise_ids.contains(&after.id));
    }
    let topic = content
        .topics
        .iter()
        .find(|t| t.id == "nature-nucleus")
        .unwrap();
    assert_eq!(topic.subject, Subject::Nature);
    assert_eq!(topic.grade, 5);
    assert!(topic.source.ends_with("/nt_gym"));
    assert!(topic.curriculum_version.contains("06.10.2026"));
    assert!(topic.curriculum_ref.contains("NT5 2.2"));
    for level in [
        Difficulty::Vorschule,
        Difficulty::Koenner,
        Difficulty::Streber,
    ] {
        let new: Vec<_> = content
            .exercises
            .iter()
            .filter(|e| e.topic_id == "nature-nucleus" && e.difficulty == level)
            .collect();
        assert_eq!(new.len(), 6);
        assert_eq!(
            content
                .exercises
                .iter()
                .filter(|e| e.topic_id == "nature-cells" && e.difficulty == level)
                .count(),
            15
        );
        for e in new {
            assert!(unit.exercise_ids.contains(&e.id));
            assert!(!e.hint.trim().is_empty());
            assert!(!e.explanation.trim().is_empty());
            assert!(e.prompt.chars().count() <= 260);
            assert!(e.answer.chars().count() <= 120);
            assert!(matches!(e.answer_kind, AnswerKind::Choice));
            assert!(is_correct(e, &e.answer));
            assert!(!is_correct(
                e,
                e.options.iter().find(|o| **o != e.answer).unwrap()
            ));
        }
    }
    let activities = &content
        .topics
        .iter()
        .find(|t| t.id == "nature-cells")
        .unwrap()
        .activities;
    assert_eq!(activities.len(), 2);
    assert_eq!(activities[0].title, "Eine Zelle als Modell");
    assert_eq!(activities[1].title, "Leben oder Bewegung?");
}
