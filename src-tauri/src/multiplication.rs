use crate::{database, learning};
use rusqlite::{params, Connection, OptionalExtension, TransactionBehavior};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Mode {
    Tables,
    Squares,
}
impl Mode {
    fn as_str(self) -> &'static str {
        match self {
            Self::Tables => "tables",
            Self::Squares => "squares",
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub sequence: i64,
    pub left: i64,
    pub right: i64,
}

// Fixed v1 permutations visit every task once per cycle, without a timer or RNG dependency.
fn task(mode: Mode, sequence: i64) -> Task {
    let (left, right) = match mode {
        Mode::Tables => {
            let index = ((sequence % 100) * 37 + 17) % 100;
            (index / 10 + 1, index % 10 + 1)
        }
        Mode::Squares => {
            let n = ((sequence % 25) * 11 + 7) % 25 + 1;
            (n, n)
        }
    };
    Task {
        id: format!("by.math.5.trainer.{}.{}x{}.v1", mode.as_str(), left, right),
        sequence,
        left,
        right,
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContentInfo {
    subject: &'static str,
    grade: u8,
    competency_id: &'static str,
    source: &'static str,
    curriculum_version: &'static str,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrainerState {
    pub content: ContentInfo,
    pub profile_ready: bool,
    pub mode: Mode,
    pub task: Option<Task>,
    pub answered: i64,
    pub correct: i64,
    pub wallet: learning::Wallet,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct AnswerInput {
    pub mode: Mode,
    pub sequence: i64,
    pub answer: Option<String>,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnswerResult {
    pub correct: bool,
    pub points_awarded: i64,
    pub solution: i64,
    pub state: TrainerState,
}
fn db_error(_: rusqlite::Error) -> String {
    "Dein Rechentraining konnte nicht gespeichert werden. Bitte versuche es erneut.".into()
}
fn state(c: &Connection, mode: Mode) -> Result<TrainerState, String> {
    let profile_ready = database::get_profile(c)?.is_some();
    let (answered, correct, next): (i64, i64, i64) = c.query_row(
        "SELECT COUNT(*), COALESCE(SUM(correct),0), COALESCE(MAX(sequence)+1,0) FROM multiplication_answers WHERE profile_id=1 AND mode=?1",
        [mode.as_str()], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?))).map_err(db_error)?;
    Ok(TrainerState {
        content: ContentInfo {
            subject: "mathematics", grade: 5, competency_id: "by.math.5.multiply.fluency.v1",
            source: "Eigene Lernwelt-Rechenaufgaben; Bezug M5 3.1: https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/mathematik",
            curriculum_version: "LehrplanPLUS-Zuordnung 2026-09-24; Trainerinhalt v1",
        },
        profile_ready,
        mode,
        task: profile_ready.then(|| task(mode, next)),
        answered,
        correct,
        wallet: learning::wallet(c)?,
    })
}
pub fn get_state(c: &mut Connection, mode: Mode) -> Result<TrainerState, String> {
    let tx = c.transaction().map_err(db_error)?;
    let value = state(&tx, mode)?;
    tx.commit().map_err(db_error)?;
    Ok(value)
}
pub fn answer(c: &mut Connection, input: AnswerInput) -> Result<AnswerResult, String> {
    if !(0..1_000_000_000).contains(&input.sequence) {
        return Err("Diese Rechenaufgabe ist nicht mehr aktuell. Lade den Trainer neu.".into());
    }
    let number = match input.answer.as_deref() {
        None => None,
        Some(text) => {
            if text.len() > 32
                || text.chars().any(char::is_control)
                || text.trim().is_empty()
                || !text.trim().bytes().all(|b| b.is_ascii_digit())
            {
                return Err(
                    "Gib eine ganze Zahl ein, zum Beispiel 24. Nur Ziffern, keine Rechenzeichen."
                        .into(),
                );
            }
            Some(
                text.trim()
                    .parse::<i64>()
                    .map_err(|_| "Diese Zahl ist zu groß. Prüfe deine Eingabe.".to_owned())?,
            )
        }
    };
    let tx = c
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(db_error)?;
    if database::get_profile(&tx)?.is_none() {
        return Err("Speichere zuerst unten dein Lernprofil.".into());
    }
    let previous: Option<(Option<String>, bool)> = tx.query_row(
        "SELECT answer,correct FROM multiplication_answers WHERE profile_id=1 AND mode=?1 AND sequence=?2",
        params![input.mode.as_str(), input.sequence], |r| Ok((r.get(0)?,r.get(1)?))).optional().map_err(db_error)?;
    let question = task(input.mode, input.sequence);
    let solution = question.left * question.right;
    let correct = if let Some((answer, correct)) = previous {
        if answer != input.answer {
            return Err(
                "Diese Antwort wurde bereits gespeichert. Lade die nächste Aufgabe.".into(),
            );
        }
        correct
    } else {
        let current = state(&tx, input.mode)?;
        if current.task.as_ref().map(|t| t.sequence) != Some(input.sequence) {
            return Err("Diese Aufgabe ist nicht mehr aktuell. Lade den Trainer neu.".into());
        }
        let correct = number == Some(solution);
        tx.execute("INSERT INTO multiplication_answers (profile_id,mode,sequence,answer,correct) VALUES (1,?1,?2,?3,?4)",params![input.mode.as_str(),input.sequence,input.answer,correct]).map_err(db_error)?;
        if correct {
            tx.execute("INSERT INTO point_entries (profile_id,kind,item_id,amount) VALUES (1,'multiplication',?1,1)", [format!("{}-{}", input.mode.as_str(), input.sequence)]).map_err(db_error)?;
        }
        correct
    };
    let result = AnswerResult {
        correct,
        points_awarded: i64::from(correct),
        solution,
        state: state(&tx, input.mode)?,
    };
    tx.commit().map_err(db_error)?;
    Ok(result)
}
#[cfg(test)]
mod tests;
