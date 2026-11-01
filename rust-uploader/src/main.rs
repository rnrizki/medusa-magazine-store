mod auth;
mod cover;
mod gdrive;
mod s3;

use auth::{is_authenticated, login_handler, logout_handler};
use axum::{
    extract::{DefaultBodyLimit, Multipart, Query, State},
    http::{header, HeaderMap, HeaderValue, StatusCode},
    response::{Html, IntoResponse, Redirect, Response},
    routing::{get, post},
    Json, Router,
};
use chrono::Utc;
use gdrive::GDriveClient;
use rand::Rng;
use s3::S3Config;
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::sync::Arc;
use std::time::Duration;
use tower_http::cors::CorsLayer;
use tracing::{error, info, warn};

#[derive(Clone)]
struct AppState {
    http_client: reqwest::Client,
    gdrive: Arc<GDriveClient>,
    s3_config: S3Config,
}

const UI_HTML: &str = include_str!("ui.html");

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info,rust_uploader=debug".into()),
        )
        .init();

    let http_client = reqwest::Client::builder()
        .timeout(Duration::from_secs(300)) // 5 minutes for large PDF uploads
        .pool_max_idle_per_host(20)
        .build()
        .expect("Failed to create HTTP client");

    let gdrive = match GDriveClient::new() {
        Ok(client) => Arc::new(client),
        Err(e) => {
            error!("CRITICAL: Failed to initialize Google Drive client: {}", e);
            panic!("Google Drive initialization error: {}", e);
        }
    };

    let s3_config = S3Config::from_env();
    info!("Initialized S3 config: endpoint={}, bucket={}", s3_config.endpoint, s3_config.bucket);

    let state = AppState {
        http_client,
        gdrive,
        s3_config,
    };

    let app = Router::new()
        .route("/", get(index_handler))
        .route("/login", get(login_page_handler))
        .route("/health", get(health_handler))
        .route("/api/login", post(login_handler))
        .route("/api/logout", post(logout_handler))
        .route("/api/status", get(status_handler))
        .route("/api/upload", post(upload_handler))
        .route("/api/auth/gdrive/login", get(gdrive_login_handler))
        .route("/api/auth/gdrive/callback", get(gdrive_callback_handler))
        .layer(DefaultBodyLimit::max(500 * 1024 * 1024)) // 500 MB max per PDF
        .layer(CorsLayer::permissive())
        .with_state(state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3002".into());
    let addr = format!("0.0.0.0:{}", port);
    info!("🚀 Rust Bulk PDF Uploader running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind port");

    axum::serve(listener, app).await.expect("Server failed");
}

async fn health_handler() -> &'static str {
    "OK"
}

async fn index_handler(headers: HeaderMap) -> Response {
    if !is_authenticated(&headers) {
        return Redirect::to("/login").into_response();
    }
    Html(UI_HTML).into_response()
}

async fn login_page_handler(headers: HeaderMap) -> Response {
    if is_authenticated(&headers) {
        return Redirect::to("/").into_response();
    }
    Html(UI_HTML).into_response()
}

#[derive(Serialize)]
struct StatusResponse {
    authenticated: bool,
    active_folder: Option<gdrive::ActiveFolderInfo>,
    user: String,
    oauth_connected: bool,
    connected_email: Option<String>,
    oauth_configured: bool,
}

#[derive(Deserialize)]
struct CallbackQuery {
    code: Option<String>,
    error: Option<String>,
}

async fn gdrive_login_handler(
    headers: HeaderMap,
    State(state): State<AppState>,
) -> Response {
    if !is_authenticated(&headers) {
        return Redirect::to("/login").into_response();
    }

    if gdrive::GDriveClient::get_google_client_secret().is_none() {
        return (
            StatusCode::BAD_REQUEST,
            Html(r#"
            <div style="font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff;">
              <h2 style="color: #d97706;">GOOGLE_CLIENT_SECRET Belum Diatur</h2>
              <p>Untuk mengaktifkan login Google Drive dengan <b>notreseller.magazine@gmail.com</b>, masukkan environment variable <code>GOOGLE_CLIENT_SECRET</code> di Dokploy.</p>
              <a href="/" style="display: inline-block; margin-top: 16px; padding: 10px 18px; background: #0f172a; color: #fff; text-decoration: none; border-radius: 8px;">&larr; Kembali ke Uploader</a>
            </div>
            "#),
        )
            .into_response();
    }

    match state.gdrive.get_oauth_auth_url() {
        Ok(url) => Redirect::to(&url).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, format!("Error: {}", e)).into_response(),
    }
}

