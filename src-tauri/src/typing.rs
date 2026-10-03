use crate::{content::Difficulty, database, learning};
use rusqlite::{params, Connection, OptionalExtension, TransactionBehavior};
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, sync::OnceLock};

const MAX_TEXT_LENGTH: usize = 120;
const LEVELS: [Difficulty; 3] = [
    Difficulty::Vorschule,
    Difficulty::Koenner,
    Difficulty::Streber,
];
const STATIONS: [(&str, &[&str], &str); 12] = [
    ("fj", &["F", "J", "Leertaste"], "fj "),
    ("dk", &["D", "K"], "dk"),
    ("sl", &["S", "L"], "sl"),
    ("aoe", &["A", "Ö"], "aö"),
    ("gh", &["G", "H"], "gh"),
    ("ei", &["E", "I"], "ei"),
    ("ru", &["R", "U"], "ru"),
    ("tz", &["T", "Z"], "tz"),
    ("wo", &["W", "O"], "wo"),
    ("qpue", &["Q", "P", "Ü"], "qpü"),
    ("lower", &["Y", "X", "C", "V", "B", "N", "M"], "yxcvbnm"),
    ("finish", &["Ä", "ß", "Umschalt", ".", ","], "äß.,"),
];

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Source {
    title: String,
    url: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Bank {
    version: u8,
    title: String,
    subject: String,
    target_grade: u8,
    competency: String,
    source_date: String,
    orientation: String,
    sources: Vec<Source>,
    stations: Vec<Station>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Station {
    id: String,
    title: String,
    description: String,
    new_keys: Vec<String>,
    tip: String,
    tasks: Vec<Task>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Task {
    id: String,
    difficulty: Difficulty,
    text: String,
}

impl Bank {
    fn validate(&self) -> Result<(), String> {
        let invalid = || "Der Tastengarten enthält ungültige Übungen.".to_owned();
        let valid_description = |text: &str| {
            !text.trim().is_empty()
                && text.chars().count() <= 500
                && !text.chars().any(char::is_control)
        };
        if self.version != 1
            || self.title != "Tastengarten"
            || self.subject != "fachübergreifend"
            || self.target_grade != 5
            || !valid_description(&self.competency)
            || self.source_date != "2026-10-03"
            || !valid_description(&self.orientation)
            || self.sources.is_empty()
            || self.sources.iter().any(|source| {
                !valid_description(&source.title)
                    || !source.url.starts_with("https://")
                    || !valid_description(&source.url)
            })
            || self.stations.len() != STATIONS.len()
        {
            return Err(invalid());
        }
        let mut task_ids = HashSet::new();
        let mut allowed = HashSet::new();
        for (station, (key, new_keys, new_characters)) in self.stations.iter().zip(STATIONS) {
            allowed.extend(new_characters.chars());
            if key == "finish" {
                // Shift is taught only in the last station; all prior letters may now be capitals.
                let capitals: Vec<_> = allowed.iter().flat_map(|c| c.to_uppercase()).collect();
                allowed.extend(capitals);
            }
            if station.id != format!("typing.{key}.v1")
                || !valid_description(&station.title)
                || !valid_description(&station.description)
                || !valid_description(&station.tip)
                || station
                    .new_keys
                    .iter()
                    .map(String::as_str)
                    .collect::<Vec<_>>()
                    != new_keys
                || station.tasks.len() != 9
            {
                return Err(invalid());
            }
            for level in LEVELS {
                let tasks: Vec<_> = station
                    .tasks
                    .iter()
                    .filter(|task| task.difficulty == level)
                    .collect();
                if tasks.len() != 3 {
                    return Err(invalid());
                }
                for number in 1..=3 {
                    let id = format!("typing.{key}.{}.{number}.v1", level.as_str());
                    if !tasks.iter().any(|task| task.id == id) {
                        return Err(invalid());
                    }
                }
            }
            for task in &station.tasks {
                if !task_ids.insert(&task.id)
                    || task.text.trim().is_empty()
                    || task.text.trim() != task.text
                    || task.text.chars().count() > MAX_TEXT_LENGTH
                    || task.text.chars().any(|c| !allowed.contains(&c))
                {
                    return Err(invalid());
                }
            }
        }
        Ok(())
    }

    fn task(&self, id: &str) -> Option<&Task> {
        self.stations
            .iter()
            .flat_map(|station| &station.tasks)
            .find(|task| task.id == id)
    }
}

fn bank() -> Result<&'static Bank, String> {
    static BANK: OnceLock<Result<Bank, String>> = OnceLock::new();
    BANK.get_or_init(|| {
        let bank: Bank = serde_json::from_str(include_str!("../content/typing-v1.json"))
            .map_err(|_| "Der Tastengarten konnte nicht gelesen werden.".to_owned())?;
        bank.validate()?;
        Ok(bank)
    })
    .as_ref()
    .map_err(Clone::clone)
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentedTask {
    id: &'static str,
    difficulty: Difficulty,
    text: &'static str,
    solved: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentedStation {
    id: &'static str,
    title: &'static str,
    description: &'static str,
    new_keys: &'static [String],
    tip: &'static str,
    tasks: Vec<PresentedTask>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TypingState {
    profile_ready: bool,
    difficulty: Difficulty,
    wallet: learning::Wallet,
    stations: Vec<PresentedStation>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SubmitInput {
    request_id: String,
    task_id: String,
    answer: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SubmitResult {
    correct: bool,
    points_awarded: i64,
    wallet: learning::Wallet,
}

fn db_error(_: rusqlite::Error) -> String {
    "Dein Tastengarten konnte nicht gespeichert oder geladen werden. Bitte versuche es erneut."
        .to_owned()
}

pub fn get_state(connection: &mut Connection) -> Result<TypingState, String> {
    let tx = connection.transaction().map_err(db_error)?;
    let bank = bank()?;
    let solved: HashSet<String> = {
        let mut statement = tx
            .prepare("SELECT task_id FROM typing_progress WHERE profile_id=1 AND solved=1")
            .map_err(db_error)?;
        let rows = statement
            .query_map([], |row| row.get(0))
            .map_err(db_error)?;
        rows.collect::<Result<_, _>>().map_err(db_error)?
    };
    let state = TypingState {
        profile_ready: database::get_profile(&tx)?.is_some(),
        difficulty: database::get_difficulty(&tx)?,
        wallet: learning::wallet(&tx)?,
        stations: bank
            .stations
            .iter()
            .map(|station| PresentedStation {
                id: &station.id,
                title: &station.title,
                description: &station.description,
                new_keys: &station.new_keys,
                tip: &station.tip,
                tasks: station
                    .tasks
                    .iter()
                    .map(|task| PresentedTask {
                        id: &task.id,
                        difficulty: task.difficulty,
                        text: &task.text,
                        solved: solved.contains(&task.id),
                    })
                    .collect(),
            })
            .collect(),
    };
    tx.commit().map_err(db_error)?;
    Ok(state)
}

pub fn submit(connection: &mut Connection, input: SubmitInput) -> Result<SubmitResult, String> {
    if input.request_id.is_empty()
        || input.request_id.len() > 80
        || !input
            .request_id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-')
        || input.task_id.is_empty()
        || input.task_id.len() > 128
        || !input
            .task_id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"-_.".contains(&b))
    {
        return Err("Diese Tippübung ist ungültig. Bitte lade den Tastengarten neu.".to_owned());
    }
    if input.answer.is_empty()
        || input.answer.chars().count() > MAX_TEXT_LENGTH
        || input.answer.chars().any(char::is_control)
    {
        return Err("Bitte tippe eine Zeile mit 1 bis 120 Zeichen ohne Zeilenumbruch.".to_owned());
    }
    let task = bank()?
        .task(&input.task_id)
        .ok_or("Diese Tippübung ist nicht verfügbar. Bitte lade den Tastengarten neu.")?;
    let tx = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(db_error)?;
    if database::get_profile(&tx)?.is_none() {
        return Err("Bitte lege zuerst dein Lernprofil an.".to_owned());
    }
    let old = tx.query_row(
        "SELECT task_id,answer,correct,points_awarded FROM typing_submissions WHERE request_id=?1 AND profile_id=1",
        [&input.request_id],
        |row| Ok((row.get::<_,String>(0)?,row.get::<_,String>(1)?,row.get::<_,bool>(2)?,row.get::<_,i64>(3)?)),
    ).optional().map_err(db_error)?;
    if let Some((id, answer, correct, points_awarded)) = old {
        if id != input.task_id || answer != input.answer {
            return Err(
                "Diese Antwort-ID wurde bereits für eine andere Eingabe verwendet.".to_owned(),
            );
        }
        let wallet = learning::wallet(&tx)?;
        tx.commit().map_err(db_error)?;
        return Ok(SubmitResult {
            correct,
            points_awarded,
            wallet,
        });
    }
    if database::get_difficulty(&tx)? != task.difficulty {
        return Err("Die Stufe wurde geändert. Bitte lade den Tastengarten neu.".to_owned());
    }
    // Exact text, including capitals and spaces. Timing or frontend flags never decide success.
    let correct = input.answer == task.text;
    let already_rewarded: bool = tx.query_row(
        "SELECT EXISTS(SELECT 1 FROM point_entries WHERE profile_id=1 AND kind='answer' AND item_id=?1)",
        [&task.id], |row| row.get(0),
    ).map_err(db_error)?;
    let points_awarded = if correct && !already_rewarded {
        match task.difficulty {
            Difficulty::Vorschule => 1,
            Difficulty::Koenner => 2,
            Difficulty::Streber => 3,
        }
    } else {
        0
    };
    tx.execute(
        "INSERT INTO typing_progress (profile_id,task_id,difficulty,attempts,correct,solved) VALUES (1,?1,?2,1,?3,?3)
         ON CONFLICT(profile_id,task_id) DO UPDATE SET attempts=attempts+1, correct=correct+excluded.correct,
         solved=MAX(solved,excluded.solved), updated_at=CURRENT_TIMESTAMP",
        params![task.id,task.difficulty.as_str(),correct],
    ).map_err(db_error)?;
    if points_awarded > 0 {
        tx.execute(
            "INSERT INTO point_entries (profile_id,kind,item_id,amount) VALUES (1,'answer',?1,?2)",
            params![task.id, points_awarded],
        )
        .map_err(db_error)?;
    }
    tx.execute(
        "INSERT INTO typing_submissions (request_id,profile_id,task_id,difficulty,answer,correct,points_awarded) VALUES (?1,1,?2,?3,?4,?5,?6)",
        params![input.request_id,task.id,task.difficulty.as_str(),input.answer,correct,points_awarded],
    ).map_err(db_error)?;
    let wallet = learning::wallet(&tx)?;
    tx.commit().map_err(db_error)?;
    Ok(SubmitResult {
        correct,
        points_awarded,
        wallet,
    })
}

#[cfg(test)]
mod tests;
