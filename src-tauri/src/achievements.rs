//! Automatic ranks are a read-only projection of the confirmed points journal.
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, sync::OnceLock};

const INVALID_CATALOG: &str = "Die Lernabzeichen sind gerade nicht verfügbar.";

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Level {
    id: String,
    required_points: i64,
    required_tasks: i64,
}

fn validate(levels: &[Level]) -> Result<(), String> {
    if !levels
        .first()
        .is_some_and(|first| first.required_points == 0 && first.required_tasks == 0)
    {
        return Err(INVALID_CATALOG.to_owned());
    }
    let mut ids = HashSet::new();
    for (index, level) in levels.iter().enumerate() {
        if level.id.is_empty()
            || level.id.len() > 64
            || !level
                .id
                .bytes()
                .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-')
            || !ids.insert(&level.id)
            || (index > 0
                && (level.required_points <= levels[index - 1].required_points
                    || level.required_tasks <= levels[index - 1].required_tasks))
        {
            return Err(INVALID_CATALOG.to_owned());
        }
    }
    Ok(())
}

fn levels() -> Result<&'static [Level], String> {
    static LEVELS: OnceLock<Result<Vec<Level>, String>> = OnceLock::new();
    LEVELS
        .get_or_init(|| {
            let levels: Vec<Level> =
                serde_json::from_str(include_str!("../content/achievements-v1.json"))
                    .map_err(|_| INVALID_CATALOG.to_owned())?;
            validate(&levels)?;
            Ok(levels)
        })
        .as_deref()
        .map_err(Clone::clone)
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AchievementProgress {
    pub completed_tasks: i64,
    pub current_id: String,
    pub unlocked_ids: Vec<String>,
    pub next_id: Option<String>,
}

pub fn progress(total_earned: i64, completed_tasks: i64) -> Result<AchievementProgress, String> {
    if total_earned < 0 || completed_tasks < 0 {
        return Err("Dein Abzeichenstand konnte nicht gelesen werden.".to_owned());
    }
    let levels = levels()?;
    let unlocked_ids: Vec<_> = levels
        .iter()
        .take_while(|level| {
            total_earned >= level.required_points && completed_tasks >= level.required_tasks
        })
        .map(|level| level.id.clone())
        .collect();
    Ok(AchievementProgress {
        completed_tasks,
        current_id: unlocked_ids.last().unwrap().clone(),
        next_id: levels.get(unlocked_ids.len()).map(|level| level.id.clone()),
        unlocked_ids,
    })
}

#[cfg(test)]
mod tests;
