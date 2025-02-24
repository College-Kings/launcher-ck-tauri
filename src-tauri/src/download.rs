use std::io::ErrorKind;
use std::path::Path;
use std::sync::Mutex;

use bunny_cdn_wrapper::bunny_file::BunnyFile;
use bunny_cdn_wrapper::BunnyStorage;
use futures::StreamExt;
use semver::Version;
use tauri::{async_runtime, AppHandle, Emitter, Manager};
use tokio::fs;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;

use crate::config::Config;
use crate::game::Game;
use crate::zip::unzip;
use crate::Result;

#[tauri::command]
pub async fn start_full_download(app: AppHandle, game_name: String) -> Result<()> {
    async_runtime::spawn(process_game_download(app, game_name));

    Ok(())
}

async fn latest_file(client: &BunnyStorage, app_name: &str, platform: &str) -> BunnyFile {
    let files = client
        .list(&format!(
            "__bcdn_perma_cache__/pullzone__collegekings__22373407/wp-content/uploads/secured/{}/",
            app_name
        ))
        .await
        .unwrap();

    let latest_file = files
        .into_iter()
        .filter(|file| file.object_name.ends_with(&format!("{}.zip", platform)))
        .max_by(|a, b| {
            let a_version = a
                .object_name
                .split('-')
                .nth(1)
                .unwrap()
                .parse::<Version>()
                .unwrap();

            let b_version = b
                .object_name
                .split('-')
                .nth(1)
                .unwrap()
                .parse::<Version>()
                .unwrap();

            a_version.cmp(&b_version)
        });

    latest_file.unwrap()
}

async fn process_game_download(app: AppHandle, game_name: String) {
    let config = app.state::<Mutex<Config>>();

    let bunny_client = app.state::<BunnyStorage>();

    let app_name = game_name.to_lowercase().replace(' ', "_");

    let file = if cfg!(target_os = "windows") || cfg!(target_os = "linux") {
        latest_file(&bunny_client, &app_name, "pc").await
    } else {
        latest_file(&bunny_client, &app_name, "mac").await
    };

    let dest_dir = config.lock().unwrap().game_download_path(&game_name);
    let dest_file = dest_dir.join(&file.object_name);

    if let Err(e) = fs::remove_dir_all(&dest_dir).await {
        if e.kind() != ErrorKind::NotFound {
            panic!("Failed to remove old game directory: {:?}", e);
        }
    }

    download(&app, &file, &dest_file).await;

    unzip(&app, &dest_file).await;

    fs::remove_file(&dest_file).await.unwrap();

    app.emit("download-progress", -1).unwrap();

    let game = Game::from_file(game_name, &file.object_name);

    config.lock().unwrap().update_game(game);
}

async fn download(app: &AppHandle, src_file: &BunnyFile, dest_file: &Path) {
    fs::create_dir_all(dest_file.parent().unwrap())
        .await
        .unwrap();

    let storage = app.state::<BunnyStorage>();

    let url = format!("https://{}{}", storage.endpoint(), src_file.full_path());

    let response = storage.raw().get(url).send().await.unwrap();

    if !response.status().is_success() {
        return;
    }

    let total_size = response.content_length().unwrap_or(0);

    let mut file = File::create(dest_file).await.unwrap();

    let mut downloaded: u64 = 0;

    let mut stream = response.bytes_stream();
    while let Some(Ok(chunk)) = stream.next().await {
        file.write_all(&chunk).await.unwrap();
        downloaded += chunk.len() as u64;

        let progress = downloaded * 100 / total_size;
        app.emit("download-progress", progress).unwrap();
    }
}
