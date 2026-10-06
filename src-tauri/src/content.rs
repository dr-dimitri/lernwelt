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
    Order,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum EarthDiagramKind {
    Shells,
}

/// Neutral markers follow the four shells from outside to inside. No answer target is projected.
#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct EarthDiagram {
    pub kind: EarthDiagramKind,
    pub labels: Vec<String>,
}

impl EarthDiagram {
    fn valid_for(&self, exercise: &Exercise) -> bool {
        exercise.is_earth_exercise()
            && matches!(exercise.answer_kind, AnswerKind::Choice)
            && exercise.ordering.is_none()
            && self.labels == ["A", "B", "C", "D"]
            && exercise.options == self.labels
    }
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Ordering {
    pub items: Vec<String>,
}

impl Ordering {
    fn valid_for(&self, exercise: &Exercise) -> bool {
        exercise.is_earth_exercise()
            && matches!(exercise.answer_kind, AnswerKind::Order)
            && exercise.earth_diagram.is_none()
            && exercise.options.is_empty()
            && (2..=4).contains(&self.items.len())
            && self.items.iter().all(|item| {
                !item.trim().is_empty()
                    && item == item.trim()
                    && item.chars().count() <= 40
                    && !item.contains('|')
                    && !item.chars().any(char::is_control)
            })
            && self.items.iter().collect::<HashSet<_>>().len() == self.items.len()
            && exercise.answer.chars().count() <= 120
            && self.valid_answer(&exercise.answer)
    }

