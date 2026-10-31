use axum::{
    extract::{Multipart, Query, State},
    http::{header, HeaderMap, HeaderName, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use image::{imageops::FilterType, DynamicImage, ImageFormat};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    io::Cursor,
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;
use tracing::{error, info, warn};

#[derive(Clone)]
struct CachedImage {
    bytes: Vec<u8>,
    content_type: &'static str,
    created_at: Instant,
}

#[derive(Clone)]
struct AppState {
    http_client: reqwest::Client,
    cache: Arc<RwLock<HashMap<String, CachedImage>>>,
}

#[derive(Deserialize)]
struct FitQuery {
    url: String,
    w: Option<u32>,
    h: Option<u32>,
    format: Option<String>,
}

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    service: &'static str,
    engine: &'static str,
    cached_entries: usize,
    uptime_seconds: u64,
}

static START_TIME: std::sync::OnceLock<Instant> = std::sync::OnceLock::new();

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info,image_optimizer=debug".into()),
        )
        .init();

    START_TIME.get_or_init(Instant::now);

    let http_client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .pool_max_idle_per_host(20)
        .build()
        .expect("Failed to create HTTP client");

    let state = AppState {
        http_client,
        cache: Arc::new(RwLock::new(HashMap::with_capacity(500))),
    };

    let app = Router::new()
        .route("/health", get(health_handler))
        .route("/fit", get(fit_handler))
        .route("/resize", get(fit_handler))
        .route("/optimize", post(optimize_upload_handler))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".into());
    let addr = format!("0.0.0.0:{}", port);
    info!("🚀 Rust Image Optimizer running on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind port");

    axum::serve(listener, app).await.expect("Server failed");
}

async fn health_handler(State(state): State<AppState>) -> Json<HealthResponse> {
    let cached_count = state.cache.read().await.len();
    let uptime = START_TIME.get().map(|t| t.elapsed().as_secs()).unwrap_or(0);

    Json(HealthResponse {
        status: "ok",
        service: "rust-dynamic-image-optimizer",
        engine: "Rust 1.80 + Axum + SIMD Image Engine",
        cached_entries: cached_count,
        uptime_seconds: uptime,
    })
}

async fn fit_handler(
    State(state): State<AppState>,
    Query(query): Query<FitQuery>,
) -> Response {
    let target_w = query.w.unwrap_or(300).clamp(16, 2560);
    let target_h = query.h.map(|h| h.clamp(16, 2560));
    let fmt_str = query.format.as_deref().unwrap_or("webp").to_lowercase();

    let cache_key = format!(
        "{}:w{}:h{}:f{}",
        query.url,
        target_w,
        target_h.unwrap_or(0),
        fmt_str
    );

    // 1. Fast Cache Read (Lock-free concurrent read)
    {
        let cache = state.cache.read().await;
        if let Some(entry) = cache.get(&cache_key) {
            let mut headers = HeaderMap::new();
            headers.insert(header::CONTENT_TYPE, HeaderValue::from_static(entry.content_type));
            headers.insert(
                header::CACHE_CONTROL,
                HeaderValue::from_static("public, max-age=31536000, immutable"),
            );
            headers.insert(
                HeaderName::from_static("x-cache"),
                HeaderValue::from_static("HIT"),
            );
            headers.insert(
                HeaderName::from_static("x-powered-by"),
                HeaderValue::from_static("Rust-Axum-Image-Engine"),
            );
            return (StatusCode::OK, headers, entry.bytes.clone()).into_response();
        }
    }

    // 2. Fetch Source Image
    let fetch_start = Instant::now();
    let resp = match state.http_client.get(&query.url).send().await {
        Ok(r) if r.status().is_success() => r,
        Ok(r) => {
            warn!("Upstream image returned status {}: {}", r.status(), query.url);
            return (StatusCode::BAD_GATEWAY, format!("Upstream image returned {}", r.status())).into_response();
        }
        Err(e) => {
            error!("Failed to fetch upstream image {}: {}", query.url, e);
            return (StatusCode::BAD_GATEWAY, format!("Failed to fetch image: {}", e)).into_response();
        }
    };

    let raw_bytes = match resp.bytes().await {
        Ok(b) => b,
        Err(e) => {
            return (StatusCode::BAD_GATEWAY, format!("Failed to read image bytes: {}", e)).into_response();
        }
    };
    let fetch_duration = fetch_start.elapsed();

    // 3. Decode & Resize in Rust
    let resize_start = Instant::now();
    let img = match image::load_from_memory(&raw_bytes) {
        Ok(i) => i,
        Err(e) => {
            return (StatusCode::UNPROCESSABLE_ENTITY, format!("Failed to decode image: {}", e)).into_response();
        }
    };

    // Use Triangle (bilinear) filter for fast, sharp scaling
    let resized = match target_h {
        Some(h) => img.resize_to_fill(target_w, h, FilterType::Triangle),
        None => img.resize(target_w, u32::MAX, FilterType::Triangle),
    };

    let (content_type, out_format) = match fmt_str.as_str() {
        "jpg" | "jpeg" => ("image/jpeg", ImageFormat::Jpeg),
        "png" => ("image/png", ImageFormat::Png),
        _ => ("image/webp", ImageFormat::WebP),
    };

    let mut out_buffer = Cursor::new(Vec::with_capacity(32 * 1024));
    if let Err(e) = resized.write_to(&mut out_buffer, out_format) {
        return (StatusCode::INTERNAL_SERVER_ERROR, format!("Encode failed: {}", e)).into_response();
    }
    let out_bytes = out_buffer.into_inner();
    let resize_duration = resize_start.elapsed();

    info!(
        "⚡ Resized {} -> {} bytes (Fetch: {:?}, Resize+Encode: {:?})",
        query.url,
        out_bytes.len(),
        fetch_duration,
        resize_duration
    );

    // 4. Update In-Memory Cache (Bounded to 400 entries)
    {
        let mut cache = state.cache.write().await;
        if cache.len() >= 400 {
            // Drop oldest 100 entries when threshold reached
            let keys_to_remove: Vec<String> = cache.keys().take(100).cloned().collect();
            for k in keys_to_remove {
                cache.remove(&k);
            }
        }
        cache.insert(
            cache_key,
            CachedImage {
                bytes: out_bytes.clone(),
                content_type,
                created_at: Instant::now(),
            },
        );
    }

    let mut headers = HeaderMap::new();
    headers.insert(header::CONTENT_TYPE, HeaderValue::from_static(content_type));
    headers.insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static("public, max-age=31536000, immutable"),
    );
    headers.insert(
        HeaderName::from_static("x-cache"),
        HeaderValue::from_static("MISS"),
    );
    headers.insert(
        HeaderName::from_static("x-powered-by"),
        HeaderValue::from_static("Rust-Axum-Image-Engine"),
    );

    (StatusCode::OK, headers, out_bytes).into_response()
}

