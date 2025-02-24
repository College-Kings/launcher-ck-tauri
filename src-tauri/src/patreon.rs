use core::panic;
use std::{
    io::{Read, Write},
    net::{SocketAddr, TcpListener, TcpStream},
    sync::Mutex,
    thread,
};

use httparse::{Request, EMPTY_HEADER};
use patreon_api::{
    oauth::PatreonOAuth,
    patreon_client::PatreonClient,
    types::{response::IdentityIncluded, IdentityInclude},
};
use tauri::{AppHandle, Emitter, State};

use crate::config::Config;
use crate::Result;

const REDIRECT_PORT: u16 = 6710;

#[tauri::command]
pub fn start_web_server(app: AppHandle) {
    let Ok(listener) = TcpListener::bind(SocketAddr::from(([127, 0, 0, 1], REDIRECT_PORT))) else {
        return;
    };

    thread::spawn(move || {
        for conn in listener.incoming() {
            match conn {
                Ok(conn) => {
                    let url = handle_connection(conn);
                    app.emit("web-callback", url).unwrap();

                    break;
                }
                Err(e) => {
                    eprintln!("Error: {}", e);
                }
            }
        }
    });
}

fn handle_connection(mut conn: TcpStream) -> String {
    println!("Handling connection...");

    let mut buffer = [0; 4048];

    match conn.read(&mut buffer) {
        Ok(t) => {
            println!("Read {} bytes", t);
        }
        Err(e) => {
            eprintln!("Error reading from connection: {}", e);
            return String::new();
        }
    };

    let mut headers = [EMPTY_HEADER; 16];
    let mut request = Request::new(&mut headers);
    request.parse(&buffer).unwrap();

    let path = request.path.unwrap_or_default().to_string();

    http_response(&mut conn);

    path
}

fn http_response(conn: &mut TcpStream) {
    let response_body = "<html>\
        <head><title>Success</title></head>\
        <body>\
            <h1>You can now close this tab</h1>\
            <p>Please return to the application.</p>\
        </body>\
    </html>";

    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n{}",
        response_body.len(),
        response_body
    );

    if let Err(e) = conn.write_all(response.as_bytes()) {
        eprintln!("Error writing response: {}", e);
    }
    if let Err(e) = conn.flush() {
        eprintln!("Error flushing response: {}", e);
    }
}

#[tauri::command]
pub async fn patreon_access_token(
    app: AppHandle,
    config: State<'_, Mutex<Config>>,
    path: String,
) -> Result<()> {
    // TODO: Remove this before committing/publishing
    const SECRET: &str = "c3-8v7l659QZx-gG3hvLccuVM3LLxvRHughv02t9Gy7kB4EEBS-_55eswGLKYD62";
    const ID: &str = "abgEn1iMz-3vWg_yjFX4bIUwmt7hNOAMgRakiIvyahYXQAGR_XsK6thmoUkRS_l7";

    let mut parts = path[2..].split(['&', '=']);
    let code = parts.nth(1).unwrap();

    let tokens = PatreonOAuth::new(ID, SECRET, "http://localhost:6710")
        .tokens(code)
        .await
        .unwrap();

    let IdentityIncluded::Member(member) = PatreonClient::new(&tokens.access_token)
        .unwrap()
        .identity(IdentityInclude::MEMBERSHIPS)
        .await
        .unwrap()
        .included
        .pop()
        .unwrap()
    else {
        panic!("No member found");
    };

    config.lock().unwrap().update_membership(member.attributes);
    app.emit("config-update", ()).unwrap();

    Ok(())
}
