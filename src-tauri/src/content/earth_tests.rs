use super::*;
use serde_json::{json, Value};

fn fixture() -> Value {
    serde_json::from_str(include_str!("../../content/geography-earth-5-v1.json")).unwrap()
}

fn validate(value: Value) -> Result<(), String> {
    serde_json::from_value::<Catalog>(value)
        .map_err(|error| error.to_string())?
        .validate()
}

#[test]
fn earth_package_has_six_distinct_questions_and_three_forms_per_level() {
    let content = catalog().unwrap();
    let topic = content
        .topics
        .iter()
        .find(|topic| topic.id == "geography-earth-layers")
        .unwrap();
    assert_eq!(topic.subject, Subject::Geography);
    assert_eq!(topic.grade, 5);
    assert!(topic.curriculum_ref.contains("Geo5 2"));
    assert!(topic.source.ends_with("/geographie"));
    assert!(topic.curriculum_version.contains("06.10.2026"));
    assert!(topic.description.contains("keine vollständige"));
    assert!(topic.language_sequence.is_none());
    assert!(topic.lesson.contains("https://www.usgs.gov/"));
    assert!(topic.lesson.contains("https://www.nps.gov/"));
    assert!(topic.lesson.contains("kein Lavaozean"));
    assert!(topic.lesson.contains("starkes Zusammendrücken"));
    assert!(topic.lesson.contains("kein Foto"));
    assert!(topic.lesson.contains("keine hohlen Räume"));
    let unit = crate::study::catalog(content)
        .unwrap()
        .units
        .iter()
        .find(|unit| unit.id == topic.id)
        .unwrap();
    assert_eq!(unit.exercise_ids.len(), 18);
    let mut prompts = HashSet::new();
    for level in [
        Difficulty::Vorschule,
        Difficulty::Koenner,
        Difficulty::Streber,
    ] {
        let tasks: Vec<_> = content
            .exercises
            .iter()
            .filter(|task| task.topic_id == topic.id && task.difficulty == level)
            .collect();
        assert_eq!(tasks.len(), 6);
        assert!(tasks.iter().any(|task| task.earth_diagram.is_some()));
        assert!(tasks.iter().any(|task| task.ordering.is_some()));
        assert!(tasks
            .iter()
            .any(|task| task.earth_diagram.is_none() && task.ordering.is_none()));
        for task in tasks {
            assert!(prompts.insert(&task.prompt), "duplicate {}", task.id);
            assert!(unit.exercise_ids.contains(&task.id));
            assert!(task.competency_id.starts_with("by.geography.5.2.earth."));
            assert!(!task.legacy);
            assert!(task.prompt.chars().count() <= 180);
            assert!(!task.hint.is_empty());
            assert_eq!(task.further_hints.len(), 1);
            assert!(is_correct(task, &task.answer));
            assert!(!is_correct(task, "unpassend"));
            if let Some(ordering) = &task.ordering {
                assert_ne!(ordering.items.join("|"), task.answer);
            }
        }
    }
    assert_eq!(prompts.len(), 18);
}

