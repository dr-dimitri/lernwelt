use super::*;

#[test]
fn selectable_units_meet_subject_specific_scope_without_duplicate_tasks() {
    let content = catalog().unwrap();
    let study = crate::study::catalog(content).unwrap();
    let family = study
        .units
        .iter()
        .find(|u| u.id == "english-vocabulary-family")
        .unwrap();
    assert!(family.keywords.iter().any(|word| word == "mother"));
    assert!(family.keywords.iter().any(|word| word == "Mutter"));
    for unit in &study.units {
        for level in [
            Difficulty::Vorschule,
            Difficulty::Koenner,
            Difficulty::Streber,
        ] {
            let tasks: Vec<_> = content
                .exercises
                .iter()
                .filter(|e| unit.exercise_ids.contains(&e.id) && e.difficulty == level)
                .collect();
            if unit.subject == Subject::Geography {
                assert_eq!(tasks.len(), 8, "{} {}", unit.id, level.as_str());
            } else {
                assert!(tasks.len() >= 12, "{} {}", unit.id, level.as_str());
            }
            let mut distinct = HashSet::new();
            for task in tasks.iter().filter(|e| e.id.contains(".focus.")) {
                assert!(
                    distinct.insert((&task.prompt, &task.options, &task.audio_card_id)),
                    "duplicate: {}",
                    task.id
                );
                assert!(task.prompt.chars().count() < 500, "{}", task.id);
                assert!(
                    task.options.iter().all(|o| o.chars().count() <= 120),
                    "{}",
                    task.id
                );
                assert!(is_correct(task, &task.answer), "{}", task.id);
                assert!(!is_correct(task, "unpassende Antwort"), "{}", task.id);
            }
        }
    }
}

#[test]
fn independently_checked_examples_cover_decimal_units_signs_grammar_and_science() {
    let content = catalog().unwrap();
    // Expected values are hand checked, independent of the authoring generator.
    for (subject, key, level, index, expected, wrong) in [
        ("mathematics", "length", "vorschule", "02", "4000", "4"),
        ("mathematics", "length", "koenner", "02", "1600", "1.6"),
        ("mathematics", "length", "streber", "02", "2797", "2799.7"),
        ("mathematics", "mass", "koenner", "01", "1500", "15"),
        ("mathematics", "area-units", "koenner", "01", "14000", "140"),
        ("mathematics", "time", "vorschule", "02", "123", "203"),
        ("mathematics", "surface", "vorschule", "01", "40", "16"),
        ("mathematics", "signed-add", "vorschule", "01", "-2", "6"),
        (
            "mathematics",
            "signed-multiply",
            "vorschule",
            "02",
            "15",
            "-15",
        ),
        ("mathematics", "powers", "streber", "02", "-8", "8"),
        ("mathematics", "circles", "koenner", "02", "1", "2"),
        (
            "mathematics",
            "written-divide",
            "koenner",
            "01",
            "113",
            "103",
        ),
        ("english", "present", "vorschule", "06", "studies", "studys"),
        ("english", "present", "koenner", "02", "Does", "Do"),
        ("english", "present", "koenner", "03", "read", "reads"),
        ("english", "past", "vorschule", "08", "went", "goed"),
        (
            "english",
            "progressive",
            "koenner",
            "12",
            "making",
            "makeing",
        ),
        ("english", "quantifiers", "vorschule", "06", "much", "many"),
        ("english", "modals", "koenner", "04", "needn’t", "mustn’t"),
        (
            "nature",
            "research",
            "streber",
            "11",
            "Wasser und Licht unterscheiden sich gleichzeitig.",
            "Es wurden zwei Pflanzen verwendet.",
        ),
        (
            "nature",
            "water",
            "koenner",
            "06",
            "Kleine flüssige Wassertropfen",
            "Der gasförmige Wasserdampf selbst",
        ),
        ("nature", "breathing", "streber", "05", "Arterie", "Vene"),
        (
            "nature",
            "cells",
            "streber",
            "09",
            "Sie kann trotzdem eine Pflanzenzelle sein.",
            "Sie muss eine Tierzelle sein.",
        ),
    ] {
        let id = format!("by.{subject}.5.focus.{key}.{level}.{index}.v1");
        let task = content.exercises.iter().find(|e| e.id == id).unwrap();
        assert!(
            is_correct(task, expected),
            "{id}: expected {expected}, got {}",
            task.answer
        );
        assert!(!is_correct(task, wrong), "{id}");
    }
}

#[test]
fn original_packages_and_legacy_receipts_keep_all_their_answer_meanings() {
    let combined = catalog().unwrap();
    for package in [
        include_str!("../../content/curriculum-v1.json"),
        include_str!("../../content/english-5-v1.json"),
        include_str!("../../content/nature-5-v1.json"),
        include_str!("../../content/number-line-5-v1.json"),
    ] {
        let original: Catalog = serde_json::from_str(package).unwrap();
        for task in original.exercises {
            let actual = combined.exercises.iter().find(|e| e.id == task.id).unwrap();
            assert_eq!(actual.answer, task.answer);
            assert_eq!(actual.competency_id, task.competency_id);
            assert_eq!(actual.topic_id, task.topic_id);
            assert_eq!(actual.legacy, task.legacy);
        }
    }
}

#[test]
fn rejects_unknown_audio_or_audio_attached_to_a_different_subject() {
    let mut content: Catalog =
        serde_json::from_str(include_str!("../../content/english-5-v1.json")).unwrap();
    content.exercises[0].audio_card_id = Some("https://example.com/anything.mp3".into());
    assert!(content.validate().is_err());
    content.exercises[0].audio_card_id = Some("by.english.5.vocab.hello.hello.v1".into());
    assert!(content.validate().is_ok());
    let mut content: Catalog =
        serde_json::from_str(include_str!("../../content/curriculum-v1.json")).unwrap();
    content.exercises[0].audio_card_id = Some("by.english.5.vocab.hello.hello.v1".into());
    assert!(content.validate().is_err());
}