    pub fn valid_answer(&self, answer: &str) -> bool {
        let items: Vec<_> = answer.split('|').collect();
        items.len() == self.items.len()
            && items.iter().copied().collect::<HashSet<_>>().len() == items.len()
            && items
                .iter()
                .all(|item| self.items.iter().any(|known| known == item))
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum SolarSystemPlanetId {
    Mercury,
    Venus,
    Earth,
    Mars,
    Jupiter,
    Saturn,
    Uranus,
    Neptune,
}

impl SolarSystemPlanetId {
    fn name(self) -> &'static str {
        match self {
            Self::Mercury => "Merkur",
            Self::Venus => "Venus",
            Self::Earth => "Erde",
            Self::Mars => "Mars",
            Self::Jupiter => "Jupiter",
            Self::Saturn => "Saturn",
            Self::Uranus => "Uranus",
            Self::Neptune => "Neptun",
        }
    }

    fn valid_for(self, exercise: &Exercise) -> bool {
        let names = [
            "Merkur", "Venus", "Erde", "Mars", "Jupiter", "Saturn", "Uranus", "Neptun",
        ];
        exercise.subject == Subject::Geography
            && !exercise.legacy
            && matches!(exercise.answer_kind, AnswerKind::Choice)
            && exercise.number_line.is_none()
            && exercise.audio_card_id.is_none()
            && exercise.earth_diagram.is_none()
            && exercise.ordering.is_none()
            && exercise.answer == self.name()
            && (2..=8).contains(&exercise.options.len())
            && exercise
                .options
                .iter()
                .all(|option| names.contains(&option.as_str()))
            && exercise.options.iter().collect::<HashSet<_>>().len() == exercise.options.len()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum NumberLineKind {
    Ray,
    Line,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum NumberLineMode {
    Read,
    Place,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct NumberLineMarker {
    pub label: String,
    pub value: i64,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct NumberLine {
    pub kind: NumberLineKind,
    pub mode: NumberLineMode,
    pub min: i64,
    pub max: i64,
    pub step: i64,
    pub labels: Vec<i64>,
    pub markers: Vec<NumberLineMarker>,
}

impl NumberLine {
    fn valid_for(&self, exercise: &Exercise) -> bool {
        let bounded = |value| (-1_000_000..=1_000_000).contains(&value);
        if !bounded(self.min)
            || !bounded(self.max)
            || !(1..=1_000_000).contains(&self.step)
            || self.min >= self.max
            || (self.kind == NumberLineKind::Ray && self.min != 0)
            || !matches!(exercise.answer_kind, AnswerKind::Number)
            || exercise.subject != Subject::Mathematics
            || !exercise.options.is_empty()
        {
            return false;
        }
        let span = self.max - self.min;
        let on_grid =
            |value| (self.min..=self.max).contains(&value) && (value - self.min) % self.step == 0;
        if span % self.step != 0
            || span / self.step > 10
            || self.labels.len() < 2
            || self.labels.iter().any(|&label| !on_grid(label))
            || self.labels.windows(2).any(|pair| pair[0] >= pair[1])
        {
            return false;
        }
        let mut marker_labels = HashSet::new();
        let mut marker_positions = HashSet::new();
        for marker in &self.markers {
            if !(1..=3).contains(&marker.label.len())
                || !marker.label.bytes().all(|byte| byte.is_ascii_alphabetic())
                || !marker_labels.insert(marker.label.to_ascii_uppercase())
                || !marker_positions.insert(marker.value)
                || !on_grid(marker.value)
                || self.labels.contains(&marker.value)
            {
                return false;
            }
        }
        // Read tasks may ask for a scale or a distance outside the shown range.
        // Placement tasks always require a coordinate on the displayed grid.
        let Ok(answer) = exercise.answer.parse::<i64>() else {
            return false;
        };
        bounded(answer)
            && (self.mode != NumberLineMode::Place || (self.markers.is_empty() && on_grid(answer)))
    }
}

/// Exact, author-written responses to a small set of known wrong answers.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CommonMistake {
    pub answers: Vec<String>,
    pub hint: String,
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
    #[serde(default)]
    pub further_hints: Vec<String>,
    #[serde(default)]
    pub common_mistakes: Vec<CommonMistake>,
    pub explanation: String,
    pub options: Vec<String>,
    pub answer_kind: AnswerKind,
    pub unit: Option<String>,
    pub legacy: bool,
    #[serde(default)]
    pub number_line: Option<NumberLine>,
    #[serde(default)]
    pub audio_card_id: Option<String>,
    #[serde(default)]
    pub solar_system_planet_id: Option<SolarSystemPlanetId>,
    #[serde(default)]
    pub earth_diagram: Option<EarthDiagram>,
    #[serde(default)]
    pub ordering: Option<Ordering>,
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
            let mut content = load_packages(&[
                include_str!("../content/curriculum-v1.json"),
                include_str!("../content/english-5-v1.json"),
                include_str!("../content/nature-5-v1.json"),
                include_str!("../content/nature-nucleus-5-v1.json"),
                include_str!("../content/number-line-5-v1.json"),
                include_str!("../content/geography-solar-5-v1.json"),
                include_str!("../content/geography-earth-5-v1.json"),
            ])?;
            let additional: Vec<Exercise> = serde_json::from_str(include_str!(
                "../content/topic-practice-v1.json"
            ))
            .map_err(|_| "Die zusätzlichen Übungen konnten nicht gelesen werden.".to_owned())?;
            content.exercises.extend(additional);
            let club: Vec<Exercise> =
                serde_json::from_str(include_str!("../content/english-club-v1.json"))
                    .map_err(|_| "Die Clubübungen konnten nicht gelesen werden.".to_owned())?;
            content.exercises.extend(club);
            content.validate()?;
            Ok(content)
        })
        .as_ref()
        .map_err(Clone::clone)
}

fn load_packages(packages: &[&str]) -> Result<Catalog, String> {
    let mut combined: Option<Catalog> = None;
    for json in packages {
        let mut data: Catalog = serde_json::from_str(json)
            .map_err(|_| "Das Lernpaket konnte nicht gelesen werden.".to_owned())?;
        data.validate()?;
        for topic in &mut data.topics {
            topic.source = data.source.clone();
            topic.curriculum_version = data.curriculum_version.clone();
        }
        if let Some(catalog) = &mut combined {
            catalog.topics.extend(data.topics);
            catalog.exercises.extend(data.exercises);
        } else {
            combined = Some(data);
        }
    }
    let catalog = combined.ok_or("Es ist kein Lernpaket verfügbar.")?;
    catalog.validate()?;
    Ok(catalog)
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
            if exercise
                .audio_card_id
                .as_ref()
                .is_some_and(|id| exercise.subject != Subject::English || !valid_audio_id(id))
            {
                return Err(invalid());
            }
            if exercise
                .number_line
                .as_ref()
                .is_some_and(|number_line| !number_line.valid_for(exercise))
            {
                return Err(invalid());
            }
            if exercise
                .solar_system_planet_id
                .is_some_and(|planet| !planet.valid_for(exercise))
            {
                return Err(invalid());
            }
            if !exercise.valid_help() {
                return Err(invalid());
            }
            if exercise
                .earth_diagram
                .as_ref()
                .is_some_and(|diagram| !diagram.valid_for(exercise))
                || exercise
                    .ordering
                    .as_ref()
                    .is_some_and(|ordering| !ordering.valid_for(exercise))
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
                AnswerKind::Order if exercise.ordering.is_none() => return Err(invalid()),
                _ => {}
            }
        }
        Ok(())
    }
}

fn valid_audio_id(id: &str) -> bool {
    static IDS: OnceLock<HashSet<String>> = OnceLock::new();
    IDS.get_or_init(|| {
        let manifest: serde_json::Value =
            serde_json::from_str(include_str!("../../src/content/vocabulary-audio.json"))
                .expect("bundled audio manifest");
        manifest["cards"]
            .as_array()
            .into_iter()
            .flatten()
            .filter_map(|c| c["id"].as_str().map(String::from))
            .collect()
    })
    .contains(id)
}

impl Exercise {
    fn is_earth_exercise(&self) -> bool {
        self.subject == Subject::Geography
            && self.topic_id == "geography-earth-layers"
            && !self.legacy
            && self.number_line.is_none()
            && self.audio_card_id.is_none()
            && self.solar_system_planet_id.is_none()
            && self.unit.is_none()
    }

