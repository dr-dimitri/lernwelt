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
    pub round: i64,
    pub position: i64,
    pub round_size: i64,
    pub review: bool,
}

// Keep v1 reproducible for tables and historical square-answer replays.
fn legacy_task(mode: Mode, sequence: i64) -> Task {
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
        round: sequence / if mode == Mode::Tables { 100 } else { 25 } + 1,
        position: sequence % if mode == Mode::Tables { 100 } else { 25 } + 1,
        round_size: if mode == Mode::Tables { 100 } else { 25 },
        review: false,
    }
}

fn saved_square(c: &Connection, sequence: i64) -> Result<Option<Task>, String> {
    c.query_row(
        "SELECT factor, round_number, position FROM square_round_tasks WHERE profile_id=1 AND sequence=?1",
        [sequence], |r| {
            let n: i64 = r.get(0)?;
            Ok(Task { id: format!("by.math.5.trainer.squares.{n}x{n}.v2"), sequence,
                left: n, right: n, round: r.get(1)?, position: r.get(2)?, round_size: 20, review:false })
        }).optional().map_err(db_error)
}

// Caller owns an Immediate transaction, including round creation and answer booking.
fn square_task(c: &Connection, sequence: i64) -> Result<Task, String> {
    if let Some(task) = saved_square(c, sequence)? {
        return Ok(task);
    }
    let round: i64 = c
        .query_row(
            "SELECT COALESCE(MAX(round_number),0)+1 FROM square_round_tasks WHERE profile_id=1",
            [],
            |r| r.get(0),
        )
        .map_err(db_error)?;
    let mut select = c.prepare("WITH RECURSIVE numbers(n) AS (VALUES(10) UNION ALL SELECT n+1 FROM numbers WHERE n<20) SELECT n FROM numbers ORDER BY random() LIMIT 5").map_err(db_error)?;
    let chosen = select
        .query_map([], |r| r.get::<_, i64>(0))
        .map_err(db_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(db_error)?;
    let repeated: Vec<_> = chosen.iter().cycle().take(20).copied().collect();
    let json = serde_json::to_string(&repeated)
        .map_err(|_| "Die neue Runde konnte nicht vorbereitet werden.".to_owned())?;
    let mut shuffle = c
        .prepare("SELECT value FROM json_each(?1) ORDER BY random()")
        .map_err(db_error)?;
    let tasks = shuffle
        .query_map([json], |r| r.get::<_, i64>(0))
        .map_err(db_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(db_error)?;
    for (index, factor) in tasks.iter().enumerate() {
        c.execute("INSERT INTO square_round_tasks (profile_id,sequence,factor,round_number,position) VALUES (1,?1,?2,?3,?4)",
            params![sequence + index as i64, factor, round, index as i64 + 1]).map_err(db_error)?;
    }
    saved_square(c, sequence)?
        .ok_or_else(|| "Die neue Runde konnte nicht vorbereitet werden.".to_owned())
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
    pub adventure: Adventure,
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
    let (answered, correct): (i64, i64) = c.query_row(
        "SELECT COUNT(*), COALESCE(SUM(correct),0) FROM multiplication_answers WHERE profile_id=1 AND mode=?1",
        [mode.as_str()], |r| Ok((r.get(0)?, r.get(1)?))).map_err(db_error)?;
    let settings = settings(c)?;
    let adventure = adventure(c, &settings, mode)?;
    let current_world = match settings.world {
        World::Workshop => &adventure.worlds.workshop,
        World::Island => &adventure.worlds.island,
    };
    let task = if profile_ready && !current_world.awaiting_continue {
        assigned_task(c, &settings, mode)?
    } else {
        None
    };
    Ok(TrainerState {
        content: ContentInfo {
            subject: "mathematics", grade: 5, competency_id: "by.math.5.multiply.fluency.v3",
            source: "Eigene Lernwelt-Rechenaufgaben; Bezug M5 3.1 (Einmaleins und Quadrate bis 400) und M5 3.2 (Zerlegen): https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/mathematik",
            curriculum_version: "LehrplanPLUS-Zuordnung 2026-09-25; Trainerinhalt v3; ergänzende Übungen, keine Lernstandsdiagnose",
        },
        profile_ready,mode,task,answered,correct,wallet:learning::wallet(c)?,adventure,
    })
}
pub fn get_state(
    c: &mut Connection,
    mode: impl Into<Option<Mode>>,
) -> Result<TrainerState, String> {
    let tx = c
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(db_error)?;
    let mode = mode.into().unwrap_or(settings(&tx)?.mode);
    let result = state(&tx, mode)?;
    tx.commit().map_err(db_error)?;
    Ok(result)
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
        return Err("Speichere zuerst dein Lernprofil über „Dein Profil“ oben.".into());
    }
    let previous: Option<(Option<String>, bool)> = tx.query_row(
        "SELECT answer,correct FROM multiplication_answers WHERE profile_id=1 AND mode=?1 AND sequence=?2",
        params![input.mode.as_str(), input.sequence], |r| Ok((r.get(0)?,r.get(1)?))).optional().map_err(db_error)?;
    let question = if previous.is_some() {
        if let Some(task) = stored_task(&tx, input.mode, input.sequence)? {
            task
        } else if input.mode == Mode::Squares {
            saved_square(&tx, input.sequence)?
                .unwrap_or_else(|| legacy_task(input.mode, input.sequence))
        } else {
            legacy_task(input.mode, input.sequence)
        }
    } else {
        let current = state(&tx, input.mode)?;
        let question = current
            .task
            .ok_or("Setze zuerst deine Etappe fort oder wähle neue Aufgaben.")?;
        if question.sequence != input.sequence {
            return Err("Diese Aufgabe ist nicht mehr aktuell. Lade den Trainer neu.".into());
        }
        question
    };
    let solution = question.left * question.right;
    let correct = if let Some((answer, correct)) = previous {
        if answer != input.answer {
            return Err(
                "Diese Antwort wurde bereits gespeichert. Lade die nächste Aufgabe.".into(),
            );
        }
        correct
    } else {
        let correct = number == Some(solution);
        tx.execute("INSERT INTO multiplication_answers (profile_id,mode,sequence,answer,correct) VALUES (1,?1,?2,?3,?4)",params![input.mode.as_str(),input.sequence,input.answer,correct]).map_err(db_error)?;
        if correct {
            tx.execute("INSERT INTO point_entries (profile_id,kind,item_id,amount) VALUES (1,'multiplication',?1,1)", [format!("{}-{}", input.mode.as_str(), input.sequence)]).map_err(db_error)?;
        }
        record_adventure_answer(&tx, input.mode, &question, correct)?;
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
mod adventure;
use adventure::{
    adventure, assigned_task, record_adventure_answer, settings, stored_task, Adventure, World,
};
pub use adventure::{configure, Configuration};
#[cfg(test)]
mod adventure_tests;
#[cfg(test)]
mod tests;
