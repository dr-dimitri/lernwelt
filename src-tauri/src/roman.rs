//! Generated Roman-number exercises use stable content identities and the shared answer journal.
use crate::content::{AnswerKind, Difficulty, Exercise};
use crate::database::{self, Subject};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

const PREFIX: &str = "by.math.5.roman-random.";
const COMPETENCY: &str = "by.math.5.numbers.roman";
const SOURCE: &str = "Eigene Lernwelt-Zufallsübungen; Bezug M5 1.1: https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/mathematik";
const CURRICULUM_VERSION: &str =
    "LehrplanPLUS-Zuordnung 2026-10-03; Zufallsübungen v1 mit wiederholtem M bis 9999";
const HINT: &str = "I = 1, V = 5, X = 10, L = 50, C = 100, D = 500 und M = 1000. Hier darf M bis zu neunmal hintereinander stehen: MMMM = 4000.";
const SUBTRACTION_HINT: &str = "Diese Paare ziehen eine kleinere Zahl ab: IV = 4, IX = 9, XL = 40, XC = 90, CD = 400 und CM = 900.";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum Direction {
    DecimalToRoman,
    RomanToDecimal,
}

impl Direction {
    fn as_str(self) -> &'static str {
        match self {
            Self::DecimalToRoman => "decimal-to-roman",
            Self::RomanToDecimal => "roman-to-decimal",
        }
    }

    fn parse(value: &str) -> Option<Self> {
        match value {
            "decimal-to-roman" => Some(Self::DecimalToRoman),
            "roman-to-decimal" => Some(Self::RomanToDecimal),
            _ => None,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Question {
    id: String,
    subject: Subject,
    prompt: String,
    solved: bool,
    topic_id: String,
    difficulty: Difficulty,
    hint: String,
    further_hints: Vec<String>,
    options: Vec<String>,
    answer_kind: AnswerKind,
    unit: Option<String>,
    competency_id: String,
    grade: u8,
    source: &'static str,
    curriculum_version: &'static str,
}

fn unavailable() -> String {
    "Diese Zufallsaufgabe ist nicht verfügbar. Bitte lade eine neue Zahl.".to_owned()
}

fn db_error(_: rusqlite::Error) -> String {
    "Die nächste römische Zahl konnte nicht geladen werden. Bitte versuche es erneut.".to_owned()
}

fn question_id(direction: Direction, difficulty: Difficulty, value: u16) -> String {
    format!(
        "{PREFIX}{}.{}.{value}.v1",
        direction.as_str(),
        difficulty.as_str()
    )
}

fn parse_id(id: &str) -> Result<(Direction, Difficulty, u16), String> {
    if id.len() > 100 {
        return Err(unavailable());
    }
    let mut parts = id.strip_prefix(PREFIX).ok_or_else(unavailable)?.split('.');
    let direction =
        Direction::parse(parts.next().ok_or_else(unavailable)?).ok_or_else(unavailable)?;
    let difficulty =
        Difficulty::parse(parts.next().ok_or_else(unavailable)?).map_err(|_| unavailable())?;
    let value = parts
        .next()
        .ok_or_else(unavailable)?
        .parse::<u16>()
        .map_err(|_| unavailable())?;
    if !(1..=9999).contains(&value)
        || parts.next() != Some("v1")
        || parts.next().is_some()
        || question_id(direction, difficulty, value) != id
    {
        return Err(unavailable());
    }
    Ok((direction, difficulty, value))
}

fn groups(value: u16) -> Vec<(String, u16)> {
    let hundreds = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM"];
    let tens = ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"];
    let ones = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
    [
        ("M".repeat(usize::from(value / 1000)), value / 1000 * 1000),
        (
            hundreds[usize::from(value / 100 % 10)].to_owned(),
            value / 100 % 10 * 100,
        ),
        (
            tens[usize::from(value / 10 % 10)].to_owned(),
            value / 10 % 10 * 10,
        ),
        (ones[usize::from(value % 10)].to_owned(), value % 10),
    ]
    .into_iter()
    .filter(|(_, amount)| *amount > 0)
    .collect()
}

fn format_roman(value: u16) -> String {
    groups(value).into_iter().map(|(signs, _)| signs).collect()
}

fn explanation(value: u16) -> String {
    let groups = groups(value);
    let meanings = groups
        .iter()
        .map(|(signs, amount)| format!("{signs} = {amount}"))
        .collect::<Vec<_>>()
        .join(", ");
    let sum = groups
        .iter()
        .map(|(_, amount)| amount.to_string())
        .collect::<Vec<_>>()
        .join(" + ");
    let roman = format_roman(value);
    if groups.len() == 1 {
        format!("{roman} = {value}.")
    } else {
        format!("{roman} besteht aus diesen Gruppen: {meanings}.\nZusammen: {sum} = {value}.")
    }
}

fn exercise(direction: Direction, difficulty: Difficulty, value: u16) -> Exercise {
    let roman = format_roman(value);
    let (prompt, answer, answer_kind, unit, further_hint) = match direction {
        Direction::DecimalToRoman => (
            format!("Schreibe {value} als römische Zahl."),
            roman,
            AnswerKind::Text,
            "Nutze I, V, X, L, C, D und M.",
            "Zerlege die Zahl in Tausender, Hunderter, Zehner und Einer. Übersetze jede Gruppe und füge die Zeichen zusammen.",
        ),
        Direction::RomanToDecimal => (
            format!("Welche Zahl bedeutet {roman}?\nSchreibe sie mit den Ziffern 0 bis 9."),
            value.to_string(),
            AnswerKind::Number,
            "Schreibe nur die Zahl.",
            "Lies M zuerst als Tausender. Teile den Rest in Gruppen für Hunderter, Zehner und Einer und addiere ihre Werte.",
        ),
    };
    Exercise {
        id: question_id(direction, difficulty, value),
        subject: Subject::Mathematics,
        topic_id: "numbers".to_owned(),
        difficulty,
        competency_id: COMPETENCY.to_owned(),
        prompt,
        answer,
        hint: HINT.to_owned(),
        further_hints: vec![further_hint.to_owned(), SUBTRACTION_HINT.to_owned()],
        common_mistakes: vec![],
        explanation: explanation(value),
        options: vec![],
        answer_kind,
        unit: Some(unit.to_owned()),
        legacy: false,
        number_line: None,
        audio_card_id: None,
        solar_system_planet_id: None,
    }
}

pub(crate) fn exercise_from_id(id: &str) -> Result<Exercise, String> {
    let (direction, difficulty, value) = parse_id(id)?;
    Ok(exercise(direction, difficulty, value))
}

/// Loading a question does not write attempts, answers or points.
pub fn get_question(
    connection: &mut Connection,
    direction: Direction,
    previous_question_id: Option<&str>,
) -> Result<Question, String> {
    let previous = previous_question_id.map(parse_id).transpose()?;
    let transaction = connection.transaction().map_err(db_error)?;
    let difficulty = database::get_difficulty(&transaction)?;
    // Choose among 9998 remaining values without a retry loop, including direction changes.
    let count = if previous.is_some() { 9998 } else { 9999 };
    let mut value: u16 = transaction
        .query_row(
            "SELECT ((random() & 9223372036854775807) % ?1) + 1",
            [count],
            |row| row.get(0),
        )
        .map_err(db_error)?;
    if previous.is_some_and(|(_, _, previous_value)| value >= previous_value) {
        value += 1;
    }
    let exercise = exercise(direction, difficulty, value);
    let solved = transaction
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM point_entries WHERE profile_id = 1 AND kind = 'answer' AND item_id = ?1)",
            params![exercise.id],
            |row| row.get(0),
        )
        .map_err(db_error)?;
    let question = Question {
        id: exercise.id,
        subject: exercise.subject,
        prompt: exercise.prompt,
        solved,
        topic_id: exercise.topic_id,
        difficulty: exercise.difficulty,
        hint: exercise.hint,
        further_hints: exercise.further_hints,
        options: exercise.options,
        answer_kind: exercise.answer_kind,
        unit: exercise.unit,
        competency_id: exercise.competency_id,
        grade: 5,
        source: SOURCE,
        curriculum_version: CURRICULUM_VERSION,
    };
    transaction.commit().map_err(db_error)?;
    Ok(question)
}

#[cfg(test)]
mod tests;
