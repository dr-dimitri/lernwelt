use super::*;
use serde_json::{json, Value};

fn fixture() -> Value {
    serde_json::from_str(include_str!("../../content/geography-solar-5-v1.json")).unwrap()
}

fn validate(value: Value) -> Result<(), String> {
    serde_json::from_value::<Catalog>(value)
        .map_err(|error| error.to_string())?
        .validate()
}

#[test]
fn solar_package_has_eight_distinct_planets_per_level_and_its_own_sources() {
    let content = catalog().unwrap();
    let topic = content
        .topics
        .iter()
        .find(|topic| topic.subject == Subject::Geography)
        .unwrap();
    assert_eq!(topic.id, "geography-solar-system");
    assert_eq!(topic.grade, 5);
    assert!(topic.curriculum_ref.contains("Geo5 2"));
    assert!(topic.source.ends_with("/geographie"));
    assert!(topic.curriculum_version.contains("03.10.2026"));
    assert!(topic
        .lesson
        .contains("https://science.nasa.gov/solar-system/planets/"));
    assert!(topic.description.contains("keine vollständige"));
    assert!(topic.language_sequence.is_none());
    let study = crate::study::catalog(content).unwrap();
    let unit = study.units.iter().find(|unit| unit.id == topic.id).unwrap();
    assert_eq!(unit.subject, Subject::Geography);
    assert_eq!(unit.exercise_ids.len(), 24);
    let names = [
        "Merkur", "Venus", "Erde", "Mars", "Jupiter", "Saturn", "Uranus", "Neptun",
    ];
    let expected_planets = [
        SolarSystemPlanetId::Mercury,
        SolarSystemPlanetId::Venus,
        SolarSystemPlanetId::Earth,
        SolarSystemPlanetId::Mars,
        SolarSystemPlanetId::Jupiter,
        SolarSystemPlanetId::Saturn,
        SolarSystemPlanetId::Uranus,
        SolarSystemPlanetId::Neptune,
    ];
    for level in [
        Difficulty::Vorschule,
        Difficulty::Koenner,
        Difficulty::Streber,
    ] {
        let tasks: Vec<_> = content
            .exercises
            .iter()
            .filter(|task| task.subject == Subject::Geography && task.difficulty == level)
            .collect();
        assert_eq!(tasks.len(), 8);
        assert_eq!(
            tasks
                .iter()
                .filter_map(|task| task.solar_system_planet_id)
                .collect::<HashSet<_>>(),
            HashSet::from(expected_planets)
        );
        for (task, expected_name) in tasks.iter().zip(names) {
            assert_eq!(task.answer, expected_name);
            assert_eq!(task.options, names);
            assert!(is_correct(task, expected_name));
            assert!(!is_correct(task, "Pluto"));
            assert!(unit.exercise_ids.contains(&task.id));
            assert!(task.prompt.chars().count() < 300);
            assert!(!task.hint.is_empty());
            assert_eq!(task.further_hints.len(), 1);
        }
    }
}

#[test]
fn solar_target_rejects_unknown_ids_mismatched_answers_subjects_and_options() {
    for (field, value) in [
        ("solarSystemPlanetId", json!("pluto")),
        ("solarSystemPlanetId", json!("https://example.com/mercury")),
        ("solarSystemPlanetId", json!({"id":"mercury"})),
        ("subject", json!("mathematics")),
        ("answerKind", json!("text")),
        ("answer", json!("Venus")),
        ("legacy", json!(true)),
        ("options", json!(["Merkur", "Merkur"])),
        ("options", json!(["Merkur", "Pluto"])),
        ("options", json!(["Merkur"])),
        ("audioCardId", json!("by.english.5.vocab.hello.hello.v1")),
    ] {
        let mut content = fixture();
        content["exercises"][0][field] = value;
        assert!(validate(content).is_err(), "{field}");
    }
    let mut content: Catalog =
        serde_json::from_str(include_str!("../../content/curriculum-v1.json")).unwrap();
    content.exercises[0].solar_system_planet_id = Some(SolarSystemPlanetId::Mercury);
    assert!(content.validate().is_err());
    assert!(validate(fixture()).is_ok());
}
