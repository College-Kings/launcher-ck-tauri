use std::sync::Mutex;

use bunny_cdn_wrapper::BunnyStorage;
use patreon::{patreon_access_token, start_web_server};
use tauri::Manager;

mod config;
mod download;
mod error;
mod events;
mod game;
mod patreon;
mod zip;

use config::{
    config_download_path, config_game, config_raw_path, config_user, update_download_path, Config,
};
use download::start_full_download;
pub use error::{Error, Result};
use game::{game_is_latest_version, start_game_process};

const BUNNY_READ_ONLY_KEY: &str = "ceb70a44-9da3-43c8-acbd327c632a-c24d-4ee7";
pub const TEMP_LATEST_VERSION: u32 = 5;

// #[tauri::command]
// async fn refresh_patreon_api(app_handle: tauri::AppHandle) -> Result<Settings> {
//     let config_path = app_handle
//         .path()
//         .app_config_dir()
//         .map_err(|e| e.to_string())?
//         .join("config.json");

//     // Read current config to get access token
//     let config_str =
//         fs::read_to_string(&config_path).map_err(|e| format!("Failed to read config: {}", e))?;

//     let mut config: Settings =
//         serde_json::from_str(&config_str).map_err(|e| format!("Failed to parse config: {}", e))?;

//     // Skip API call if no user data
//     if config.full_name.is_empty() {
//         return Err("No user data available".to_string().into());
//     }

//     // Make API call
//     let client = reqwest::Client::new();
//     let response = client
//         .post("https://ck-launcher-api-as.azurewebsites.net/api/Users/RefreshPatreonStatus")
//         .header("Accept", "application/json")
//         .header("Authorization", format!("Bearer {}", config.access_token))
//         .send()
//         .await
//         .map_err(|e| format!("Failed to make API request: {}", e))?;

//     if response.status() != 200 {
//         return Err(format!("API request failed with status: {}", response.status()).into());
//     }

//     let patreon_data: PatreonResponse = response
//         .json()
//         .await
//         .map_err(|e| format!("Failed to parse API response: {}", e))?;

//     // Update config with new data
//     config.full_name = patreon_data.fullName;
//     config.email = patreon_data.email;
//     config.membership = patreon_data.userMembershipType;

//     // Save updated config
//     let config_str = serde_json::to_string_pretty(&config)
//         .map_err(|e| format!("Failed to serialize config: {}", e))?;

//     fs::write(&config_path, config_str).map_err(|e| format!("Failed to write config: {}", e))?;

//     // Check for latest versions after Patreon refresh
//     if let Ok((ck1_version, ck2_version)) = check_latest_version(app_handle.clone()).await {
//         config.free_game_version = ck1_version;
//         config.game_version = ck2_version;
//     }

//     Ok(config)
// }

// #[tauri::command]
// async fn copy_error_log(app_handle: tauri::AppHandle) -> Result<()> {
//     let config_dir = app_handle
//         .path()
//         .app_config_dir()
//         .map_err(|e| e.to_string())?;

//     let error_log_path = config_dir.join("error.log");

//     println!("Attempting to read error log from: {:?}", error_log_path);

//     if !error_log_path.exists() {
//         println!("Error log file not found at: {:?}", error_log_path);
//         return Err("Error log file not found".to_string().into());
//     }

//     // For now, just log that we would copy the content
//     println!("Would copy error log content to clipboard");
//     Ok(())
// }

// #[tauri::command]
// async fn handle_login(app_handle: tauri::AppHandle, code: String) -> Result<Settings> {
//     let client = reqwest::Client::new();

//     // Make the login request
//     let response = client
//         .post("https://ck-launcher-api-as.azurewebsites.net/api/Users/login")
//         .header("Accept", "application/json")
//         .header("Content-Type", "application/json")
//         .json(&LoginRequest { code })
//         .send()
//         .await
//         .map_err(|e| format!("Failed to make login request: {}", e))?;

