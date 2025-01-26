// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use open;
use serde::{Deserialize, Serialize};
use std::fs;
use tauri::Listener;
use tauri::Manager;
use std::{thread, time::Duration};
use tauri::Emitter;
use std::path::PathBuf;
use std::process::Command;
use reqwest;
use tauri_plugin_deep_link::DeepLinkExt;

#[derive(Serialize, Deserialize, Clone)]
struct Settings {
    full_name: String,
    access_token: String,
    expiration_date: String,
    game_version: u32,
    email: String,
    game_version_user: u32,
    download_path_ck1: String,
    download_path_ck2: String,
    last_selected_game: bool,
    free_game_version_user: u32,
    free_game_version: u32,
    membership: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            full_name: String::new(),
            access_token: String::new(),
            expiration_date: String::new(),
            game_version: 0,
            email: String::new(),
            game_version_user: 0,
            download_path_ck1: String::new(),
            download_path_ck2: String::new(),
            last_selected_game: false,
            free_game_version_user: 0,
            free_game_version: 0,
            membership: String::new(),
        }
    }
}

#[derive(Deserialize, Serialize)]
struct PatreonResponse {
    fullName: String,
    email: String,
    userMembershipType: String,
}

#[derive(Serialize)]
struct LoginRequest {
    code: String,
}

#[derive(Deserialize)]
struct LoginResponse {
    accessToken: String,
    fullName: String,
    expirationDate: String,
    email: String,
    userMembershipType: String,
}

#[tauri::command]
fn get_config(app_handle: tauri::AppHandle) -> Result<Settings, String> {
    let config_path = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join("config.json");

    println!("Config path: {:?}", config_path);

    // If config doesn't exist, create it with default values
    if !config_path.exists() {
        println!("Config file does not exist, creating default config...");
        let default_config = Settings::default();
        let config_str = serde_json::to_string_pretty(&default_config)
            .map_err(|e| format!("Failed to serialize config: {}", e))?;

        // Create config directory if it doesn't exist
        if let Some(parent) = config_path.parent() {
            println!("Creating config directory: {:?}", parent);
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
        }

        println!("Writing default config to file...");
        fs::write(&config_path, config_str)
            .map_err(|e| format!("Failed to write config: {}", e))?;

        println!("Default config created successfully");
        return Ok(default_config);
    }

    // Read existing config
    println!("Reading existing config file...");
    let config_str =
        fs::read_to_string(&config_path).map_err(|e| format!("Failed to read config: {}", e))?;

    serde_json::from_str(&config_str).map_err(|e| format!("Failed to parse config: {}", e))
}

#[tauri::command]
async fn open_browser(url: String) -> Result<(), String> {
    match open::that(url) {
        Ok(_) => Ok(()),
        Err(err) => Err(err.to_string()),
    }
}

#[tauri::command]
fn save_download_path_ck1(app_handle: tauri::AppHandle, path: String) -> Result<(), String> {
    let config_path = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join("config.json");

    // Read existing config
    let config_str = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;
    
    let mut config: Settings = serde_json::from_str(&config_str)
        .map_err(|e| format!("Failed to parse config: {}", e))?;
    
    // Update the path
    config.download_path_ck1 = path;
    
    // Save back to file
    let config_str = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, config_str)
        .map_err(|e| format!("Failed to write config: {}", e))?;
    
    Ok(())
}

#[tauri::command]
fn save_download_path_ck2(app_handle: tauri::AppHandle, path: String) -> Result<(), String> {
    let config_path = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join("config.json");

    // Read existing config
    let config_str = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;
    
    let mut config: Settings = serde_json::from_str(&config_str)
        .map_err(|e| format!("Failed to parse config: {}", e))?;
    
    // Update the path
    config.download_path_ck2 = path;
    
    // Save back to file
    let config_str = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, config_str)
        .map_err(|e| format!("Failed to write config: {}", e))?;
    
    Ok(())
}

