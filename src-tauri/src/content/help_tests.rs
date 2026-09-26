use super::*;
use serde_json::{json, Value};

fn math() -> Value {
    serde_json::from_str(include_str!("../../content/curriculum-v1.json")).unwrap()
}
fn exercise_index(data: &Value, suffix: &str) -> usize {
    data["exercises"]
        .as_array()
        .unwrap()
        .iter()
        .position(|q| q["id"].as_str().unwrap().ends_with(suffix))
        .unwrap()
}
fn validate(data: &Value) -> Result<(), String> {
    serde_json::from_value::<Catalog>(data.clone())
        .map_err(|e| e.to_string())?
        .validate()
}

#[test]
fn every_visible_exercise_has_incremental_help_and_rules_match_only_wrong_answers() {
    let catalog = catalog().unwrap();
    let mut rules = 0;
    let mut visible = 0;
    for exercise in &catalog.exercises {
        if !exercise.legacy {
            visible += 1;
            assert!(!exercise.further_hints.is_empty(), "{}", exercise.id);
        }
        assert!(exercise.mistake_hint(&exercise.answer).is_none());
        assert!(exercise.mistake_hint("unbekannte Antwort").is_none());
        for mistake in &exercise.common_mistakes {
            rules += 1;
            for answer in &mistake.answers {
                assert!(!is_correct(exercise, answer), "{}", exercise.id);
                assert_eq!(exercise.mistake_hint(answer), Some(mistake.hint.as_str()));
            }
        }
    }
    assert_eq!(visible, 615);
    assert!(rules >= 100);
}

#[test]
fn help_validation_rejects_missing_excessive_empty_and_solution_copy_hints() {
    let original = math();
    let index = exercise_index(&original, "area.perimeter.koenner.v1");
    for hints in [
        json!([]),
        json!([""]),
        json!(["a", "b", "c"]),
        json!(["a".repeat(501)]),
        json!([original["exercises"][index]["hint"]]),
        json!([original["exercises"][index]["explanation"]]),
        json!(["a", "a"]),
    ] {
        let mut data = original.clone();
        data["exercises"][index]["furtherHints"] = hints;
        assert!(validate(&data).is_err());
    }
    // Historical exercises had no hints; loading them preserves old response receipts.
    assert!(validate(&original).is_ok());
}

#[test]
fn mistake_rules_are_bounded_unambiguous_and_cannot_override_correct_answers() {
    let original = math();
    let index = exercise_index(&original, "area.perimeter.koenner.v1");
    for mistakes in [
        json!([{"answers": [], "hint":"Prüfe den Rand."}]),
        json!([{"answers": ["1", "2", "3", "4", "5"], "hint":"Prüfe den Rand."}]),
        json!([{"answers": ["22"], "hint":"Eine korrekte Antwort darf hier nicht stehen."}]),
        json!([{"answers": ["24", "24,0"], "hint":"Doppelte Normalisierung."}]),
        json!([{"answers": ["24"], "hint":"a"}, {"answers": ["24.0"], "hint":"b"}]),
        json!([{"answers": ["2+2"], "hint":"Kein Zahlenwert."}]),
        json!([{"answers": ["24"], "hint":""}]),
        json!([{"answers": ["24"], "hint":"a".repeat(501)}]),
        json!([{"answers": ["24"], "hint":"a", "regex":".*"}]),
        json!(vec![json!({"answers":["24"], "hint":"a"}); 5]),
    ] {
        let mut data = original.clone();
        data["exercises"][index]["commonMistakes"] = mistakes;
        assert!(validate(&data).is_err());
    }
    let mut data = original.clone();
    let choice = exercise_index(&data, "area.compare.vorschule.v1");
    data["exercises"][choice]["commonMistakes"] =
        json!([{"answers":["unbekannte Auswahl"], "hint":"Prüfe den Rand."}]);
    assert!(validate(&data).is_err());
}

#[test]
fn matching_reuses_exact_decimal_text_and_choice_semantics() {
    let catalog = catalog().unwrap();
    let find = |id: &str| catalog.exercises.iter().find(|q| q.id == id).unwrap();
    let perimeter = find("by.math.5.area.perimeter.koenner.v1");
    for answer in ["24", " +024,00 ", "24.0"] {
        assert_eq!(perimeter.mistake_hint(answer), perimeter.mistake_hint("24"));
    }
    assert!(perimeter.mistake_hint("24.001").is_none());
    assert!(perimeter.mistake_hint("2+4").is_none());
    assert!(perimeter.mistake_hint("22,0").is_none());
    let scale = find("by.math.5.units.scale.koenner.v1");
    assert_eq!(scale.mistake_hint("100 000"), scale.mistake_hint("100000"));
    let english = find("by.english.5.past.6.v1");
    assert_eq!(english.mistake_hint(" SAW "), english.mistake_hint("saw"));
    assert!(english.mistake_hint("saw yesterday").is_none());
    let nature = find("by.nature.5.breathing.4.v1");
    assert!(nature.mistake_hint("Immer zum Herzen hin").is_some());
    assert!(nature.mistake_hint("immer zum herzen hin").is_none());
}
