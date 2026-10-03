//! Navigation metadata has no answers and never changes historical exercise identities.
use crate::content::Catalog;
use crate::database::Subject;
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, sync::OnceLock};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct StudyArea {
    pub id: String,
    pub subject: Subject,
    pub name: String,
    pub curriculum_ref: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Supplement {
    pub kind: String,
    pub label: String,
    pub target: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct StudyUnit {
    pub id: String,
    pub area_id: String,
    pub subject: Subject,
    pub grade: u8,
    pub name: String,
    pub goal: String,
    pub keywords: Vec<String>,
    pub curriculum_ref: String,
    pub source: String,
    pub curriculum_version: String,
    pub language_sequence: Option<String>,
    pub exercise_ids: Vec<String>,
    pub supplements: Vec<Supplement>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct StudyCatalog {
    pub version: u32,
    pub areas: Vec<StudyArea>,
    pub units: Vec<StudyUnit>,
}

pub fn catalog(content: &Catalog) -> Result<&'static StudyCatalog, String> {
    static STUDY: OnceLock<Result<StudyCatalog, String>> = OnceLock::new();
    STUDY
        .get_or_init(|| {
            let catalog: StudyCatalog =
                serde_json::from_str(include_str!("../content/study-catalog-v1.json"))
                    .map_err(|_| "Die Themenübersicht konnte nicht gelesen werden.".to_owned())?;
            catalog.validate(content)?;
            Ok(catalog)
        })
        .as_ref()
        .map_err(Clone::clone)
}

impl StudyCatalog {
    fn validate(&self, content: &Catalog) -> Result<(), String> {
        let invalid = || "Die Themenübersicht enthält ungültige Zuordnungen.".to_owned();
        let text = |s: &str| !s.trim().is_empty() && s.chars().count() <= 500;
        if self.version != 1 || self.areas.is_empty() || self.units.is_empty() {
            return Err(invalid());
        }
        let mut ids = HashSet::new();
        for area in &self.areas {
            if !text(&area.id)
                || !text(&area.name)
                || !text(&area.curriculum_ref)
                || !ids.insert(&area.id)
                || !self.units.iter().any(|u| u.area_id == area.id)
            {
                return Err(invalid());
            }
        }
        ids.clear();
        let mut assigned = HashSet::new();
        for unit in &self.units {
            if !ids.insert(&unit.id)
                || unit.grade != 5
                || [
                    &unit.id,
                    &unit.name,
                    &unit.goal,
                    &unit.curriculum_ref,
                    &unit.curriculum_version,
                ]
                .iter()
                .any(|s| !text(s))
                || !self
                    .areas
                    .iter()
                    .any(|a| a.id == unit.area_id && a.subject == unit.subject)
                || !unit
                    .source
                    .starts_with("https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/")
                || (unit.subject == Subject::English
                    && unit.language_sequence.as_deref() != Some("1. Fremdsprache"))
                || (unit.subject != Subject::English && unit.language_sequence.is_some())
                || unit.keywords.iter().any(|k| !text(k))
            {
                return Err(invalid());
            }
            for id in &unit.exercise_ids {
                if !assigned.insert(id)
                    || !content
                        .exercises
                        .iter()
                        .any(|e| &e.id == id && !e.legacy && e.subject == unit.subject)
                {
                    return Err(invalid());
                }
            }
            if unit.exercise_ids.is_empty() {
                return Err(invalid());
            }
            for link in &unit.supplements {
                let valid = match link.kind.as_str() {
                    "multiplication" => {
                        unit.subject == Subject::Mathematics && link.target == "squares"
                    }
                    "vocabulary" => {
                        unit.subject == Subject::English
                            && matches!(
                                link.target.as_str(),
                                "all"
                                    | "hello"
                                    | "family"
                                    | "home"
                                    | "school"
                                    | "day"
                                    | "friends"
                                    | "shopping"
                                    | "party"
                                    | "past"
                                    | "stories"
                                    | "travel"
                                    | "words"
                                    | "animals"
                                    | "clothes"
                                    | "body"
                                    | "weather"
                                    | "calendar"
                                    | "numbers"
                            )
                    }
                    "mission" => matches!(
                        (unit.subject, link.target.as_str()),
                        (Subject::Mathematics, "by.math.5.round.garden.v1")
                            | (Subject::English, "by.english.5.round.school.v1")
                            | (Subject::Nature, "by.nature.5.round.research.v1")
                    ),
                    _ => false,
                };
                if !valid || !text(&link.label) {
                    return Err(invalid());
                }
            }
        }
        if content
            .exercises
            .iter()
            .any(|e| !e.legacy && !assigned.contains(&e.id))
        {
            return Err(invalid());
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn fixture() -> StudyCatalog {
        serde_json::from_str(include_str!("../content/study-catalog-v1.json")).unwrap()
    }
    #[test]
    fn every_visible_exercise_has_exactly_one_reachable_unit() {
        let content = crate::content::catalog().unwrap();
        let study = catalog(content).unwrap();
        assert_eq!(study.areas.len(), 18);
        assert_eq!(study.units.len(), 88);
        study.validate(content).unwrap();
        let projection = serde_json::to_value(study).unwrap();
        assert!(projection["units"][0].get("answer").is_none());
    }
    #[test]
    fn rejects_missing_duplicate_cross_subject_and_invalid_metadata() {
        let content = crate::content::catalog().unwrap();
        let mut study = fixture();
        study.units[0].exercise_ids.pop();
        assert!(study.validate(content).is_err());
        let mut study = fixture();
        let duplicate = study.units[1].exercise_ids[0].clone();
        study.units[0].exercise_ids.push(duplicate);
        assert!(study.validate(content).is_err());
        let mut study = fixture();
        study.units[0].subject = Subject::English;
        assert!(study.validate(content).is_err());
        let mut study = fixture();
        study.units[0].source = "https://example.com".into();
        assert!(study.validate(content).is_err());
        let mut study = fixture();
        study.units[0].supplements.push(Supplement {
            kind: "shell".into(),
            label: "Start".into(),
            target: "anything".into(),
        });
        assert!(study.validate(content).is_err());
    }
}