async fn gdrive_callback_handler(
    State(state): State<AppState>,
    Query(query): Query<CallbackQuery>,
) -> Response {
    if let Some(err) = query.error {
        error!("Google OAuth error in callback: {}", err);
        return (
            StatusCode::BAD_REQUEST,
            format!("Google OAuth authorization failed: {}", err),
        )
            .into_response();
    }

    let code = match query.code {
        Some(c) => c,
        None => return (StatusCode::BAD_REQUEST, "Missing code in callback").into_response(),
    };

    match state.gdrive.handle_oauth_callback(&state.http_client, &code).await {
        Ok(tokens) => {
            info!("Google Drive OAuth completed successfully: {:?}", tokens.email);
            Redirect::to("/?gdrive_connected=true").into_response()
        }
        Err(e) => {
            error!("Failed to complete Google Drive OAuth exchange: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to connect Google Drive: {}", e),
            )
                .into_response()
        }
    }
}

async fn status_handler(
    headers: HeaderMap,
    State(state): State<AppState>,
) -> Response {
    if !is_authenticated(&headers) {
        return (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({
                "authenticated": false,
                "error": "Unauthorized"
            })),
        )
            .into_response();
    }

    let oauth_connected = state.gdrive.is_oauth_connected().await;
    let connected_email = state.gdrive.get_connected_email().await;
    let oauth_configured = gdrive::GDriveClient::get_google_client_secret().is_some();

    match state.gdrive.get_active_folder(&state.http_client).await {
        Ok(folder) => Json(StatusResponse {
            authenticated: true,
            active_folder: Some(folder),
            user: auth::get_auth_user(),
            oauth_connected,
            connected_email,
            oauth_configured,
        })
        .into_response(),
        Err(e) => {
            error!("Failed to fetch active Google Drive folder: {}", e);
            Json(StatusResponse {
                authenticated: true,
                active_folder: None,
                user: auth::get_auth_user(),
                oauth_connected,
                connected_email,
                oauth_configured,
            })
            .into_response()
        }
    }
}

fn generate_random_suffix(num_digits: usize, num_letters: usize) -> String {
    const DIGITS: &[u8] = b"0123456789";
    const LETTERS: &[u8] = b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let mut rng = rand::thread_rng();
    let mut suffix = String::with_capacity(num_digits + num_letters);

    // 3 digit angka pertama
    for _ in 0..num_digits {
        let idx = rng.gen_range(0..DIGITS.len());
        suffix.push(DIGITS[idx] as char);
    }

    // Diikuti huruf acak
    for _ in 0..num_letters {
        let idx = rng.gen_range(0..LETTERS.len());
        suffix.push(LETTERS[idx] as char);
    }

    suffix
}

fn slugify_title(title: &str) -> String {
    let mut slug = String::with_capacity(title.len());
    for c in title.chars() {
        if c.is_alphanumeric() || c == '.' || c == '-' {
            slug.push(c);
        } else {
            slug.push('-');
        }
    }
    slug
}

