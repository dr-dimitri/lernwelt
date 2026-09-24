//! Bounded offline learning missions. All actions and first-solution awards share
//! one immediate transaction; only the current step is projected across IPC.
use crate::{content::Difficulty, database, learning};
use rusqlite::{params, Connection, OptionalExtension, TransactionBehavior};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    sync::OnceLock,
    time::{SystemTime, UNIX_EPOCH},
};

const DAY: i64 = 86_400;
const ERROR: &str =
    "Deine Lernrunde konnte nicht gespeichert oder geladen werden. Bitte versuche es erneut.";

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Diagram {
    width: Option<u32>,
    height: Option<u32>,
    unit: String,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Exercise {
    id: String,
    prompt: String,
    hint: String,
    answer: String,
    explanation: String,
    answer_kind: String,
    options: Vec<String>,
    unit: Option<String>,
    diagram: Option<Diagram>,
}
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct Discovery {
    title: String,
    text: String,
    diagram: Diagram,
}
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct Activity {
    title: String,
    steps: Vec<String>,
    check: String,
}
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct Variant {
    difficulty: Difficulty,
    variant: u8,
    recall: Exercise,
    solve: Exercise,
    detect: Exercise,
    discovery: Discovery,
    activity: Activity,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Catalog {
    id: String,
    title: String,
    description: String,
    subject: database::Subject,
    grade: u8,
    competency_id: String,
    source: String,
    curriculum_version: String,
    variants: Vec<Variant>,
}
fn catalog() -> Result<&'static Catalog, String> {
    static CATALOG: OnceLock<Result<Catalog, String>> = OnceLock::new();
    CATALOG
        .get_or_init(|| {
            let catalog: Catalog =
                serde_json::from_str(include_str!("../content/mission-garden-v1.json"))
                    .map_err(|_| "Die Inhalte der Lernrunde sind nicht verfügbar.".to_owned())?;
            validate_catalog(&catalog)?;
            Ok(catalog)
        })
        .as_ref()
        .map_err(Clone::clone)
}
fn validate_catalog(catalog: &Catalog) -> Result<(), String> {
    let invalid = || "Die Inhalte der Lernrunde sind nicht vollständig.".to_owned();
    if catalog.variants.len() != 9
        || catalog.grade != 5
        || catalog.subject != database::Subject::Mathematics
        || [
            &catalog.id,
            &catalog.title,
            &catalog.description,
            &catalog.competency_id,
            &catalog.source,
            &catalog.curriculum_version,
        ]
        .iter()
        .any(|s| s.trim().is_empty())
    {
        return Err(invalid());
    }
    let mut variants = HashSet::new();
    let mut ids = HashSet::new();
    for v in &catalog.variants {
        if v.variant > 2
            || !variants.insert((v.difficulty.as_str(), v.variant))
            || v.discovery.title.is_empty()
            || v.discovery.text.is_empty()
            || v.activity.title.is_empty()
            || v.activity.steps.is_empty()
            || v.activity.check.is_empty()
        {
            return Err(invalid());
        }
        for e in [&v.recall, &v.solve, &v.detect] {
            if !ids.insert(&e.id)
                || [&e.id, &e.prompt, &e.hint, &e.answer, &e.explanation]
                    .iter()
                    .any(|s| s.trim().is_empty())
                || (e.answer_kind == "number"
                    && (e.answer.parse::<u32>().is_err() || !e.options.is_empty()))
                || (e.answer_kind == "choice"
                    && (!e.options.contains(&e.answer)
                        || e.options.len() < 2
                        || e.options.len() > 4))
                || !matches!(e.answer_kind.as_str(), "number" | "choice")
            {
                return Err(invalid());
            }
        }
    }
    Ok(())
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct Metadata {
    id: &'static str,
    title: &'static str,
    description: &'static str,
    subject: database::Subject,
    grade: u8,
    competency_id: &'static str,
    source: &'static str,
    curriculum_version: &'static str,
    variant_count: u8,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct Progress {
    tried: bool,
    solved_independently: bool,
    recalled_later: bool,
    completed_rounds: i64,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct Feedback {
    correct: Option<bool>,
    revealed: bool,
    explanation: &'static str,
    points_awarded: i64,
    independent: bool,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct Step {
    index: u8,
    kind: &'static str,
    title: &'static str,
    prompt: &'static str,
    instructions: &'static [String],
    diagram: Option<&'static Diagram>,
    unit: Option<&'static str>,
    answer_kind: Option<&'static str>,
    options: &'static [String],
    hint: Option<&'static str>,
    feedback: Option<Feedback>,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct Session {
    id: String,
    round: i64,
    variant: u8,
    completed: bool,
    current_step: Option<Step>,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MissionState {
    profile_ready: bool,
    difficulty: Difficulty,
    metadata: Metadata,
    progress: Progress,
    due_at: Option<i64>,
    due: bool,
    wallet: learning::Wallet,
    session: Option<Session>,
}
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct StartInput {
    pub request_id: String,
    pub difficulty: Difficulty,
}
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Action {
    Answer,
    Hint,
    Reveal,
    Next,
    Skip,
}
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ActionInput {
    pub request_id: String,
    pub session_id: String,
    pub step_index: u8,
    pub action: Action,
    pub answer: Option<String>,
}
#[derive(Debug)]
struct StoredSession {
    id: String,
    difficulty: Difficulty,
    round: i64,
    variant: u8,
    current_step: u8,
    recall_eligible: bool,
}
#[derive(Debug, Default)]
struct StoredStep {
    hinted: bool,
    outcome: Option<String>,
    points: i64,
    independent: bool,
}
#[derive(Debug, Default)]
struct StoredProgress {
    independent_at: Option<i64>,
    independent_variant: Option<u8>,
    recalled_later_at: Option<i64>,
    last_practiced_at: i64,
    due_at: Option<i64>,
    interval_days: i64,
}
fn db_error(_: rusqlite::Error) -> String {
    ERROR.to_owned()
}
fn now() -> Result<i64, String> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .ok()
        .and_then(|d| i64::try_from(d.as_secs()).ok())
        .ok_or_else(|| "Die Gerätezeit ist nicht verfügbar.".to_owned())
}
fn valid_id(id: &str) -> bool {
    !id.is_empty() && id.len() <= 80 && id.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-')
}
fn progress(connection: &Connection, difficulty: Difficulty) -> Result<StoredProgress, String> {
    connection.query_row("SELECT independent_at, independent_variant, recalled_later_at, last_practiced_at, due_at, interval_days FROM mission_progress WHERE profile_id = 1 AND topic_id = ?1 AND difficulty = ?2", params![catalog()?.id, difficulty.as_str()], |r| Ok(StoredProgress { independent_at:r.get(0)?, independent_variant:r.get(1)?, recalled_later_at:r.get(2)?, last_practiced_at:r.get(3)?, due_at:r.get(4)?, interval_days:r.get(5)? })).optional().map(|p| p.unwrap_or(StoredProgress { interval_days:1, ..Default::default() })).map_err(db_error)
}
fn stored_step(connection: &Connection, session_id: &str, index: u8) -> Result<StoredStep, String> {
    connection.query_row("SELECT hinted, outcome, points_awarded, independent FROM mission_steps WHERE session_id = ?1 AND step_index = ?2", params![session_id,index], |r| Ok(StoredStep { hinted:r.get(0)?, outcome:r.get(1)?, points:r.get(2)?, independent:r.get(3)? })).optional().map(|s| s.unwrap_or_default()).map_err(db_error)
}
fn session_from_row(r: &rusqlite::Row<'_>) -> rusqlite::Result<StoredSession> {
    let difficulty: String = r.get(1)?;
    Ok(StoredSession {
        id: r.get(0)?,
        difficulty: Difficulty::parse(&difficulty).map_err(|_| rusqlite::Error::InvalidQuery)?,
        round: r.get(2)?,
        variant: r.get(3)?,
        current_step: r.get(4)?,
        recall_eligible: r.get(5)?,
    })
}
fn latest_session(
    connection: &Connection,
    difficulty: Difficulty,
) -> Result<Option<StoredSession>, String> {
    connection.query_row("SELECT id,difficulty,round,variant,current_step,recall_eligible FROM mission_sessions WHERE profile_id = 1 AND topic_id = ?1 AND difficulty = ?2 ORDER BY round DESC LIMIT 1", params![catalog()?.id,difficulty.as_str()], session_from_row).optional().map_err(db_error)
}
fn variant(session: &StoredSession) -> Result<&'static Variant, String> {
    catalog()?
        .variants
        .iter()
        .find(|v| v.difficulty == session.difficulty && v.variant == session.variant)
        .ok_or_else(|| "Diese Lernrunde ist nicht verfügbar.".to_owned())
}
fn exercise(v: &'static Variant, index: u8) -> Option<&'static Exercise> {
    match index {
        0 => Some(&v.recall),
        2 => Some(&v.solve),
        3 => Some(&v.detect),
        _ => None,
    }
}
fn project_step(connection: &Connection, session: &StoredSession) -> Result<Option<Step>, String> {
    if session.current_step == 5 {
        return Ok(None);
    }
    let v = variant(session)?;
    let s = stored_step(connection, &session.id, session.current_step)?;
    let (kind, title) = match session.current_step {
        0 => ("recall", "Erinnern"),
        1 => ("discover", v.discovery.title.as_str()),
        2 => ("solve", "Selbst lösen"),
        3 => ("detect", "Fehlerdetektiv"),
        _ => ("activity", v.activity.title.as_str()),
    };
    let mut step = Step {
        index: session.current_step,
        kind,
        title,
        prompt: "",
        instructions: &[],
        diagram: None,
        unit: None,
        answer_kind: None,
        options: &[],
        hint: None,
        feedback: None,
    };
    if let Some(e) = exercise(v, session.current_step) {
        step.prompt = &e.prompt;
        step.diagram = e.diagram.as_ref();
        step.unit = e.unit.as_deref();
        step.answer_kind = Some(&e.answer_kind);
        step.options = &e.options;
        step.hint = s.hinted.then_some(e.hint.as_str());
        step.feedback = s.outcome.as_deref().map(|o| Feedback {
            correct: if o == "revealed" {
                None
            } else {
                Some(o == "correct")
            },
            revealed: o == "revealed",
            explanation: &e.explanation,
            points_awarded: s.points,
            independent: s.independent,
        });
    } else if session.current_step == 1 {
        step.prompt = &v.discovery.text;
        step.diagram = Some(&v.discovery.diagram);
    } else {
        step.prompt = "Probiere es mit einem echten Gegenstand aus. Diese Aufgabe ist freiwillig.";
        step.instructions = &v.activity.steps;
        step.feedback = s.outcome.map(|_| Feedback {
            correct: None,
            revealed: true,
            explanation: &v.activity.check,
            points_awarded: 0,
            independent: false,
        });
    }
    Ok(Some(step))
}
fn state(connection: &Connection, now: i64) -> Result<MissionState, String> {
    let catalog = catalog()?;
    let difficulty = database::get_difficulty(connection)?;
    let p = progress(connection, difficulty)?;
    let latest = latest_session(connection, difficulty)?;
    let completed_rounds = connection.query_row("SELECT COUNT(*) FROM mission_sessions WHERE profile_id = 1 AND topic_id = ?1 AND difficulty = ?2 AND completed_at IS NOT NULL", params![catalog.id,difficulty.as_str()], |r| r.get(0)).map_err(db_error)?;
    let tried = latest.is_some();
    let session = latest
        .map(|s| {
            Ok::<_, String>(Session {
                current_step: project_step(connection, &s)?,
                completed: s.current_step == 5,
                id: s.id,
                round: s.round,
                variant: s.variant + 1,
            })
        })
        .transpose()?;
    Ok(MissionState {
        profile_ready: database::get_profile(connection)?.is_some(),
        difficulty,
        metadata: Metadata {
            id: &catalog.id,
            title: &catalog.title,
            description: &catalog.description,
            subject: catalog.subject,
            grade: catalog.grade,
            competency_id: &catalog.competency_id,
            source: &catalog.source,
            curriculum_version: &catalog.curriculum_version,
            variant_count: 3,
        },
        progress: Progress {
            tried,
            solved_independently: p.independent_at.is_some(),
            recalled_later: p.recalled_later_at.is_some(),
            completed_rounds,
        },
        due_at: p.due_at,
        due: p.due_at.is_some_and(|due| due <= now),
        wallet: learning::wallet(connection)?,
        session,
    })
}
pub fn get_state(connection: &mut Connection) -> Result<MissionState, String> {
    get_state_at(connection, now()?)
}
fn get_state_at(connection: &mut Connection, now: i64) -> Result<MissionState, String> {
    let tx = connection.transaction().map_err(db_error)?;
    let result = state(&tx, now)?;
    tx.commit().map_err(db_error)?;
    Ok(result)
}
fn request_replayed(
    connection: &Connection,
    request_id: &str,
    payload: &str,
) -> Result<bool, String> {
    let old: Option<String> = connection
        .query_row(
            "SELECT payload FROM mission_requests WHERE request_id = ?1 AND profile_id = 1",
            [request_id],
            |r| r.get(0),
        )
        .optional()
        .map_err(db_error)?;
    match old {
        Some(old) if old != payload => Err(
            "Diese Anfrage-ID gehört bereits zu einer anderen Aktion. Lade die Runde neu."
                .to_owned(),
        ),
        Some(_) => Ok(true),
        None => Ok(false),
    }
}
fn store_request(
    connection: &Connection,
    request_id: &str,
    payload: &str,
    now: i64,
) -> Result<(), String> {
    connection.execute("INSERT INTO mission_requests(request_id,profile_id,payload,created_at) VALUES(?1,1,?2,?3)",params![request_id,payload,now]).map_err(db_error)?;
    Ok(())
}
fn require_profile(connection: &Connection) -> Result<(), String> {
    if database::get_profile(connection)?.is_none() {
        Err("Bitte speichere zuerst dein Lernprofil über ‚Dein Profil‘.".to_owned())
    } else {
        Ok(())
    }
}
pub fn start(connection: &mut Connection, input: StartInput) -> Result<MissionState, String> {
    start_at(connection, input, now()?)
}
fn start_at(
    connection: &mut Connection,
    input: StartInput,
    now: i64,
) -> Result<MissionState, String> {
    if !valid_id(&input.request_id) {
        return Err("Die Anfrage-ID ist ungültig.".to_owned());
    }
    let payload = format!(
        "start:{}",
        serde_json::to_string(&input).map_err(|_| ERROR)?
    );
    let tx = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(db_error)?;
    require_profile(&tx)?;
    if !request_replayed(&tx, &input.request_id, &payload)? {
        if database::get_difficulty(&tx)? != input.difficulty {
            return Err("Die Stufe hat sich geändert. Lade die Lernrunde neu.".to_owned());
        }
        let latest = latest_session(&tx, input.difficulty)?;
        if latest.as_ref().is_none_or(|s| s.current_step == 5) {
            let round = latest.map_or(1, |s| s.round + 1);
            let variant = ((round - 1) % 3) as u8;
            let p = progress(&tx, input.difficulty)?;
            let eligible = p.independent_at.is_some_and(|at| now >= at + DAY)
                && now >= p.last_practiced_at + DAY
                && p.independent_variant != Some(variant);
            tx.execute("INSERT INTO mission_sessions(id,profile_id,topic_id,difficulty,round,variant,recall_eligible,started_at) VALUES(?1,1,?2,?3,?4,?5,?6,?7)",params![input.request_id,catalog()?.id,input.difficulty.as_str(),round,variant,eligible,now]).map_err(db_error)?;
            tx.execute("INSERT INTO mission_progress(profile_id,topic_id,difficulty,last_practiced_at) VALUES(1,?1,?2,?3) ON CONFLICT(profile_id,topic_id,difficulty) DO UPDATE SET last_practiced_at=excluded.last_practiced_at",params![catalog()?.id,input.difficulty.as_str(),now]).map_err(db_error)?;
        }
        store_request(&tx, &input.request_id, &payload, now)?;
    }
    let result = state(&tx, now)?;
    tx.commit().map_err(db_error)?;
    Ok(result)
}
pub fn act(connection: &mut Connection, input: ActionInput) -> Result<MissionState, String> {
    act_at(connection, input, now()?)
}
fn act_at(
    connection: &mut Connection,
    input: ActionInput,
    now: i64,
) -> Result<MissionState, String> {
    if !valid_id(&input.request_id) || !valid_id(&input.session_id) || input.step_index > 4 {
        return Err("Diese Lernaktion ist ungültig. Lade die Runde neu.".to_owned());
    }
    match (&input.action, &input.answer) {
        (Action::Answer, Some(answer))
            if !answer.trim().is_empty()
                && answer.chars().count() <= 120
                && !answer.chars().any(char::is_control) => {}
        (Action::Answer, _) => {
            return Err("Bitte gib eine Antwort mit 1 bis 120 Zeichen ein.".to_owned())
        }
        (_, Some(_)) => return Err("Diese Aktion erwartet keine Antwort.".to_owned()),
        (_, None) => {}
    }
    let payload = format!("act:{}", serde_json::to_string(&input).map_err(|_| ERROR)?);
    let tx = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(db_error)?;
    require_profile(&tx)?;
    if !request_replayed(&tx, &input.request_id, &payload)? {
        let current = latest_session(&tx, database::get_difficulty(&tx)?)?
            .ok_or("Starte zuerst eine Lernrunde.")?;
        if current.id != input.session_id || current.current_step != input.step_index {
            return Err("Die Lernrunde ist schon weiter oder die Stufe wurde gewechselt. Lade den aktuellen Stand.".to_owned());
        }
        apply_action(&tx, &current, &input, now)?;
        store_request(&tx, &input.request_id, &payload, now)?;
    }
    let result = state(&tx, now)?;
    tx.commit().map_err(db_error)?;
    Ok(result)
}
fn apply_action(
    connection: &Connection,
    session: &StoredSession,
    input: &ActionInput,
    now: i64,
) -> Result<(), String> {
    let v = variant(session)?;
    let exercise = exercise(v, session.current_step);
    let stored = stored_step(connection, &session.id, session.current_step)?;
    let invalid =
        || "Diese Aktion passt nicht zum aktuellen Schritt. Lade die Runde neu.".to_owned();
    match input.action {
        Action::Hint => {
            if exercise.is_none() || stored.outcome.is_some() {
                return Err(invalid());
            }
            connection.execute("INSERT INTO mission_steps(session_id,step_index,hinted) VALUES(?1,?2,1) ON CONFLICT(session_id,step_index) DO UPDATE SET hinted=1",params![session.id,session.current_step]).map_err(db_error)?;
        }
        Action::Answer | Action::Reveal => {
            if stored.outcome.is_some() {
                return Err(
                    "Diese Aufgabe wurde bereits beantwortet. Gehe zum nächsten Schritt."
                        .to_owned(),
                );
            }
            let revealing = matches!(input.action, Action::Reveal);
            let (correct, points) = if let Some(e) = exercise {
                let correct = if revealing {
                    false
                } else {
                    let answer = input.answer.as_deref().ok_or_else(invalid)?;
                    if e.answer_kind == "number" {
                        let actual = crate::content::canonical_number(answer).ok_or(
                            "Gib bitte eine Zahl ohne Einheit ein. Komma oder Punkt sind erlaubt.",
                        )?;
                        Some(actual) == crate::content::canonical_number(&e.answer)
                    } else {
                        if !e.options.iter().any(|option| option == answer) {
                            return Err("Wähle bitte eine der angebotenen Antworten.".to_owned());
                        }
                        answer == e.answer
                    }
                };
                let points = if revealing {
                    0
                } else {
                    learning::record_exercise_result(
                        connection,
                        &e.id,
                        database::Subject::Mathematics,
                        &catalog()?.competency_id,
                        session.difficulty,
                        correct,
                    )?
                };
                (correct, points)
            } else if session.current_step == 4 && revealing {
                (false, 0)
            } else {
                return Err(invalid());
            };
            let independent = correct && !stored.hinted;
            let outcome = if revealing {
                "revealed"
            } else if correct {
                "correct"
            } else {
                "incorrect"
            };
            connection.execute("INSERT INTO mission_steps(session_id,step_index,hinted,outcome,answer,independent,points_awarded) VALUES(?1,?2,?3,?4,?5,?6,?7) ON CONFLICT(session_id,step_index) DO UPDATE SET outcome=excluded.outcome,answer=excluded.answer,independent=excluded.independent,points_awarded=excluded.points_awarded",params![session.id,session.current_step,stored.hinted,outcome,input.answer,independent,points]).map_err(db_error)?;
            if independent {
                let delayed = session.current_step == 0 && session.recall_eligible;
                connection.execute("UPDATE mission_progress SET independent_at=COALESCE(independent_at,?1), independent_variant=?2, recalled_later_at=CASE WHEN ?3 THEN COALESCE(recalled_later_at,?1) ELSE recalled_later_at END WHERE profile_id=1 AND topic_id=?4 AND difficulty=?5",params![now,session.variant,delayed,catalog()?.id,session.difficulty.as_str()]).map_err(db_error)?;
            }
        }
        Action::Next | Action::Skip => {
            let skip = matches!(input.action, Action::Skip);
            if (skip && session.current_step != 4)
                || (!skip && session.current_step != 1 && stored.outcome.is_none())
            {
                return Err(invalid());
            }
            let completed = session.current_step == 4;
            connection.execute("UPDATE mission_sessions SET current_step=current_step+1,completed_at=?1 WHERE id=?2",params![completed.then_some(now),session.id]).map_err(db_error)?;
            if completed {
                let p = progress(connection, session.difficulty)?;
                let recall = stored_step(connection, &session.id, 0)?;
                let days = if session.recall_eligible && recall.independent {
                    match p.interval_days {
                        1 => 3,
                        3 => 7,
                        _ => 14,
                    }
                } else if !recall.independent {
                    1
                } else {
                    p.interval_days
                };
                let next_due = now + days * DAY;
                // Extra practice never postpones an already scheduled future review.
                let due = p
                    .due_at
                    .filter(|due| *due > now)
                    .map_or(next_due, |due| due.min(next_due));
                connection.execute("UPDATE mission_progress SET due_at=?1,interval_days=?2 WHERE profile_id=1 AND topic_id=?3 AND difficulty=?4",params![due,days,catalog()?.id,session.difficulty.as_str()]).map_err(db_error)?;
            }
        }
    }
    connection.execute("UPDATE mission_progress SET last_practiced_at=?1 WHERE profile_id=1 AND topic_id=?2 AND difficulty=?3",params![now,catalog()?.id,session.difficulty.as_str()]).map_err(db_error)?;
    Ok(())
}

#[cfg(test)]
mod tests;
