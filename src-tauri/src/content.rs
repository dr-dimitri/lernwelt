use crate::database::Subject;
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, sync::OnceLock};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Difficulty {
    Vorschule,
    Koenner,
    Streber,
}

impl Difficulty {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Vorschule => "vorschule",
            Self::Koenner => "koenner",
            Self::Streber => "streber",
        }
    }

    pub fn parse(value: &str) -> Result<Self, String> {
        match value {
            "vorschule" => Ok(Self::Vorschule),
            "koenner" => Ok(Self::Koenner),
            "streber" => Ok(Self::Streber),
            _ => Err("Bitte wähle Vorschule, Könner oder Streber.".to_owned()),
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Activity {
    pub title: String,
    pub prompt: String,
    pub check: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LearningTable {
    pub caption: String,
    pub headers: Vec<String>,
    pub rows: Vec<Vec<String>>,
    pub note: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Topic {
    pub id: String,
    pub name: String,
    pub subject: Subject,
    pub grade: u8,
    pub curriculum_ref: String,
    pub description: String,
    pub lesson: String,
    #[serde(default)]
    pub tables: Vec<LearningTable>,
    pub activities: Vec<Activity>,
    pub language_sequence: Option<String>,
    #[serde(default)]
    pub source: String,
    #[serde(default)]
    pub curriculum_version: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum AnswerKind {
    Number,
    Text,
    Choice,
}

// Answers stay inside Rust; Question is the explicitly limited IPC projection.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Exercise {
    pub id: String,
    pub subject: Subject,
    pub topic_id: String,
    pub difficulty: Difficulty,
    pub competency_id: String,
    pub prompt: String,
    pub answer: String,
    pub hint: String,
    pub explanation: String,
    pub options: Vec<String>,
    pub answer_kind: AnswerKind,
    pub unit: Option<String>,
    pub legacy: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Catalog {
    pub version: u32,
    pub source: String,
    pub curriculum_version: String,
    pub topics: Vec<Topic>,
    pub exercises: Vec<Exercise>,
}

pub fn catalog() -> Result<&'static Catalog, String> {
    static CONTENT: OnceLock<Result<Catalog, String>> = OnceLock::new();
    CONTENT
        .get_or_init(|| {
            let mut packages = [
                include_str!("../content/curriculum-v1.json"),
                include_str!("../content/english-5-v1.json"),
            ]
            .into_iter()
            .map(|json| {
                let mut data: Catalog = serde_json::from_str(json)
                    .map_err(|_| "Das Lernpaket konnte nicht gelesen werden.".to_owned())?;
                data.validate()?;
                for topic in &mut data.topics {
                    topic.source = data.source.clone();
                    topic.curriculum_version = data.curriculum_version.clone();
                }
                Ok(data)
            })
            .collect::<Result<Vec<_>, String>>()?;
            let english = packages.pop().expect("two embedded packages");
            let mut data = packages.pop().expect("two embedded packages");
            data.topics.extend(english.topics);
            data.exercises.extend(english.exercises);
            data.validate()?;
            Ok(data)
        })
        .as_ref()
        .map_err(Clone::clone)
}

impl Catalog {
    fn validate(&self) -> Result<(), String> {
        let invalid = || "Das Lernpaket enthält ungültige Aufgaben.".to_owned();
        if self.version != 1 || self.source.is_empty() || self.curriculum_version.is_empty() {
            return Err(invalid());
        }
        let mut ids = HashSet::new();
        for topic in &self.topics {
            if !ids.insert(&topic.id) || topic.grade != 5 || topic.curriculum_ref.is_empty() {
                return Err(invalid());
            }
        }
        for topic in &self.topics {
            let mut captions = HashSet::new();
            for table in &topic.tables {
                if table.caption.trim().is_empty()
                    || !captions.insert(&table.caption)
                    || table.headers.is_empty()
                    || table.headers.iter().any(|h| h.trim().is_empty())
                    || table.rows.is_empty()
                    || table
                        .rows
                        .iter()
                        .any(|row| row.len() != table.headers.len())
                    || table.note.trim().is_empty()
                {
                    return Err(invalid());
                }
            }
        }
        ids.clear();
        for exercise in &self.exercises {
            if !ids.insert(&exercise.id)
                || exercise.prompt.is_empty()
                || exercise.explanation.is_empty()
                || exercise.competency_id.is_empty()
                || (!exercise.legacy
                    && !self.topics.iter().any(|topic| {
                        topic.id == exercise.topic_id && topic.subject == exercise.subject
                    }))
            {
                return Err(invalid());
            }
            match exercise.answer_kind {
                AnswerKind::Number if canonical_number(&exercise.answer).is_none() => {
                    return Err(invalid());
                }
                AnswerKind::Choice
                    if exercise.options.len() < 2
                        || !exercise.options.contains(&exercise.answer) =>
                {
                    return Err(invalid());
                }
                _ => {}
            }
        }
        Ok(())
    }
}

// Exact decimal normalization, with no floating-point rounding or expression execution.
// Spaces may separate digit groups; dots and commas are decimal separators, never thousands.
pub(crate) fn canonical_number(value: &str) -> Option<String> {
    let value = value.trim().replace('−', "-");
    let value = value.strip_prefix('+').unwrap_or(&value);
    let (negative, unsigned) = match value.strip_prefix('-') {
        Some(rest) => (true, rest),
        None => (false, value),
    };
    let mut parts = unsigned.split([',', '.']);
    let integer = parts.next()?;
    let fraction = parts.next().unwrap_or("");
    if parts.next().is_some() || fraction.bytes().any(|b| !b.is_ascii_digit()) {
        return None;
    }
    let groups: Vec<_> = integer.split([' ', '\u{00a0}', '\u{202f}']).collect();
    if groups.len() > 1
        && (groups[0].is_empty()
            || groups[0].len() > 3
            || groups[1..].iter().any(|group| group.len() != 3))
    {
        return None;
    }
    let digits = groups.concat();
    if digits.is_empty() || digits.bytes().any(|b| !b.is_ascii_digit()) {
        return None;
    }
    let integer = digits.trim_start_matches('0');
    let fraction = fraction.trim_end_matches('0');
    let sign = if negative && (!integer.is_empty() || !fraction.is_empty()) {
        "-"
    } else {
        ""
    };
    Some(format!(
        "{sign}{}.{fraction}",
        if integer.is_empty() { "0" } else { integer }
    ))
}

pub fn is_correct(exercise: &Exercise, answer: &str) -> bool {
    match exercise.answer_kind {
        AnswerKind::Number => canonical_number(answer)
            .zip(canonical_number(&exercise.answer))
            .is_some_and(|(actual, expected)| actual == expected),
        AnswerKind::Text => answer.trim().eq_ignore_ascii_case(&exercise.answer),
        AnswerKind::Choice => answer.trim() == exercise.answer,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn curriculum_covers_every_area_at_every_level_with_help_and_metadata() {
        let content = catalog().unwrap();
        let math: Vec<_> = content
            .topics
            .iter()
            .filter(|t| t.subject == Subject::Mathematics)
            .collect();
        assert_eq!(
            math.iter()
                .map(|t| t.curriculum_ref.as_str())
                .collect::<Vec<_>>(),
            ["M5 1.1", "M5 1.1", "M5 1.2", "M5 2", "M5 3.1", "M5 3.2", "M5 4.1", "M5 4.2"]
        );
        for topic in &content.topics {
            assert!(!topic.lesson.is_empty());
            if topic.subject == Subject::Mathematics {
                assert!(!topic.activities.is_empty());
            } else {
                assert!(topic.language_sequence.is_some());
            }
            for difficulty in [
                Difficulty::Vorschule,
                Difficulty::Koenner,
                Difficulty::Streber,
            ] {
                let exercises: Vec<_> = content
                    .exercises
                    .iter()
                    .filter(|e| e.topic_id == topic.id && e.difficulty == difficulty)
                    .collect();
                assert!(
                    exercises.len()
                        >= if topic.subject == Subject::Mathematics {
                            7
                        } else {
                            2
                        }
                );
                for exercise in exercises {
                    assert!(!exercise.hint.is_empty());
                    assert!(is_correct(exercise, &exercise.answer));
                    assert!(!is_correct(exercise, "definitely wrong"));
                    assert!(exercise.answer.chars().count() <= 120);
                }
            }
        }
    }

    #[test]
    fn english_package_has_own_sources_and_keeps_historical_answers() {
        let data = catalog().unwrap();
        let topics: Vec<_> = data
            .topics
            .iter()
            .filter(|t| t.subject == Subject::English)
            .collect();
        assert_eq!(topics.len(), 12);
        for topic in topics {
            assert!(topic.source.ends_with("englisch/1-fremdsprache"));
            assert!(topic.curriculum_version.contains("24.09.2026"));
            assert_eq!(topic.language_sequence.as_deref(), Some("1. Fremdsprache"));
            assert_eq!(topic.activities.len(), 2);
            for difficulty in [
                Difficulty::Vorschule,
                Difficulty::Koenner,
                Difficulty::Streber,
            ] {
                assert_eq!(
                    data.exercises
                        .iter()
                        .filter(|e| e.topic_id == topic.id
                            && e.difficulty == difficulty
                            && !e.legacy)
                        .count(),
                    3
                );
            }
        }
        let old = data
            .exercises
            .iter()
            .find(|e| e.id == "sample.english.cat.v1")
            .unwrap();
        assert!(old.legacy);
        assert!(is_correct(old, " CAT "));
        let new = data
            .exercises
            .iter()
            .find(|e| e.id == "by.english.5.past.4.v1")
            .unwrap();
        assert!(is_correct(new, " WENT "));
        assert!(!is_correct(new, "goed"));
        let math = data.topics.iter().find(|t| t.id == "sets").unwrap();
        assert!(math.source.ends_with("mathematik"));
    }

    #[test]
    fn sets_teach_membership_and_number_sets_at_each_level() {
        let content = catalog().unwrap();
        let topic = content
            .topics
            .iter()
            .find(|topic| topic.id == "sets")
            .unwrap();
        assert_eq!(topic.curriculum_ref, "M5 1.1");
        for difficulty in [
            Difficulty::Vorschule,
            Difficulty::Koenner,
            Difficulty::Streber,
        ] {
            for strand in [
                "elements",
                "notation",
                "belongs",
                "not-belongs",
                "natural",
                "integers",
                "infinite",
            ] {
                let id = format!("by.math.5.sets.{strand}.{}.v1", difficulty.as_str());
                let exercise = content
                    .exercises
                    .iter()
                    .find(|exercise| exercise.id == id)
                    .unwrap();
                assert!(!exercise.legacy);
                assert_eq!(exercise.topic_id, "sets");
            }
        }
        let membership = content
            .exercises
            .iter()
            .find(|e| e.id == "by.math.5.sets.belongs.koenner.v1")
            .unwrap();
        assert!(is_correct(membership, "∈"));
        assert!(!is_correct(membership, "∉"));
        let nonmembership = content
            .exercises
            .iter()
            .find(|e| e.id == "by.math.5.sets.not-belongs.koenner.v1")
            .unwrap();
        assert!(is_correct(nonmembership, "∉"));
        assert!(!is_correct(nonmembership, "∈"));
        let zero = content
            .exercises
            .iter()
            .find(|e| e.id == "by.math.5.sets.natural.koenner.v1")
            .unwrap();
        assert!(is_correct(zero, "0"));
        assert!(!is_correct(zero, "1"));
    }

    #[test]
    fn learning_tables_keep_column_meaning_and_reject_broken_rows() {
        let mut content: Catalog =
            serde_json::from_str(include_str!("../content/curriculum-v1.json")).unwrap();
        content.validate().unwrap();
        let units = content.topics.iter_mut().find(|t| t.id == "units").unwrap();
        assert_eq!(units.tables.len(), 4);
        let table = units
            .tables
            .iter_mut()
            .find(|t| t.caption == "Geld: Euro und Cent")
            .unwrap();
        assert_eq!(table.headers, ["€", "ct (2 Stellen)"]);
        assert_eq!(table.rows[0], ["3", "05"]);
        table.rows[0].pop();
        assert!(content.validate().is_err());
    }

    #[test]
    fn exact_numbers_accept_german_decimals_and_reject_expressions_and_bad_grouping() {
        for (left, right) in [
            (" 007,50 ", "7.5"),
            ("−0,00", "0"),
            ("−1 234", "-1234"),
            ("+20", "20"),
            ("4\u{202f}200", "4200"),
        ] {
            assert_eq!(canonical_number(left), canonical_number(right));
        }
        for value in [
            "", "NaN", "inf", "3/4", "1e3", "1,2.3", "1 2", "-+2", "2+2", ".", "1\t000",
        ] {
            assert!(canonical_number(value).is_none(), "{value}");
        }
        assert_ne!(canonical_number("1.000"), canonical_number("1000"));
        assert_ne!(canonical_number("7,50001"), canonical_number("7,5"));
    }

    #[test]
    fn rejects_invalid_packages_and_unknown_difficulty() {
        let mut content: Catalog =
            serde_json::from_str(include_str!("../content/curriculum-v1.json")).unwrap();
        content.exercises[0].answer = "NaN".to_owned();
        assert!(content.validate().is_err());
        assert!(Difficulty::parse("expert").is_err());
    }
}

#[cfg(test)]
mod coverage_tests;