pub fn calculate_magazine_price(title: &str) -> u64 {
    let clean = title.replace('_', " ").to_lowercase();

    // 6. Harvard Business Review (all) -> 21000
    if clean.contains("harvard business review")
        || clean.split(|c: char| !c.is_alphanumeric()).any(|w| w == "hbr")
    {
        return 21000;
    }

    // 5. The Economist (all) -> 18000
    if clean.contains("economist") {
        return 18000;
    }

    // Find 4-digit years between 1950 and 2035 not surrounded by other digits
    let chars: Vec<char> = clean.chars().collect();
    let mut detected_year: Option<u32> = None;

    for i in 0..chars.len() {
        if i + 4 <= chars.len() {
            let slice = &chars[i..i + 4];
            if slice.iter().all(|c| c.is_ascii_digit()) {
                let prev_is_digit = i > 0 && chars[i - 1].is_ascii_digit();
                let next_is_digit = i + 4 < chars.len() && chars[i + 4].is_ascii_digit();
                if !prev_is_digit && !next_is_digit {
                    let s: String = slice.iter().collect();
                    if let Ok(y) = s.parse::<u32>() {
                        if (1950..=2035).contains(&y) {
                            detected_year = Some(y);
                            break;
                        }
                    }
                }
            }
        }
    }

    if let Some(y) = detected_year {
        if y <= 2024 {
            return 12000;
        } else if y == 2025 {
            return 13000;
        } else if y >= 2026 {
            return 15000;
        }
    }

    // 4. Majalah tanpa tahun -> 14000
    14000
}

#[derive(Serialize)]
struct UploadSuccessResponse {
    success: bool,
    title: String,
    price: u64,
    #[serde(rename = "fileSize")]
    file_size: u64,
    #[serde(rename = "coverImage")]
    cover_image: String,
    #[serde(rename = "thumbnailUrl")]
    thumbnail_url: String,
    #[serde(rename = "pdfUrl")]
    pdf_url: String,
    #[serde(rename = "folderName")]
    folder_name: String,
    folder_info: gdrive::ActiveFolderInfo,
}

