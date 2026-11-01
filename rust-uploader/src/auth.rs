use axum::{
    extract::Json,
    http::{header, HeaderMap, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
};
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use std::sync::OnceLock;
use std::time::{SystemTime, UNIX_EPOCH};

type HmacSha256 = Hmac<Sha256>;

static SECRET_KEY: OnceLock<String> = OnceLock::new();

fn get_secret_key() -> &'static str {
    SECRET_KEY.get_or_init(|| {
        std::env::var("AUTH_SECRET")
            .unwrap_or_else(|_| "rust_uploader_digitalpitstop_secret_token_2026".to_string())
    })
}

pub fn get_auth_user() -> String {
    std::env::var("AUTH_USER").unwrap_or_else(|_| "admin".to_string())
}

pub fn get_auth_pass() -> String {
    std::env::var("AUTH_PASS").unwrap_or_else(|_| "MajalahPdfAdmin2026!".to_string())
}

pub fn create_session_token(username: &str) -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let payload = format!("{}:{}", username, now);

    let mut mac = HmacSha256::new_from_slice(get_secret_key().as_bytes())
        .expect("HMAC can take key of any size");
    mac.update(payload.as_bytes());
    let sig = hex::encode(mac.finalize().into_bytes());

    format!("{}:{}", payload, sig)
}

pub fn verify_session_token(token: &str) -> bool {
    let parts: Vec<&str> = token.split(':').collect();
    if parts.len() != 3 {
        return false;
    }

    let username = parts[0];
    let timestamp_str = parts[1];
    let signature = parts[2];

    let timestamp: u64 = match timestamp_str.parse() {
        Ok(t) => t,
        Err(_) => return false,
    };

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    // 30 days session validity
    if now < timestamp || now - timestamp > 30 * 86400 {
        return false;
    }

    let expected_payload = format!("{}:{}", username, timestamp_str);
    let mut mac = HmacSha256::new_from_slice(get_secret_key().as_bytes())
        .expect("HMAC can take key of any size");
    mac.update(expected_payload.as_bytes());
    let expected_sig = hex::encode(mac.finalize().into_bytes());

    signature == expected_sig && username == get_auth_user()
}

pub fn is_authenticated(headers: &HeaderMap) -> bool {
    if let Some(cookie_header) = headers.get(header::COOKIE) {
        if let Ok(cookies_str) = cookie_header.to_str() {
            for cookie in cookies_str.split(';') {
                let trimmed = cookie.trim();
                if let Some(token) = trimmed.strip_prefix("rustupload_session=") {
                    if verify_session_token(token) {
                        return true;
                    }
                }
            }
        }
    }
    false
}

#[derive(Deserialize)]
pub struct LoginPayload {
    pub username: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub success: bool,
    pub message: String,
    pub username: Option<String>,
}

pub async fn login_handler(Json(payload): Json<LoginPayload>) -> Response {
    let expected_user = get_auth_user();
    let expected_pass = get_auth_pass();

    if payload.username.trim() == expected_user && payload.password == expected_pass {
        let token = create_session_token(&payload.username);
        let cookie_value = format!(
            "rustupload_session={}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000",
            token
        );

        let mut headers = HeaderMap::new();
        if let Ok(val) = HeaderValue::from_str(&cookie_value) {
            headers.insert(header::SET_COOKIE, val);
        }

        let resp_body = Json(LoginResponse {
            success: true,
            message: "Authentication successful".into(),
            username: Some(payload.username),
        });

        (StatusCode::OK, headers, resp_body).into_response()
    } else {
        (
            StatusCode::UNAUTHORIZED,
            Json(LoginResponse {
                success: false,
                message: "Invalid username or password".into(),
                username: None,
            }),
        )
            .into_response()
    }
}

pub async fn logout_handler() -> Response {
    let cookie_value = "rustupload_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0";
    let mut headers = HeaderMap::new();
    if let Ok(val) = HeaderValue::from_str(cookie_value) {
        headers.insert(header::SET_COOKIE, val);
    }

    (
        StatusCode::OK,
        headers,
        Json(serde_json::json!({
            "success": true,
            "message": "Logged out successfully"
        })),
    )
        .into_response()
}
