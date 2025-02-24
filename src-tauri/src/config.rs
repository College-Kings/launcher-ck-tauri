use std::io;
use std::path::{Path, PathBuf};
use std::{fs, sync::Mutex};

use patreon_api::types::Member;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State, Window};
use tauri_plugin_dialog::{DialogExt, FilePath};

use crate::game::Game;

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct Config {
    games: Vec<Game>,
    pub download_path: Option<PathBuf>,
    member: Option<Member>,

    #[serde(skip)]
    path: PathBuf,
}

impl Config {
    pub fn new(root: PathBuf) -> Self {
        let path = root.join("config.json");

        if let Ok(config) = fs::read_to_string(&path) {
            if let Ok(mut config) = serde_json::from_str::<Config>(&config) {
                config.path = path;
                return config;
            }
        }

        if let Err(e) = fs::create_dir_all(&root) {
            if e.kind() != io::ErrorKind::AlreadyExists {
                panic!("Failed to create config directory: {:?}", e);
            }
        }

        let college_kings = Game::new("College Kings");
        let college_kings_2 = Game::new("College Kings 2");

        Self {
            games: vec![college_kings, college_kings_2],
            path,
            ..Default::default()
        }
    }

    pub fn raw_download_path(&self) -> Option<&Path> {
        self.download_path.as_deref()
    }

    pub fn download_path(&self) -> PathBuf {
        self.download_path
            .clone()
            .unwrap_or(dirs::data_local_dir().unwrap())
    }

    pub fn game_download_path(&self, app_name: &str) -> PathBuf {
        self.download_path()
            .join("College Kings Launcher")
            .join(app_name)
    }

    pub fn game_exe_path(&self, app_name: &str) -> PathBuf {
        let exe_name = app_name.replace(' ', "") + ".exe";

        self.game_download_path(app_name).join(exe_name)
    }

    pub fn update_download_path(&mut self, path: PathBuf) {
        self.download_path = Some(path);
        self.save();
    }

    pub fn update_game(&mut self, game: Game) {
        if let Some(g) = self.games.iter_mut().find(|g| g.name == game.name) {
            *g = game;
        }
        self.save();
    }

    pub fn update_membership(&mut self, member: Member) {
        self.member = Some(member);
        self.save();
    }

    pub fn save(&self) {
        let config_str = serde_json::to_string(self).unwrap();

        fs::write(&self.path, config_str).unwrap();
    }
}

#[tauri::command]
pub fn config_raw_path(config: State<'_, Mutex<Config>>) -> Option<PathBuf> {
    let config = config.lock().unwrap();

    config.raw_download_path().map(|p| p.to_path_buf())
}

#[tauri::command]
pub fn config_download_path(config: State<'_, Mutex<Config>>) -> PathBuf {
    let config = config.lock().unwrap();

    config.download_path()
}

#[tauri::command]
pub fn update_download_path(app: AppHandle, window: Window, config: State<'_, Mutex<Config>>) {
    let default_dir = &config.lock().unwrap().download_path();

    app.dialog()
        .file()
        .set_directory(default_dir)
        .pick_folder(move |path| {
            let config = app.state::<Mutex<Config>>();
            let mut config = config.lock().unwrap();

            let path = match path {
                Some(FilePath::Path(p)) => p,
                _ => return,
            };

            config.update_download_path(path);
            window.emit("config-update", ()).unwrap();

            config.save();
        });
}

#[tauri::command]
pub fn config_game(config: State<'_, Mutex<Config>>, game_name: String) -> Game {
    let config = config.lock().unwrap();

    config
        .games
        .iter()
        .find(|game| game.name == game_name)
        .cloned()
        .unwrap()
}

#[tauri::command]
pub fn config_user(config: State<'_, Mutex<Config>>) -> Option<Member> {
    let config = config.lock().unwrap();

    config.member.clone()
}