//     if response.status() != 200 {
//         return Err(format!("Login failed with status: {}", response.status()).into());
//     }

//     let login_data: LoginResponse = response
//         .json()
//         .await
//         .map_err(|e| format!("Failed to parse login response: {}", e))?;

//     // Get the config path
//     let config_path = app_handle
//         .path()
//         .app_config_dir()
//         .map_err(|e| e.to_string())?
//         .join("config.json");

//     // Read existing config
//     let config_str =
//         fs::read_to_string(&config_path).map_err(|e| format!("Failed to read config: {}", e))?;

//     let mut config: Settings =
//         serde_json::from_str(&config_str).map_err(|e| format!("Failed to parse config: {}", e))?;

//     // Update config with login data
//     config.access_token = login_data.accessToken;
//     config.full_name = login_data.fullName;
//     config.expiration_date = login_data.expirationDate;
//     config.email = login_data.email;
//     config.membership = login_data.userMembershipType;

//     // Save updated config
//     let config_str = serde_json::to_string_pretty(&config)
//         .map_err(|e| format!("Failed to serialize config: {}", e))?;

//     fs::write(&config_path, config_str).map_err(|e| format!("Failed to write config: {}", e))?;

//     Ok(config)
// }

// #[tauri::command]
// async fn handle_logout(app_handle: tauri::AppHandle) -> Result<Settings> {
//     let config_path = app_handle
//         .path()
//         .app_config_dir()
//         .map_err(|e| e.to_string())?
//         .join("config.json");

//     // Read existing config
//     let config_str =
//         fs::read_to_string(&config_path).map_err(|e| format!("Failed to read config: {}", e))?;

//     let mut config: Settings =
//         serde_json::from_str(&config_str).map_err(|e| format!("Failed to parse config: {}", e))?;

//     // Reset login-related fields
//     config.access_token = String::new();
//     config.full_name = String::new();
//     config.expiration_date = String::new();
//     config.email = String::new();
//     config.membership = String::new();

//     // Save updated config
//     let config_str = serde_json::to_string_pretty(&config)
//         .map_err(|e| format!("Failed to serialize config: {}", e))?;

//     fs::write(&config_path, config_str).map_err(|e| format!("Failed to write config: {}", e))?;

//     Ok(config)
// }

// #[tauri::command]
// async fn save_user_data(
//     app_handle: tauri::AppHandle,
//     access_token: String,
//     full_name: String,
//     expiration_date: String,
//     email: String,
//     membership: String,
// ) -> Result<Settings> {
//     let config_path = app_handle
//         .path()
//         .app_config_dir()
//         .map_err(|e| e.to_string())?
//         .join("config.json");

//     // Read existing config
//     let config_str =
//         fs::read_to_string(&config_path).map_err(|e| format!("Failed to read config: {}", e))?;

//     let mut config: Settings =
//         serde_json::from_str(&config_str).map_err(|e| format!("Failed to parse config: {}", e))?;

//     // Update config with user data
//     config.access_token = access_token;
//     config.full_name = full_name;
//     config.expiration_date = expiration_date;
//     config.email = email;
//     config.membership = membership;

//     // Save updated config
//     let config_str = serde_json::to_string_pretty(&config)
//         .map_err(|e| format!("Failed to serialize config: {}", e))?;

//     fs::write(&config_path, config_str).map_err(|e| format!("Failed to write config: {}", e))?;

//     Ok(config)
// }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let bunny_client = BunnyStorage::new("collegekingsstorage", BUNNY_READ_ONLY_KEY, "de").unwrap();

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let config = Config::new(app.path().app_data_dir().unwrap());
            app.manage(Mutex::new(config));
            app.manage(bunny_client);

            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            config_raw_path,
            config_download_path,
            update_download_path,
            config_game,
            config_user,
            start_full_download,
            start_game_process,
            game_is_latest_version,
            start_web_server,
            patreon_access_token
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