#[tauri::command]
fn update_game_version(app_handle: tauri::AppHandle, is_ck1: bool) -> Result<(), String> {
    let config_path = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join("config.json");

    // Read existing config
    let config_str = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;
    
    let mut config: Settings = serde_json::from_str(&config_str)
        .map_err(|e| format!("Failed to parse config: {}", e))?;
    
    // Update the version based on game type
    if is_ck1 {
        config.free_game_version_user = config.free_game_version;
    } else {
        config.game_version_user = config.game_version;
    }
    
    // Save back to file
    let config_str = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, config_str)
        .map_err(|e| format!("Failed to write config: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn start_mock_download(app_handle: tauri::AppHandle, is_ck1: bool) -> Result<(), String> {
    let window = app_handle.get_webview_window("main").unwrap();
    let app_handle_clone = app_handle.clone();
    
    // Spawn a new thread for the mock download
    thread::spawn(move || {
        for i in 0..=100 {
            thread::sleep(Duration::from_millis(50)); // 50ms delay between updates
            
            // Emit progress event
            window
                .emit("download-progress", i)
                .expect("failed to emit event");
        }

        // Update the version in config before emitting completion
        if let Err(e) = update_game_version(app_handle_clone.clone(), is_ck1) {
            println!("Failed to update game version: {}", e);
            return;
        }

        // Get updated config after version update
        match get_config(app_handle_clone.clone()) {
            Ok(updated_config) => {
                // Emit completion event with the game type and updated config
                window
                    .emit("download-complete", (is_ck1, updated_config))
                    .expect("failed to emit completion event");
            }
            Err(e) => {
                println!("Failed to get updated config: {}", e);
            }
        }
    });

    Ok(())
}

#[tauri::command]
async fn check_latest_version(app_handle: tauri::AppHandle) -> Result<(u32, u32), String> {
    // Mock API call - in reality, this would be an HTTP request
    // For now, always return version 5 for both games
    let mock_latest_version_ck2 = 5;
    let mock_latest_version_ck1 = 5;
    
    let config_path = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join("config.json");

    // Read existing config
    let config_str = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;
    
    let mut config: Settings = serde_json::from_str(&config_str)
        .map_err(|e| format!("Failed to parse config: {}", e))?;
    
    // Update the latest versions
    config.game_version = mock_latest_version_ck2;
    config.free_game_version = mock_latest_version_ck1;
    
    // Save back to file
    let config_str = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, config_str)
        .map_err(|e| format!("Failed to write config: {}", e))?;
    
    Ok((mock_latest_version_ck1, mock_latest_version_ck2))
}

#[tauri::command]
async fn launch_game(_app_handle: tauri::AppHandle, is_ck1: bool, game_path: String) -> Result<(), String> {
    let exe_name = if is_ck1 { "CollegeKings.exe" } else { "CollegeKings2.exe" };
    let exe_path = PathBuf::from(&game_path).join(exe_name);

    if !exe_path.exists() {
        return Err(format!("Game executable not found at: {}", exe_path.display()));
    }

    match Command::new(exe_path).spawn() {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to launch game: {}", e))
    }
}

#[tauri::command]
async fn refresh_patreon_api(app_handle: tauri::AppHandle) -> Result<Settings, String> {
    let config_path = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join("config.json");

    // Read current config to get access token
    let config_str = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;
    
    let mut config: Settings = serde_json::from_str(&config_str)
        .map_err(|e| format!("Failed to parse config: {}", e))?;

    // Skip API call if no user data
    if config.full_name.is_empty() {
        return Err("No user data available".to_string());
    }

    // Make API call
    let client = reqwest::Client::new();
    let response = client
        .post("https://ck-launcher-api-as.azurewebsites.net/api/Users/RefreshPatreonStatus")
        .header("Accept", "application/json")
        .header("Authorization", format!("Bearer {}", config.access_token))
        .send()
        .await
        .map_err(|e| format!("Failed to make API request: {}", e))?;

    if response.status() != 200 {
        return Err(format!("API request failed with status: {}", response.status()));
    }

    let patreon_data: PatreonResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse API response: {}", e))?;

    // Update config with new data
    config.full_name = patreon_data.fullName;
    config.email = patreon_data.email;
    config.membership = patreon_data.userMembershipType;

    // Save updated config
    let config_str = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, config_str)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    // Check for latest versions after Patreon refresh
    if let Ok((ck1_version, ck2_version)) = check_latest_version(app_handle.clone()).await {
        config.free_game_version = ck1_version;
        config.game_version = ck2_version;
    }

    Ok(config)
}

