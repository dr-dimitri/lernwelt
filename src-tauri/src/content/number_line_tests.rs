use super::*;
use serde_json::{json, Value};

fn package() -> Catalog {
    serde_json::from_str(include_str!("../../content/number-line-5-v1.json")).unwrap()
}

#[test]
fn number_line_package_covers_reading_placing_scales_distances_and_steps_at_each_level() {
    let data = package();
    data.validate().unwrap();
    assert_eq!(data.exercises.len(), 36);
    assert_eq!(data.topics.len(), 1);
    assert_eq!(data.topics[0].id, "number-line");
    assert_eq!(data.topics[0].curriculum_ref, "M5 1.1");
    for level in [
        Difficulty::Vorschule,
        Difficulty::Koenner,
        Difficulty::Streber,
    ] {
        let exercises: Vec<_> = data
            .exercises
            .iter()
            .filter(|e| e.difficulty == level)
            .collect();
        assert_eq!(exercises.len(), 12);
        assert_eq!(
            exercises
                .iter()
                .filter(|e| e.number_line.as_ref().unwrap().mode == NumberLineMode::Place)
                .count(),
            4
        );
        for strand in [
            "read", "place", "scale", "distance", "steps", "compare", "move",
        ] {
            assert!(exercises
                .iter()
                .any(|e| e.competency_id.ends_with(&format!(".{strand}"))));
        }
        for exercise in exercises {
            assert!(!exercise.hint.is_empty());
            assert!(!exercise.explanation.is_empty());
            assert!(is_correct(exercise, &exercise.answer));
            let number = exercise.answer.parse::<i64>().unwrap();
            assert!(!is_correct(exercise, &(number + 1).to_string()));
            assert!(!exercise.legacy);
        }
    }
    let catalog = catalog().unwrap();
    let topic = catalog
        .topics
        .iter()
        .find(|topic| topic.id == "number-line")
        .unwrap();
    assert!(topic.source.ends_with("/mathematik"));
    assert!(topic.curriculum_version.contains("26.09.2026"));
    assert_eq!(
        catalog
            .topics
            .iter()
            .filter(|t| t.subject == Subject::Mathematics)
            .count(),
        9
    );
}

#[test]
fn number_line_validation_rejects_bad_bounds_grids_labels_and_markers() {
    let original: Value =
        serde_json::from_str(include_str!("../../content/number-line-5-v1.json")).unwrap();
    let cases: &[fn(&mut Value)] = &[
        |e| e["numberLine"]["min"] = json!(11),
        |e| e["numberLine"]["max"] = json!(0),
        |e| e["numberLine"]["min"] = json!(-1_000_001),
        |e| e["numberLine"]["max"] = json!(1_000_001),
        |e| e["numberLine"]["min"] = json!(i64::MIN),
        |e| e["numberLine"]["max"] = json!(i64::MAX),
        |e| e["numberLine"]["step"] = json!(0),
        |e| e["numberLine"]["step"] = json!(-1),
        |e| e["numberLine"]["step"] = json!(1_000_001),
        |e| e["numberLine"]["step"] = json!(3),
        |e| e["numberLine"]["max"] = json!(11),
        |e| e["numberLine"]["min"] = json!(1),
        |e| e["numberLine"]["labels"] = json!([0]),
        |e| e["numberLine"]["labels"] = json!([0, 5, 5]),
        |e| e["numberLine"]["labels"] = json!([10, 5, 0]),
        |e| e["numberLine"]["labels"] = json!([-1, 10]),
        |e| {
            e["numberLine"]["step"] = json!(2);
            e["numberLine"]["labels"] = json!([0, 3, 10]);
        },
        |e| e["numberLine"]["markers"][0]["value"] = json!(11),
        |e| e["numberLine"]["markers"][0]["value"] = json!(5),
        |e| {
            e["numberLine"]["step"] = json!(2);
            e["numberLine"]["labels"] = json!([0, 10]);
        },
        |e| e["numberLine"]["markers"][0]["label"] = json!(""),
        |e| e["numberLine"]["markers"][0]["label"] = json!("Long"),
        |e| e["numberLine"]["markers"][0]["label"] = json!("A\n"),
        |e| e["numberLine"]["markers"] = json!([{"label":"A","value":3},{"label":"a","value":4}]),
        |e| e["numberLine"]["markers"] = json!([{"label":"A","value":3},{"label":"B","value":3}]),
        |e| e["answer"] = json!("3.5"),
        |e| e["answer"] = json!("1000001"),
        |e| e["answerKind"] = json!("text"),
        |e| e["options"] = json!(["3", "4"]),
        |e| e["subject"] = json!("english"),
    ];
    for (index, mutate) in cases.iter().enumerate() {
        let mut changed = original.clone();
        mutate(&mut changed["exercises"][0]);
        let changed: Catalog = serde_json::from_value(changed).unwrap();
        assert!(changed.validate().is_err(), "invalid case {index}");
    }
}

#[test]
fn placement_requires_a_grid_coordinate_and_never_contains_answer_markers() {
    let original: Value =
        serde_json::from_str(include_str!("../../content/number-line-5-v1.json")).unwrap();
    for answer in ["-1", "11", "3.5"] {
        let mut changed = original.clone();
        changed["exercises"][1]["answer"] = json!(answer);
        assert!(serde_json::from_value::<Catalog>(changed)
            .unwrap()
            .validate()
            .is_err());
    }
    let mut changed = original.clone();
    changed["exercises"][3]["answer"] = json!("7");
    assert!(serde_json::from_value::<Catalog>(changed)
        .unwrap()
        .validate()
        .is_err());
    let mut changed = original;
    changed["exercises"][1]["numberLine"]["markers"] = json!([{"label":"A", "value":7}]);
    assert!(serde_json::from_value::<Catalog>(changed)
        .unwrap()
        .validate()
        .is_err());
}

#[test]
fn diagram_deserialization_rejects_unknown_fields_and_non_integer_coordinates() {
    let diagram = json!({"kind":"ray","mode":"read","min":0,"max":10,"step":1,"labels":[0,10],"markers":[{"label":"A","value":3}]});
    for field in ["answer", "correctPosition", "unexpected"] {
        let mut changed = diagram.clone();
        changed[field] = json!(3);
        assert!(serde_json::from_value::<NumberLine>(changed).is_err());
    }
    for (field, value) in [
        ("kind", json!("curve")),
        ("mode", json!("drag")),
        ("step", json!(0.5)),
        ("labels", json!([0, 2.5])),
    ] {
        let mut changed = diagram.clone();
        changed[field] = value;
        assert!(serde_json::from_value::<NumberLine>(changed).is_err());
    }
    let mut changed = diagram;
    changed["markers"][0]["answer"] = json!(3);
    assert!(serde_json::from_value::<NumberLine>(changed).is_err());
}

#[test]
fn existing_catalog_exercises_keep_their_answers_and_have_no_diagram() {
    let combined = catalog().unwrap();
    for json in [
        include_str!("../../content/curriculum-v1.json"),
        include_str!("../../content/english-5-v1.json"),
        include_str!("../../content/nature-5-v1.json"),
    ] {
        let old: Catalog = serde_json::from_str(json).unwrap();
        for exercise in old.exercises {
            let retained = combined
                .exercises
                .iter()
                .find(|e| e.id == exercise.id)
                .unwrap();
            assert_eq!(retained.answer, exercise.answer);
            assert_eq!(retained.legacy, exercise.legacy);
            assert!(retained.number_line.is_none());
        }
    }
}