#[test]
fn hand_checked_answers_cover_layer_positions_states_materials_pressure_and_model_limits() {
    let content = catalog().unwrap();
    for (key, level, expected) in [
        ("crust-picture", "vorschule", "A"),
        ("mantle-picture", "vorschule", "B"),
        ("inner-picture", "vorschule", "D"),
        ("outer-state", "vorschule", "Flüssig"),
        ("model-picture", "vorschule", "Ein vereinfachtes Modell"),
        ("between-picture", "koenner", "C"),
        ("slow-rock-picture", "koenner", "B"),
        ("core-material", "koenner", "Aus Metall"),
        (
            "core-comparison",
            "koenner",
            "Äußerer Kern flüssig, innerer Kern fest.",
        ),
        ("liquid-metal-picture", "streber", "C"),
        (
            "pressure-reason",
            "streber",
            "Sehr hoher Druck hält das Metall fest.",
        ),
        (
            "mantle-correction",
            "streber",
            "Der Mantel ist überwiegend fest und verformt sich sehr langsam.",
        ),
        (
            "thick-crust-model",
            "streber",
            "Die echte Kruste ist im Verhältnis viel dünner.",
        ),
        (
            "journey-model",
            "streber",
            "Hitze und Druck verhindern eine solche echte Reise.",
        ),
    ] {
        let id = format!("by.geography.5.earth.{key}.{level}.v1");
        let task = content.exercises.iter().find(|task| task.id == id).unwrap();
        assert!(is_correct(task, expected), "{id}");
    }
    for (key, level, expected) in [
        ("first-shells", "vorschule", "Erdkruste|Erdmantel"),
        (
            "all-shells",
            "koenner",
            "Erdkruste|Erdmantel|Äußerer Erdkern|Innerer Erdkern",
        ),
        (
            "return-shells",
            "koenner",
            "Äußerer Erdkern|Erdmantel|Erdkruste",
        ),
        (
            "materials-to-centre",
            "streber",
            "Gesteinsmantel|Flüssiger Metallkern|Fester Metallkern",
        ),
    ] {
        let id = format!("by.geography.5.earth.{key}.{level}.v1");
        let task = content.exercises.iter().find(|task| task.id == id).unwrap();
        assert!(is_correct(task, expected), "{id}");
        assert!(!is_correct(
            task,
            &expected.split('|').rev().collect::<Vec<_>>().join("|")
        ));
    }
}

#[test]
fn diagrams_reject_unknown_fields_targets_bad_markers_and_conflicting_metadata() {
    for (field, value) in [
        (
            "earthDiagram",
            json!({"kind":"shells","labels":["A","B","C","D"],"answer":"A"}),
        ),
        (
            "earthDiagram",
            json!({"kind":"shells","labels":["A","B","C","D"],"selectedLayer":"crust"}),
        ),
        (
            "earthDiagram",
            json!({"kind":"photo","labels":["A","B","C","D"]}),
        ),
        (
            "earthDiagram",
            json!({"kind":"shells","labels":["Kruste","B","C","D"]}),
        ),
        (
            "earthDiagram",
            json!({"kind":"shells","labels":["A","A","C","D"]}),
        ),
        (
            "earthDiagram",
            json!({"kind":"shells","labels":["A","B","C"]}),
        ),
        ("options", json!(["B", "A", "C", "D"])),
        ("answer", json!("E")),
        ("subject", json!("mathematics")),
        ("topicId", json!("geography-solar-system")),
        ("legacy", json!(true)),
        ("answerKind", json!("text")),
        ("unit", json!("km")),
        ("audioCardId", json!("by.english.5.vocab.hello.hello.v1")),
        ("solarSystemPlanetId", json!("earth")),
        ("ordering", json!({"items":["A","B"]})),
    ] {
        let mut content = fixture();
        content["exercises"][0][field] = value;
        assert!(validate(content).is_err(), "{field}");
    }
    assert!(validate(fixture()).is_ok());
}

#[test]
fn ordering_rejects_unbounded_items_incomplete_keys_and_duplicate_elements() {
    for (field, value) in [
        (
            "ordering",
            json!({"items":["Erdmantel","Erdkruste"],"answer":"Erdkruste|Erdmantel"}),
        ),
        ("ordering", json!({"items":["Erdkruste"]})),
        ("ordering", json!({"items":["A","B","C","D","E"]})),
        ("ordering", json!({"items":["Erdkruste","Erdkruste"]})),
        ("ordering", json!({"items":["","Erdkruste"]})),
        (
            "ordering",
            json!({"items":["Erdmantel|Erdkruste","Erdkruste"]}),
        ),
        ("ordering", json!({"items":["Erdmantel\n","Erdkruste"]})),
        ("ordering", json!({"items":["A".repeat(41),"Erdkruste"]})),
        ("ordering", Value::Null),
        ("answer", json!("Erdkruste")),
        ("answer", json!("Erdkruste|Erdkruste")),
        ("answer", json!("Erdkruste|fremdes Material")),
        ("options", json!(["Erdmantel", "Erdkruste"])),
        ("answerKind", json!("choice")),
        ("subject", json!("english")),
        ("legacy", json!(true)),
    ] {
        let mut content = fixture();
        content["exercises"][3][field] = value;
        assert!(validate(content).is_err(), "{field}");
    }
}