async fn upload_handler(
    headers: HeaderMap,
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Response {
    if !is_authenticated(&headers) {
        return (
            StatusCode::UNAUTHORIZED,
            "Unauthorized. Silakan login terlebih dahulu.",
        )
            .into_response();
    }

    let mut original_filename = String::new();
    let mut pdf_bytes = Vec::new();
    let mut custom_price: Option<u64> = None;

    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or("").to_string();
        if name == "file" {
            if let Some(fname) = field.file_name() {
                original_filename = fname.to_string();
            }
            if let Ok(bytes) = field.bytes().await {
                pdf_bytes = bytes.to_vec();
            }
        } else if name == "price" {
            if let Ok(text) = field.text().await {
                let trimmed = text.trim();
                if !trimmed.is_empty() && trimmed != "auto" {
                    if let Ok(p) = trimmed.parse::<u64>() {
                        if p > 0 {
                            custom_price = Some(p);
                        }
                    }
                }
            }
        }
    }

    if pdf_bytes.is_empty() {
        return (StatusCode::BAD_REQUEST, "File PDF tidak ditemukan atau kosong.").into_response();
    }

    if original_filename.is_empty() {
        original_filename = "Magazine.pdf".to_string();
    }

    // 1. Calculate file size in integer MB
    let size_mb = ((pdf_bytes.len() as f64) / (1024.0 * 1024.0)).round().max(1.0) as u64;

    // 2. Clean base title
    let mut base_title = original_filename.clone();
    if base_title.to_lowercase().ends_with(".pdf") {
        base_title.truncate(base_title.len() - 4);
    }
    let base_title = base_title.trim().to_string();

    // 3. Generate unique 6-character random suffix with collision check
    let mut renamed_title = String::new();
    let mut attempts = 0;

    loop {
        attempts += 1;
        let suffix = generate_random_suffix(3, 3);
        let candidate_title = format!("{} {}", base_title, suffix);
        let candidate_pdf_name = format!("{}.pdf", candidate_title);

        match state
            .gdrive
            .check_file_exists(&state.http_client, &candidate_pdf_name)
            .await
        {
            Ok(exists) => {
                if !exists {
                    renamed_title = candidate_title;
                    break;
                } else {
                    info!("Collision detected for '{}', retrying suffix...", candidate_pdf_name);
                }
            }
            Err(e) => {
                warn!("Drive collision check warning (proceeding): {}", e);
                renamed_title = candidate_title;
                break;
            }
        }

        if attempts >= 10 {
            renamed_title = format!("{} {}", base_title, suffix);
            break;
        }
    }

    let price = custom_price.unwrap_or_else(|| calculate_magazine_price(&renamed_title));

    info!(
        "Processing magazine: title='{}', price=Rp {}, size={}MB",
        renamed_title, price, size_mb
    );

    // 4. Write PDF to temporary file for pdftoppm extraction
    let mut temp_pdf = match tempfile::Builder::new().suffix(".pdf").tempfile() {
        Ok(f) => f,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, format!("Temp file error: {}", e)).into_response(),
    };

    if let Err(e) = temp_pdf.write_all(&pdf_bytes) {
        return (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to write temp PDF: {}", e)).into_response();
    }

    // 5. Extract cover and thumbnail WebP
    let cover_res = match cover::extract_cover_and_thumbnail(temp_pdf.path()) {
        Ok(res) => res,
        Err(e) => {
            error!("Cover extraction failed: {}", e);
            return (
                StatusCode::UNPROCESSABLE_ENTITY,
                format!("Gagal mengekstrak cover dari PDF: {}", e),
            )
                .into_response();
        }
    };

    // 6. Upload cover and thumbnail to S3 (s3api2.skyconnection.id/image)
    let now = Utc::now();
    let date_path = now.format("%Y/%m/%d").to_string();
    let slug = slugify_title(&renamed_title);

    let cover_key = format!("{}/{}.webp", date_path, slug);
    let thumb_key = format!("thumbnail/{}/{}.webp", date_path, slug);

    let cover_url = match s3::upload_to_s3(
        &state.http_client,
        &state.s3_config,
        &cover_key,
        &cover_res.cover_webp,
        "image/webp",
    )
    .await
    {
        Ok(url) => url,
        Err(e) => {
            error!("Failed to upload cover to S3: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Gagal mengunggah cover ke S3: {}", e),
            )
                .into_response();
        }
    };

    let thumb_url = match s3::upload_to_s3(
        &state.http_client,
        &state.s3_config,
        &thumb_key,
        &cover_res.thumb_webp,
        "image/webp",
    )
    .await
    {
        Ok(url) => url,
        Err(e) => {
            warn!("Failed to upload thumbnail to S3, falling back to cover URL: {}", e);
            cover_url.clone()
        }
    };

    // 7. Get active Google Drive continuous folder (A23 -> A24...)
    let active_folder = match state.gdrive.get_active_folder(&state.http_client).await {
        Ok(f) => f,
        Err(e) => {
            error!("Failed to resolve active Google Drive folder: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Gagal mengakses folder Google Drive: {}", e),
            )
                .into_response();
        }
    };

    // 8. Upload PDF to active Google Drive folder
    let pdf_filename = format!("{}.pdf", renamed_title);
    let (_gdrive_file_id, gdrive_link) = match state
        .gdrive
        .upload_file(
            &state.http_client,
            &active_folder.folder_id,
            &pdf_filename,
            pdf_bytes,
            "application/pdf",
        )
        .await
    {
        Ok(res) => res,
        Err(e) => {
            error!("Failed to upload PDF to Google Drive: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Gagal mengunggah PDF ke Google Drive: {}", e),
            )
                .into_response();
        }
    };

    let updated_folder = gdrive::ActiveFolderInfo {
        folder_id: active_folder.folder_id.clone(),
        folder_name: active_folder.folder_name.clone(),
        file_count: active_folder.file_count + 1,
        max_capacity: active_folder.max_capacity,
    };

    info!(
        "Magazine successfully published! Title='{}', Folder='{}' ({}/{}), Size={}MB",
        renamed_title,
        updated_folder.folder_name,
        updated_folder.file_count,
        updated_folder.max_capacity,
        size_mb
    );

    Json(UploadSuccessResponse {
        success: true,
        title: renamed_title,
        price,
        file_size: size_mb,
        cover_image: cover_url,
        thumbnail_url: thumb_url,
        pdf_url: gdrive_link,
        folder_name: updated_folder.folder_name.clone(),
        folder_info: updated_folder,
    })
    .into_response()
}
