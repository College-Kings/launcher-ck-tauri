use std::fs;
use std::fs::File;
use std::io;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

use tauri::{AppHandle, Emitter};
use walkdir::WalkDir;
use zip::write::SimpleFileOptions;
use zip::{CompressionMethod, ZipArchive, ZipWriter};

pub async fn unzip(app: &AppHandle, path: &Path) {
    let root = path.parent().unwrap_or(Path::new(""));

    let file = File::open(path).unwrap();
    println!("Unzipping: {}", path.display());

    let mut archive = ZipArchive::new(file).unwrap();
    let archive_len = archive.len();

    for i in 0..archive_len {
        let mut file = archive.by_index(i).unwrap();
        let path = match file.enclosed_name() {
            Some(p) => p,
            None => continue,
        };

        let stripped_path = match path.components().next() {
            Some(first) => path.strip_prefix(first).unwrap(),
            None => &path,
        };

        let outpath = root.join(stripped_path);

        if file.is_dir() {
            fs::create_dir_all(&outpath).unwrap();
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p).unwrap();
                }
            }

            let mut outfile = File::create(outpath).unwrap();
            io::copy(&mut file, &mut outfile).unwrap();
        }

        let progress = i * 100 / (archive_len - 1);
        app.emit("download-progress", progress).unwrap();
    }
}

#[allow(dead_code)]
pub fn zip(folder_path: impl AsRef<Path> + Send) -> PathBuf {
    let src_dir = folder_path.as_ref();
    let dst_file = src_dir.with_file_name(format!(
        "{}.zip",
        src_dir.file_name().unwrap().to_string_lossy()
    ));

    if !src_dir.is_dir() {
        panic!("Provided folder path is not a directory")
    }

    let file = File::create(&dst_file).expect("Failed to create zip file");
    let mut zip = ZipWriter::new(file);

    let options = SimpleFileOptions::default()
        .compression_method(CompressionMethod::Stored)
        .large_file(true)
        .unix_permissions(0o777);

    let mut buffer = Vec::new();

    for entry in WalkDir::new(src_dir).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        let name = path.strip_prefix(src_dir).expect("Failed to strip prefix");

        let clean_name = name.to_string_lossy().replace("\\", "/");

        if path.is_file() {
            println!("Adding file to zip: {}", path.display());

            zip.start_file(clean_name, options)
                .expect("Failed to add file to zip");

            let mut f = File::open(path).expect("Failed to open file for zipping");
            f.read_to_end(&mut buffer)
                .expect("Failed to read file content");
            zip.write_all(&buffer)
                .expect("Failed to write file content to zip");
            buffer.clear();
        } else if path.is_dir() {
            println!("Adding directory to zip: {}", path.display());

            zip.add_directory(clean_name, options)
                .expect("Failed to add directory to zip");
        }
    }

    zip.finish().expect("Failed to finalize zip file");
    dst_file
}