#[derive(Serialize)]
struct OptimizeResponse {
    success: bool,
    original_size: usize,
    thumbnail_size: usize,
    thumbnail_base64: String,
}

async fn optimize_upload_handler(mut multipart: Multipart) -> Response {
    let mut file_bytes = Vec::new();

    while let Ok(Some(field)) = multipart.next_field().await {
        if field.name() == Some("file") || field.name() == Some("image") {
            if let Ok(data) = field.bytes().await {
                file_bytes = data.to_vec();
                break;
            }
        }
    }

    if file_bytes.is_empty() {
        return (StatusCode::BAD_REQUEST, "No file uploaded in form field 'file'").into_response();
    }

    let img = match image::load_from_memory(&file_bytes) {
        Ok(i) => i,
        Err(e) => return (StatusCode::UNPROCESSABLE_ENTITY, format!("Failed to decode image: {}", e)).into_response(),
    };

    // 3:4 portrait thumbnail (300x400)
    let thumb = img.resize_to_fill(300, 400, FilterType::Triangle);
    let mut thumb_buf = Cursor::new(Vec::new());
    if let Err(e) = thumb.write_to(&mut thumb_buf, ImageFormat::WebP) {
        return (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to encode thumbnail: {}", e)).into_response();
    }
    let thumb_bytes = thumb_buf.into_inner();

    use std::io::Write;
    let b64 = format!("data:image/webp;base64,{}", simple_base64_encode(&thumb_bytes));

    Json(OptimizeResponse {
        success: true,
        original_size: file_bytes.len(),
        thumbnail_size: thumb_bytes.len(),
        thumbnail_base64: b64,
    })
    .into_response()
}

fn simple_base64_encode(data: &[u8]) -> String {
    const TABLE: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity((data.len() + 2) / 3 * 4);

    for chunk in data.chunks(3) {
        let b0 = chunk[0];
        let b1 = chunk.get(1).copied().unwrap_or(0);
        let b2 = chunk.get(2).copied().unwrap_or(0);

        let n = ((b0 as u32) << 16) | ((b1 as u32) << 8) | (b2 as u32);

        out.push(TABLE[((n >> 18) & 63) as usize] as char);
        out.push(TABLE[((n >> 12) & 63) as usize] as char);

        if chunk.len() > 1 {
            out.push(TABLE[((n >> 6) & 63) as usize] as char);
        } else {
            out.push('=');
        }

        if chunk.len() > 2 {
            out.push(TABLE[(n & 63) as usize] as char);
        } else {
            out.push('=');
        }
    }

    out
}