    pub fn valid_structured_answer(&self, answer: &str) -> bool {
        self.ordering
            .as_ref()
            .is_none_or(|ordering| ordering.valid_answer(answer))
            && (self.earth_diagram.is_none() || self.options.iter().any(|option| option == answer))
    }

    fn valid_help(&self) -> bool {
        let valid_text = |text: &str| {
            !text.trim().is_empty()
                && text.chars().count() <= 500
                && !text.chars().any(|c| c.is_control() && c != '\n')
        };
        if (!self.legacy && !valid_text(&self.hint))
            || (!self.legacy && !(1..=2).contains(&self.further_hints.len()))
            || self.further_hints.len() > 2
            || self.common_mistakes.len() > 4
        {
            return false;
        }
        let mut hints = HashSet::from([self.hint.as_str()]);
        if self.further_hints.iter().any(|hint| {
            !valid_text(hint) || !hints.insert(hint.as_str()) || hint == &self.explanation
        }) {
            return false;
        }
        let mut answers = HashSet::new();
        for mistake in &self.common_mistakes {
            if !valid_text(&mistake.hint) || !(1..=4).contains(&mistake.answers.len()) {
                return false;
            }
            for answer in &mistake.answers {
                if answer.trim().is_empty()
                    || answer.chars().count() > 120
                    || answer.chars().any(char::is_control)
                    || is_correct(self, answer)
                    || (matches!(self.answer_kind, AnswerKind::Choice)
                        && !self.options.contains(answer))
                {
                    return false;
                }
                let Some(normalized) = normalized_answer(&self.answer_kind, answer) else {
                    return false;
                };
                if !answers.insert(normalized) {
                    return false;
                }
            }
        }
        true
    }

