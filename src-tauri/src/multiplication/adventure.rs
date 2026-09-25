use super::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum World {
    Workshop,
    Island,
}
impl World {
    fn as_str(self) -> &'static str {
        match self {
            Self::Workshop => "workshop",
            Self::Island => "island",
        }
    }
}
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Design {
    Scout,
    Garden,
    Aqua,
}
impl Design {
    fn as_str(self) -> &'static str {
        match self {
            Self::Scout => "scout",
            Self::Garden => "garden",
            Self::Aqua => "aqua",
        }
    }
}
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Palette {
    Mint,
    Amber,
    Violet,
}
impl Palette {
    fn as_str(self) -> &'static str {
        match self {
            Self::Mint => "mint",
            Self::Amber => "amber",
            Self::Violet => "violet",
        }
    }
}
#[derive(Debug)]
pub(super) struct Settings {
    pub revision: i64,
    pub mode: Mode,
    pub world: World,
    pub design: Design,
    pub palette: Palette,
    pub table: Option<i64>,
    pub review: bool,
    pub review_run: i64,
}
fn decode<T: serde::de::DeserializeOwned>(value: String) -> rusqlite::Result<T> {
    serde_json::from_value(serde_json::Value::String(value))
        .map_err(|_| rusqlite::Error::InvalidQuery)
}
pub(super) fn settings(c: &Connection) -> Result<Settings, String> {
    c.query_row("SELECT revision,mode,world,design,palette,table_number,review,review_run FROM multiplication_settings WHERE id=1",[],|r|Ok(Settings{revision:r.get(0)?,mode:decode(r.get(1)?)?,world:decode(r.get(2)?)?,design:decode(r.get(3)?)?,palette:decode(r.get(4)?)?,table:r.get(5)?,review:r.get(6)?,review_run:r.get(7)?})).map_err(db_error)
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorldProgress {
    pub answered: i64,
    pub completed_stages: i64,
    pub stage_answered: i64,
    pub awaiting_continue: bool,
}
#[derive(Debug, Serialize)]
pub struct Worlds {
    pub workshop: WorldProgress,
    pub island: WorldProgress,
}
#[derive(Debug, Serialize)]
pub struct Robot {
    pub design: Design,
    pub palette: Palette,
    pub count: i64,
}
#[derive(Debug, Serialize)]
pub struct RobotAppearance {
    pub design: Design,
    pub palette: Palette,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Adventure {
    pub revision: i64,
    pub world: World,
    pub design: Design,
    pub palette: Palette,
    pub table: Option<i64>,
    pub review: bool,
    pub review_count: i64,
    pub stage_size: i64,
    pub worlds: Worlds,
    pub robots: Vec<Robot>,
    pub last_robot: Option<RobotAppearance>,
}
fn world_progress(c: &Connection, world: World) -> Result<WorldProgress, String> {
    let (answered,awaiting_continue):(i64,bool)=c.query_row("SELECT answered,awaiting_continue FROM multiplication_worlds WHERE profile_id=1 AND world=?1",[world.as_str()],|r|Ok((r.get(0)?,r.get(1)?))).optional().map_err(db_error)?.unwrap_or((0,false));
    Ok(WorldProgress {
        answered,
        completed_stages: answered / 8,
        stage_answered: if awaiting_continue { 8 } else { answered % 8 },
        awaiting_continue,
    })
}
pub(super) fn adventure(c: &Connection, s: &Settings, mode: Mode) -> Result<Adventure, String> {
    let mut query=c.prepare("SELECT design,palette,count FROM multiplication_robots WHERE profile_id=1 ORDER BY design,palette").map_err(db_error)?;
    let robots = query
        .query_map([], |r| {
            Ok(Robot {
                design: decode(r.get(0)?)?,
                palette: decode(r.get(1)?)?,
                count: r.get(2)?,
            })
        })
        .map_err(db_error)?
        .collect::<Result<_, _>>()
        .map_err(db_error)?;
    let review_count=c.query_row("SELECT COUNT(*) FROM multiplication_review_queue WHERE profile_id=1 AND mode=?1 AND (?2=0 OR left_factor=?2)",params![mode.as_str(),if mode==Mode::Tables{s.table.unwrap_or(0)}else{0}],|r|r.get(0)).map_err(db_error)?;
    let last_robot=c.query_row("SELECT completed_design,completed_palette FROM multiplication_worlds WHERE profile_id=1 AND world='workshop' AND completed_design IS NOT NULL",[],|r|Ok(RobotAppearance{design:decode(r.get(0)?)?,palette:decode(r.get(1)?)?})).optional().map_err(db_error)?;
    Ok(Adventure {
        revision: s.revision,
        world: s.world,
        design: s.design,
        palette: s.palette,
        table: s.table,
        review: s.review,
        review_count,
        stage_size: 8,
        worlds: Worlds {
            workshop: world_progress(c, World::Workshop)?,
            island: world_progress(c, World::Island)?,
        },
        robots,
        last_robot,
    })
}
fn read_task(r: &rusqlite::Row<'_>) -> rusqlite::Result<Task> {
    Ok(Task {
        id: r.get(0)?,
        sequence: r.get(1)?,
        left: r.get(2)?,
        right: r.get(3)?,
        round: r.get(4)?,
        position: r.get(5)?,
        round_size: r.get(6)?,
        review: r.get(7)?,
    })
}
pub(super) fn stored_task(
    c: &Connection,
    mode: Mode,
    sequence: i64,
) -> Result<Option<Task>, String> {
    c.query_row("SELECT content_id,sequence,left_factor,right_factor,round_number,position,round_size,review FROM multiplication_tasks WHERE profile_id=1 AND mode=?1 AND sequence=?2",params![mode.as_str(),sequence],read_task).optional().map_err(db_error)
}
pub(super) fn assigned_task(
    c: &Connection,
    s: &Settings,
    mode: Mode,
) -> Result<Option<Task>, String> {
    if let Some(task)=c.query_row("SELECT content_id,sequence,left_factor,right_factor,round_number,position,round_size,review FROM multiplication_tasks WHERE profile_id=1 AND mode=?1 AND active=1",[mode.as_str()],read_task).optional().map_err(db_error)?{return Ok(Some(task));}
    let table = if mode == Mode::Tables {
        s.table.unwrap_or(0)
    } else {
        0
    };
    let (mut task, cursor) = if s.review {
        let factors:Option<(i64,i64)>=c.query_row("SELECT left_factor,right_factor FROM multiplication_review_queue WHERE profile_id=1 AND mode=?1 AND last_review_run<>?2 AND (?3=0 OR left_factor=?3) ORDER BY updated_order,left_factor,right_factor LIMIT 1",params![mode.as_str(),s.review_run,table],|r|Ok((r.get(0)?,r.get(1)?))).optional().map_err(db_error)?;
        let Some((left, right)) = factors else {
            return Ok(None);
        };
        (
            Task {
                id: format!("by.math.5.trainer.{}.{}x{}.v3", mode.as_str(), left, right),
                sequence: 0,
                left,
                right,
                round: s.review_run,
                position: 1,
                round_size: 1,
                review: true,
            },
            None,
        )
    } else {
        let cursor=c.query_row("SELECT cursor FROM multiplication_cursors WHERE profile_id=1 AND mode=?1 AND table_number=?2",params![mode.as_str(),table],|r|r.get::<_,i64>(0)).optional().map_err(db_error)?.unwrap_or(0);
        let task = if mode == Mode::Squares {
            square_task(c, cursor)?
        } else if table == 0 {
            legacy_task(mode, cursor)
        } else {
            let right = (cursor % 10 * 7 + 3) % 10 + 1;
            Task {
                id: format!("by.math.5.trainer.tables.{table}x{right}.v3"),
                sequence: cursor,
                left: table,
                right,
                round: cursor / 10 + 1,
                position: cursor % 10 + 1,
                round_size: 10,
                review: false,
            }
        };
        (task, Some(cursor))
    };
    let sequence:i64=c.query_row("SELECT COALESCE(MAX(sequence)+1,0) FROM (SELECT sequence FROM multiplication_tasks WHERE profile_id=1 AND mode=?1 UNION ALL SELECT sequence FROM multiplication_answers WHERE profile_id=1 AND mode=?1)",[mode.as_str()],|r|r.get(0)).map_err(db_error)?;
    task.sequence = sequence;
    task.id = format!(
        "by.math.5.trainer.{}.{}x{}.v3",
        mode.as_str(),
        task.left,
        task.right
    );
    c.execute("INSERT INTO multiplication_tasks(profile_id,mode,sequence,content_id,left_factor,right_factor,round_number,position,round_size,world,table_number,normal_cursor,review,review_run) VALUES(1,?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)",params![mode.as_str(),sequence,task.id,task.left,task.right,task.round,task.position,task.round_size,s.world.as_str(),table,cursor,s.review,s.review_run]).map_err(db_error)?;
    Ok(Some(task))
}
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Configuration {
    pub request_id: String,
    pub expected_revision: i64,
    pub mode: Mode,
    pub world: World,
    pub design: Design,
    pub palette: Palette,
    pub table: Option<i64>,
    pub review: bool,
    pub continue_stage: bool,
}
pub fn configure(c: &mut Connection, input: Configuration) -> Result<TrainerState, String> {
    if input.request_id.is_empty()
        || input.request_id.len() > 80
        || !input
            .request_id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-')
        || input.expected_revision < 0
        || input.table.is_some_and(|t| !(1..=10).contains(&t))
    {
        return Err("Diese Werkstatt-Auswahl ist ungültig.".into());
    }
    let payload = serde_json::to_string(&input).map_err(|_| "Die Auswahl ist ungültig.")?;
    let tx = c
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(db_error)?;
    if database::get_profile(&tx)?.is_none() {
        return Err("Speichere zuerst dein Lernprofil über „Dein Profil“ oben.".into());
    }
    let previous: Option<String> = tx
        .query_row(
            "SELECT payload FROM multiplication_configurations WHERE request_id=?1",
            [&input.request_id],
            |r| r.get(0),
        )
        .optional()
        .map_err(db_error)?;
    if let Some(previous) = previous {
        if previous != payload {
            return Err("Diese Auswahl-ID wurde schon verwendet. Lade den Trainer neu.".into());
        }
    } else {
        let s = settings(&tx)?;
        if s.revision != input.expected_revision {
            return Err("Dein Rechentraining hat sich geändert. Lade den aktuellen Stand.".into());
        }
        if input.continue_stage {
            if input.world != s.world || !world_progress(&tx, input.world)?.awaiting_continue {
                return Err("Diese Etappe ist noch nicht abgeschlossen.".into());
            }
            tx.execute("UPDATE multiplication_worlds SET awaiting_continue=0 WHERE profile_id=1 AND world=?1",[input.world.as_str()]).map_err(db_error)?;
        }
        let new_review_run = s.review_run + i64::from(input.review && !s.review);
        tx.execute("UPDATE multiplication_settings SET revision=revision+1,mode=?1,world=?2,design=?3,palette=?4,table_number=?5,review=?6,review_run=?7 WHERE id=1",params![input.mode.as_str(),input.world.as_str(),input.design.as_str(),input.palette.as_str(),input.table,input.review,new_review_run]).map_err(db_error)?;
        // Retiring unanswered assignments protects stale clients while preserving each normal cursor.
        tx.execute(
            "UPDATE multiplication_tasks SET active=0 WHERE profile_id=1 AND active=1",
            [],
        )
        .map_err(db_error)?;
        tx.execute(
            "INSERT INTO multiplication_configurations(request_id,payload) VALUES(?1,?2)",
            params![input.request_id, payload],
        )
        .map_err(db_error)?;
    }
    let result = state(&tx, settings(&tx)?.mode)?;
    tx.commit().map_err(db_error)?;
    Ok(result)
}
pub(super) fn record_adventure_answer(
    c: &Connection,
    mode: Mode,
    task: &Task,
    correct: bool,
) -> Result<(), String> {
    let s = settings(c)?;
    let (world,table,cursor,review_run):(String,i64,Option<i64>,i64)=c.query_row("SELECT world,table_number,normal_cursor,review_run FROM multiplication_tasks WHERE profile_id=1 AND mode=?1 AND sequence=?2 AND active=1",params![mode.as_str(),task.sequence],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?))).map_err(db_error)?;
    c.execute(
        "UPDATE multiplication_tasks SET active=0 WHERE profile_id=1 AND mode=?1 AND sequence=?2",
        params![mode.as_str(), task.sequence],
    )
    .map_err(db_error)?;
    if let Some(cursor) = cursor {
        c.execute("INSERT INTO multiplication_cursors(profile_id,mode,table_number,cursor) VALUES(1,?1,?2,?3) ON CONFLICT(profile_id,mode,table_number) DO UPDATE SET cursor=excluded.cursor",params![mode.as_str(),table,cursor+1]).map_err(db_error)?;
    }
    c.execute("INSERT INTO multiplication_worlds(profile_id,world,answered,awaiting_continue) VALUES(1,?1,1,0) ON CONFLICT(profile_id,world) DO UPDATE SET answered=answered+1,awaiting_continue=((answered+1)%8=0)",[&world]).map_err(db_error)?;
    let world = if world == "workshop" {
        World::Workshop
    } else {
        World::Island
    };
    if world == World::Workshop && world_progress(c, world)?.awaiting_continue {
        c.execute("INSERT INTO multiplication_robots(profile_id,design,palette,count) VALUES(1,?1,?2,1) ON CONFLICT(profile_id,design,palette) DO UPDATE SET count=count+1",params![s.design.as_str(),s.palette.as_str()]).map_err(db_error)?;
        c.execute("UPDATE multiplication_worlds SET completed_design=?1,completed_palette=?2 WHERE profile_id=1 AND world='workshop'",params![s.design.as_str(),s.palette.as_str()]).map_err(db_error)?;
    }
    if correct {
        c.execute("DELETE FROM multiplication_review_queue WHERE profile_id=1 AND mode=?1 AND left_factor=?2 AND right_factor=?3",params![mode.as_str(),task.left,task.right]).map_err(db_error)?;
    } else {
        c.execute("INSERT INTO multiplication_review_queue(profile_id,mode,left_factor,right_factor,last_review_run,updated_order) VALUES(1,?1,?2,?3,?4,?5) ON CONFLICT(profile_id,mode,left_factor,right_factor) DO UPDATE SET last_review_run=excluded.last_review_run,updated_order=excluded.updated_order",params![mode.as_str(),task.left,task.right,if task.review{review_run}else{-1},s.revision]).map_err(db_error)?;
    }
    c.execute(
        "UPDATE multiplication_settings SET revision=revision+1 WHERE id=1",
        [],
    )
    .map_err(db_error)?;
    Ok(())
}
