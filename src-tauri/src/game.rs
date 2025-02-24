use std::process::Command;
use std::sync::Mutex;

use lazy_static::lazy_static;
use regex::Regex;
use semver::Version;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use crate::config::Config;
use crate::download::start_full_download;
use crate::Result;

lazy_static! {
    pub static ref VERSION_REGEX: Regex =
        Regex::new(r#"define config\.version = "([\d.]+)""#).unwrap();
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Game {
    pub name: String,
    pub version: Version,
}

impl Game {
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            version: Version::new(0, 0, 0),
        }
    }

    pub fn from_file(name: impl Into<String>, file: &str) -> Self {
        let version = file.split('-').nth(1).unwrap().parse::<Version>().unwrap();

        Self {
            name: name.into(),
            version,
        }
    }
}

#[tauri::command]
pub async fn game_is_latest_version(config: State<'_, Mutex<Config>>, game: Game) -> Result<bool> {
    let config = config.lock().unwrap();

    Ok(config.game_exe_path(&game.name).exists())
}

#[tauri::command]
pub async fn start_game_process(
    app: AppHandle,
    config: State<'_, Mutex<Config>>,
    game: Game,
) -> Result<()> {
    let exe_path = config.lock().unwrap().game_exe_path(&game.name);

    if exe_path.exists() {
        Command::new(exe_path).spawn().unwrap();
    } else {
        start_full_download(app, game.name).await?;
    }

    Ok(())
}