    pub fn mistake_hint(&self, answer: &str) -> Option<&str> {
        if is_correct(self, answer) {
            return None;
        }
        let actual = normalized_answer(&self.answer_kind, answer)?;
        self.common_mistakes
            .iter()
            .find(|mistake| {
                mistake.answers.iter().any(|expected| {
                    normalized_answer(&self.answer_kind, expected).as_ref() == Some(&actual)
                })
            })
            .map(|mistake| mistake.hint.as_str())
    }
}

fn normalized_answer(kind: &AnswerKind, answer: &str) -> Option<String> {
    match kind {
        AnswerKind::Number => canonical_number(answer),
        AnswerKind::Text => Some(answer.trim().to_ascii_lowercase()),
        AnswerKind::Choice | AnswerKind::Order => Some(answer.trim().to_owned()),
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
        AnswerKind::Text if exercise.id.starts_with("by.english.5.club.") => {
            let normalize = |value: &str| {
                value
                    .replace(['’', '‘'], "'")
                    .split_whitespace()
                    .collect::<Vec<_>>()
                    .join(" ")
                    .trim_end_matches(['.', '?', '!'])
                    .to_ascii_lowercase()
            };
            normalize(answer) == normalize(&exercise.answer)
        }
        AnswerKind::Text => answer.trim().eq_ignore_ascii_case(&exercise.answer),
        AnswerKind::Choice | AnswerKind::Order => answer.trim() == exercise.answer,
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
            [
                "M5 1.1", "M5 1.1", "M5 1.2", "M5 2", "M5 3.1", "M5 3.2", "M5 4.1", "M5 4.2",
                "M5 1.1"
            ]
        );
        for topic in &content.topics {
            assert!(!topic.lesson.is_empty());
            if topic.id == "nature-nucleus" {
                assert!(!content
                    .topics
                    .iter()
                    .find(|t| t.id == "nature-cells")
                    .unwrap()
                    .activities
                    .is_empty());
            } else if topic.id == "geography-earth-layers" {
                assert!(topic.activities.is_empty());
            } else {
                assert!(!topic.activities.is_empty());
            }
            if topic.subject == Subject::English {
                assert!(topic.language_sequence.is_some());
            } else {
                assert!(topic.language_sequence.is_none());
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
                            && !e.legacy
                            && !e.id.contains(".focus.")
                            && !e.id.contains(".club."))
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

    #[test]
    fn merged_packages_reject_global_duplicate_ids_and_keep_each_source() {
        let math = include_str!("../content/curriculum-v1.json");
        let nature = include_str!("../content/nature-5-v1.json");
        assert!(load_packages(&[]).is_err());
        assert!(load_packages(&[math, math]).is_err());
        assert!(load_packages(&[math, nature, nature]).is_err());
        let data = catalog().unwrap();
        let topics: Vec<_> = data
            .topics
            .iter()
            .filter(|topic| topic.subject == Subject::Nature)
            .collect();
        assert!(topics.len() >= 10);
        for topic in topics {
            assert!(topic.source.ends_with("/nt_gym"));
            assert!(topic.language_sequence.is_none());
            if topic.id == "nature-nucleus" {
                assert!(topic.curriculum_version.contains("06.10.2026"));
                assert!(topic.curriculum_ref.contains("NT5 2.2"));
            } else {
                assert!(topic.curriculum_version.contains("25.09.2026"));
                assert!(!topic.activities.is_empty());
            }
            for difficulty in [
                Difficulty::Vorschule,
                Difficulty::Koenner,
                Difficulty::Streber,
            ] {
                assert!(
                    data.exercises
                        .iter()
                        .filter(|e| e.topic_id == topic.id
                            && e.difficulty == difficulty
                            && !e.legacy)
                        .count()
                        >= 3
                );
            }
        }
    }
}

#[cfg(test)]
mod coverage_tests;

#[cfg(test)]
mod number_line_tests;

#[cfg(test)]
mod help_tests;

#[cfg(test)]
mod practice_tests;

#[cfg(test)]
mod solar_system_tests;

#[cfg(test)]
mod earth_tests;

#[cfg(test)]
mod cell_tests;
