use crate::{content::Difficulty, database};
use rusqlite::{params, Connection, OptionalExtension, TransactionBehavior};
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    sync::OnceLock,
    time::{SystemTime, UNIX_EPOCH},
};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Deck {
    id: String,
    name: String,
}
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Card {
    id: String,
    deck_id: String,
    english: String,
    german: String,
    example: String,
    cloze: String,
    competency_id: String,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Bank {
    version: u32,
    subject: String,
    grade: u8,
    language_sequence: String,
    source: String,
    curriculum_version: String,
    orientation: String,
    decks: Vec<Deck>,
    cards: Vec<Card>,
}
fn bank() -> Result<&'static Bank, String> {
    static BANK: OnceLock<Result<Bank, String>> = OnceLock::new();
    BANK.get_or_init(|| {
        let bank: Bank = serde_json::from_str(include_str!("../content/vocabulary-5-v1.json"))
            .map_err(|_| "Die Wortkarten konnten nicht gelesen werden.".to_owned())?;
        bank.validate()?;
        Ok(bank)
    })
    .as_ref()
    .map_err(Clone::clone)
}
impl Bank {
    fn validate(&self) -> Result<(), String> {
        let invalid = || "Das Wortkartenpaket ist ungültig.".to_owned();
        if self.version != 1
            || self.subject != "english"
            || self.grade != 5
            || self.language_sequence != "1. Fremdsprache"
            || self.source.is_empty()
            || self.curriculum_version.is_empty()
            || self.orientation.is_empty()
            || self.cards.is_empty()
        {
            return Err(invalid());
        }
        let mut decks = HashSet::new();
        for deck in &self.decks {
            if deck.id == "all"
                || deck.id.is_empty()
                || deck.name.is_empty()
                || !decks.insert(&deck.id)
                || !self.cards.iter().any(|c| c.deck_id == deck.id)
            {
                return Err(invalid());
            }
        }
        let mut ids = HashSet::new();
        for card in &self.cards {
            if !ids.insert(&card.id)
                || card.id.is_empty()
                || !decks.contains(&card.deck_id)
                || card.english.trim().is_empty()
                || card.german.trim().is_empty()
                || card.competency_id.is_empty()
                || card.cloze.matches("___").count() != 1
                || card.cloze.replace("___", &card.english) != card.example
            {
                return Err(invalid());
            }
        }
        Ok(())
    }
    fn validate_deck(&self, deck: &str) -> Result<(), String> {
        if deck != "all" && !self.decks.iter().any(|d| d.id == deck) {
            return Err("Dieses Wortthema ist nicht verfügbar.".to_owned());
        }
        Ok(())
    }
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PresentedCard {
    card: &'static Card,
    box_number: u8,
    reviews: i64,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VocabularyState {
    profile_ready: bool,
    difficulty: Difficulty,
    decks: &'static [Deck],
    source: &'static str,
    curriculum_version: &'static str,
    orientation: &'static str,
    new_count: u32,
    due_count: u32,
    boxes: [u32; 5],
    total: u32,
    next_due_at: Option<i64>,
    card: Option<PresentedCard>,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ReviewInput {
    request_id: String,
    card_id: String,
    deck_id: String,
    difficulty: Difficulty,
    expected_reviews: i64,
    known: bool,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewResult {
    state: VocabularyState,
    box_number: u8,
    due_at: i64,
}
#[derive(Debug)]
struct Progress {
    box_number: u8,
    reviews: i64,
    due_at: i64,
}
fn db_error(_: rusqlite::Error) -> String {
    "Deine Wortkarten konnten nicht gespeichert oder geladen werden. Bitte versuche es erneut."
        .to_owned()
}
fn now() -> Result<i64, String> {
    let seconds = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| "Bitte prüfe die Uhrzeit deines Geräts.".to_owned())?
        .as_secs();
    i64::try_from(seconds).map_err(|_| "Bitte prüfe die Uhrzeit deines Geräts.".to_owned())
}
fn progress(
    connection: &Connection,
    difficulty: Difficulty,
) -> Result<HashMap<String, Progress>, String> {
    let mut statement = connection.prepare(
        "SELECT card_id, box_number, reviews, due_at FROM vocabulary_progress WHERE profile_id=1 AND difficulty=?1"
    ).map_err(db_error)?;
    let rows = statement
        .query_map([difficulty.as_str()], |row| {
            Ok((
                row.get(0)?,
                Progress {
                    box_number: row.get(1)?,
                    reviews: row.get(2)?,
                    due_at: row.get(3)?,
                },
            ))
        })
        .map_err(db_error)?;
    rows.collect::<Result<_, _>>().map_err(db_error)
}
fn state_at(connection: &Connection, deck: &str, time: i64) -> Result<VocabularyState, String> {
    let bank = bank()?;
    bank.validate_deck(deck)?;
    let difficulty = database::get_difficulty(connection)?;
    let saved = progress(connection, difficulty)?;
    let profile_ready = database::get_profile(connection)?.is_some();
    let mut state = VocabularyState {
        profile_ready,
        difficulty,
        decks: &bank.decks,
        source: &bank.source,
        curriculum_version: &bank.curriculum_version,
        orientation: &bank.orientation,
        new_count: 0,
        due_count: 0,
        boxes: [0; 5],
        total: 0,
        next_due_at: None,
        card: None,
    };
    let mut first_new = None;
    let mut due: Vec<(&Card, &Progress)> = Vec::new();
    for card in bank
        .cards
        .iter()
        .filter(|c| deck == "all" || c.deck_id == deck)
    {
        state.total += 1;
        if let Some(p) = saved.get(&card.id) {
            state.boxes[usize::from(p.box_number - 1)] += 1;
            if p.due_at <= time {
                state.due_count += 1;
                due.push((card, p));
            } else {
                state.next_due_at =
                    Some(state.next_due_at.map_or(p.due_at, |old| old.min(p.due_at)));
            }
        } else {
            state.new_count += 1;
            first_new.get_or_insert(card);
        }
    }
    due.sort_by_key(|(card, p)| (p.due_at, p.box_number, &card.id));
    if profile_ready {
        state.card = if let Some((card, p)) = due.first() {
            Some(PresentedCard {
                card,
                box_number: p.box_number,
                reviews: p.reviews,
            })
        } else {
            first_new.map(|card| PresentedCard {
                card,
                box_number: 1,
                reviews: 0,
            })
        };
    }
    Ok(state)
}
pub fn get_state(connection: &mut Connection, deck: &str) -> Result<VocabularyState, String> {
    let transaction = connection.transaction().map_err(db_error)?;
    let state = state_at(&transaction, deck, now()?)?;
    transaction.commit().map_err(db_error)?;
    Ok(state)
}
pub fn review(connection: &mut Connection, input: ReviewInput) -> Result<ReviewResult, String> {
    review_at(connection, &input, now()?)
}
fn review_at(
    connection: &mut Connection,
    input: &ReviewInput,
    time: i64,
) -> Result<ReviewResult, String> {
    if input.request_id.is_empty()
        || input.request_id.len() > 80
        || !input
            .request_id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-')
        || input.expected_reviews < 0
        || input.expected_reviews == i64::MAX
    {
        return Err("Die Kartenbewertung ist ungültig. Bitte lade die Karten neu.".to_owned());
    }
    let bank = bank()?;
    bank.validate_deck(&input.deck_id)?;
    let card = bank
        .cards
        .iter()
        .find(|c| c.id == input.card_id)
        .ok_or("Diese Wortkarte ist nicht verfügbar.")?;
    if input.deck_id != "all" && input.deck_id != card.deck_id {
        return Err("Die Wortkarte gehört nicht zu diesem Thema.".to_owned());
    }
    let tx = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(db_error)?;
    if database::get_profile(&tx)?.is_none() {
        return Err("Bitte lege zuerst dein Lernprofil an.".to_owned());
    }
    // Retried responses remain idempotent even if the current global level has since changed.
    let old = tx.query_row(
        "SELECT card_id,difficulty,expected_reviews,known,box_number,due_at,deck_id FROM vocabulary_reviews WHERE request_id=?1 AND profile_id=1",
        [&input.request_id], |r| Ok((r.get::<_,String>(0)?,r.get::<_,String>(1)?,r.get::<_,i64>(2)?,r.get::<_,bool>(3)?,r.get::<_,u8>(4)?,r.get::<_,i64>(5)?,r.get::<_,String>(6)?))
    ).optional().map_err(db_error)?;
    if let Some((id, difficulty, reviews, known, box_number, due_at, deck)) = old {
        if id != input.card_id
            || difficulty != input.difficulty.as_str()
            || reviews != input.expected_reviews
            || known != input.known
            || deck != input.deck_id
        {
            return Err("Diese Bewertungs-ID wurde bereits anders verwendet.".to_owned());
        }
        let state = state_at(&tx, &input.deck_id, time)?;
        tx.commit().map_err(db_error)?;
        return Ok(ReviewResult {
            state,
            box_number,
            due_at,
        });
    }
    if database::get_difficulty(&tx)? != input.difficulty {
        return Err("Die Stufe wurde geändert. Bitte lade die Karten neu.".to_owned());
    }
    let saved = progress(&tx, input.difficulty)?;
    let previous = saved.get(&input.card_id);
    if previous.map_or(0, |p| p.reviews) != input.expected_reviews
        || previous.is_some_and(|p| p.due_at > time)
    {
        return Err("Diese Karte wurde schon bewertet oder ist noch nicht fällig. Bitte lade die Karten neu.".to_owned());
    }
    let box_number = if input.known {
        previous.map_or(2, |p| (p.box_number + 1).min(5))
    } else {
        1
    };
    let interval = match box_number {
        1 => 60,
        2 => 86_400,
        3 => 3 * 86_400,
        4 => 7 * 86_400,
        _ => 14 * 86_400,
    };
    let due_at = time
        .checked_add(interval)
        .ok_or("Bitte prüfe die Uhrzeit deines Geräts.")?;
    tx.execute(
        "INSERT INTO vocabulary_progress (profile_id,card_id,difficulty,box_number,reviews,due_at) VALUES (1,?1,?2,?3,?4,?5)
         ON CONFLICT(profile_id,card_id,difficulty) DO UPDATE SET box_number=excluded.box_number,reviews=excluded.reviews,due_at=excluded.due_at",
        params![input.card_id,input.difficulty.as_str(),box_number,input.expected_reviews+1,due_at]
    ).map_err(db_error)?;
    tx.execute(
        "INSERT INTO vocabulary_reviews (request_id,profile_id,card_id,difficulty,expected_reviews,known,box_number,due_at,deck_id) VALUES (?1,1,?2,?3,?4,?5,?6,?7,?8)",
        params![input.request_id,input.card_id,input.difficulty.as_str(),input.expected_reviews,input.known,box_number,due_at,input.deck_id]
    ).map_err(db_error)?;
    let state = state_at(&tx, &input.deck_id, time)?;
    tx.commit().map_err(db_error)?;
    Ok(ReviewResult {
        state,
        box_number,
        due_at,
    })
}

#[cfg(test)]
mod tests;