#[tauri::command]
async fn reset_game_config(app_handle: tauri::AppHandle, is_ck1: bool) -> Result<Settings, String> {
    let config_path = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join("config.json");

    // Read existing config
    let config_str = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;
    
    let mut config: Settings = serde_json::from_str(&config_str)
        .map_err(|e| format!("Failed to parse config: {}", e))?;
    
    // Reset specific values based on game type
    if is_ck1 {
        config.free_game_version_user = 0;  // Only reset user version
        config.download_path_ck1 = String::new();
    } else {
        config.game_version_user = 0;  // Only reset user version
        config.download_path_ck2 = String::new();
    }
    
    // Save updated config
    let config_str = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, config_str)
        .map_err(|e| format!("Failed to write config: {}", e))?;
    
    Ok(config)
}

#[tauri::command]
async fn copy_error_log(app_handle: tauri::AppHandle) -> Result<(), String> {
    let config_dir = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?;
    
    let error_log_path = config_dir.join("error.log");
    
    println!("Attempting to read error log from: {:?}", error_log_path);
    
    if !error_log_path.exists() {
        println!("Error log file not found at: {:?}", error_log_path);
        return Err("Error log file not found".to_string());
    }
    
    // For now, just log that we would copy the content
    println!("Would copy error log content to clipboard");
    Ok(())
}

#[tauri::command]
async fn handle_login(app_handle: tauri::AppHandle, code: String) -> Result<Settings, String> {
    let client = reqwest::Client::new();
    
    // Make the login request
    let response = client
        .post("https://ck-launcher-api-as.azurewebsites.net/api/Users/login")
        .header("Accept", "application/json")
        .header("Content-Type", "application/json")
        .json(&LoginRequest { code })
        .send()
        .await
        .map_err(|e| format!("Failed to make login request: {}", e))?;

    if response.status() != 200 {
        return Err(format!("Login failed with status: {}", response.status()));
    }

    let login_data: LoginResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse login response: {}", e))?;

    // Get the config path
    let config_path = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join("config.json");

    // Read existing config
    let config_str = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;
    
    let mut config: Settings = serde_json::from_str(&config_str)
        .map_err(|e| format!("Failed to parse config: {}", e))?;

    // Update config with login data
    config.access_token = login_data.accessToken;
    config.full_name = login_data.fullName;
    config.expiration_date = login_data.expirationDate;
    config.email = login_data.email;
    config.membership = login_data.userMembershipType;

    // Save updated config
    let config_str = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, config_str)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(config)
}

#[tauri::command]
async fn handle_logout(app_handle: tauri::AppHandle) -> Result<Settings, String> {
    let config_path = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join("config.json");

    // Read existing config
    let config_str = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;
    
    let mut config: Settings = serde_json::from_str(&config_str)
        .map_err(|e| format!("Failed to parse config: {}", e))?;

    // Reset login-related fields
    config.access_token = String::new();
    config.full_name = String::new();
    config.expiration_date = String::new();
    config.email = String::new();
    config.membership = String::new();

    // Save updated config
    let config_str = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, config_str)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(config)
}

#[tauri::command]
async fn save_user_data(
    app_handle: tauri::AppHandle,
    access_token: String,
    full_name: String,
    expiration_date: String,
    email: String,
    membership: String,
) -> Result<Settings, String> {
    let config_path = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join("config.json");

    // Read existing config
    let config_str = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;
    
    let mut config: Settings = serde_json::from_str(&config_str)
        .map_err(|e| format!("Failed to parse config: {}", e))?;

    // Update config with user data
    config.access_token = access_token;
    config.full_name = full_name;
    config.expiration_date = expiration_date;
    config.email = email;
    config.membership = membership;

    // Save updated config
    let config_str = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, config_str)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(config)
}

fn setup_window_listeners(window: &tauri::WebviewWindow) {
    let window_clone = window.clone();
    window.listen("app-ready", move |_| {
        println!("App ready event received, showing window...");
        window_clone.show().unwrap();
        window_clone.center().unwrap();
    });
}

fn main() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            // When a second instance is launched, focus the existing window
            if let Some(window) = app.get_webview_window("main") {
                window.unminimize().unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
        }));
    }

    builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // Configure window decorations and effects
            #[cfg(target_os = "windows")]
            window.set_decorations(true).unwrap();

            setup_window_listeners(&window);

            // Register deep link schemes at runtime
            #[cfg(desktop)]
            {
                app.deep_link().register_all()?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_config,
            open_browser,
            save_download_path_ck1,
            save_download_path_ck2,
            start_mock_download,
            update_game_version,
            check_latest_version,
            launch_game,
            refresh_patreon_api,
            reset_game_config,
            copy_error_log,
            handle_login,
            handle_logout,
            save_user_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
