use jsonwebtoken::{Algorithm, EncodingKey, Header};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tokio::sync::RwLock;
use tracing::{error, info, warn};

#[derive(Clone, Deserialize)]
pub struct ServiceAccountKey {
    pub client_email: String,
    pub private_key: String,
    pub token_uri: Option<String>,
}

#[derive(Serialize)]
struct JwtClaims<'a> {
    iss: &'a str,
    scope: &'a str,
    aud: &'a str,
    exp: u64,
    iat: u64,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
    expires_in: u64,
}

#[derive(Clone)]
struct CachedToken {
    token: String,
    expires_at: Instant,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct OAuthTokens {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: u64,
    pub email: Option<String>,
}

#[derive(Clone)]
pub struct GDriveClient {
    service_account: Option<ServiceAccountKey>,
    token_cache: Arc<RwLock<Option<CachedToken>>>,
    oauth_tokens: Arc<RwLock<Option<OAuthTokens>>>,
    oauth_file_path: PathBuf,
    root_folder_name: String,
    cached_root_id: Arc<RwLock<Option<String>>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ActiveFolderInfo {
    pub folder_id: String,
    pub folder_name: String,
    pub file_count: usize,
    pub max_capacity: usize,
}

impl GDriveClient {
    pub fn new() -> Result<Self, String> {
        let root_folder_name = env::var("GDRIVE_ROOT_FOLDER_NAME")
            .unwrap_or_else(|_| "PDF ALL".to_string());

        let service_account = if let Ok(json_str) = env::var("GDRIVE_CREDENTIALS_JSON") {
            serde_json::from_str(&json_str).ok()
        } else {
            let key_path = env::var("GDRIVE_CREDENTIALS_FILE")
                .unwrap_or_else(|_| "service-account.json".to_string());
            if Path::new(&key_path).exists() {
                fs::read_to_string(&key_path)
                    .ok()
                    .and_then(|c| serde_json::from_str(&c).ok())
            } else {
                None
            }
        };

        let oauth_file_path = PathBuf::from(
            env::var("GDRIVE_OAUTH_FILE").unwrap_or_else(|_| "data/gdrive_oauth.json".to_string()),
        );

        // Load existing OAuth tokens from file if available
        let mut initial_oauth = None;
        if oauth_file_path.exists() {
            if let Ok(content) = fs::read_to_string(&oauth_file_path) {
                if let Ok(tokens) = serde_json::from_str::<OAuthTokens>(&content) {
                    info!("Loaded Google Drive OAuth tokens for: {:?}", tokens.email);
                    initial_oauth = Some(tokens);
                }
            }
        }

        Ok(Self {
            service_account,
            token_cache: Arc::new(RwLock::new(None)),
            oauth_tokens: Arc::new(RwLock::new(initial_oauth)),
            oauth_file_path,
            root_folder_name,
            cached_root_id: Arc::new(RwLock::new(None)),
        })
    }

    pub fn get_google_client_id() -> String {
        env::var("GOOGLE_CLIENT_ID").unwrap_or_else(|_| {
            "573754266292-b02va05mmls6idmu8om3gflvvio6f7t1.apps.googleusercontent.com".to_string()
        })
    }

    pub fn get_google_client_secret() -> Option<String> {
        env::var("GOOGLE_CLIENT_SECRET").ok().filter(|s| !s.trim().is_empty())
    }

    pub fn get_google_redirect_uri() -> String {
        env::var("GOOGLE_REDIRECT_URI").unwrap_or_else(|_| {
            "https://rustupload.majalahpdf.my.id/api/auth/gdrive/callback".to_string()
        })
    }

    pub async fn is_oauth_connected(&self) -> bool {
        self.oauth_tokens.read().await.is_some()
    }

    pub async fn get_connected_email(&self) -> Option<String> {
        self.oauth_tokens
            .read()
            .await
            .as_ref()
            .and_then(|t| t.email.clone())
    }

    pub fn get_oauth_auth_url(&self) -> Result<String, String> {
        let client_id = Self::get_google_client_id();
        let redirect_uri = Self::get_google_redirect_uri();

        let encoded_redirect = urlencoding_encode(&redirect_uri);
        let scope = urlencoding_encode("https://www.googleapis.com/auth/drive");

        let auth_url = format!(
            "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope={}&access_type=offline&prompt=consent",
            client_id, encoded_redirect, scope
        );

        Ok(auth_url)
    }

    pub async fn handle_oauth_callback(
        &self,
        http: &reqwest::Client,
        code: &str,
    ) -> Result<OAuthTokens, String> {
        let client_id = Self::get_google_client_id();
        let client_secret = Self::get_google_client_secret().ok_or_else(|| {
            "GOOGLE_CLIENT_SECRET belum dikonfigurasi di server environment.".to_string()
        })?;
        let redirect_uri = Self::get_google_redirect_uri();

        let res = http
            .post("https://oauth2.googleapis.com/token")
            .form(&[
                ("code", code),
                ("client_id", &client_id),
                ("client_secret", &client_secret),
                ("redirect_uri", &redirect_uri),
                ("grant_type", "authorization_code"),
            ])
            .send()
            .await
            .map_err(|e| format!("OAuth token exchange failed: {}", e))?;

        if !res.status().is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Gagal menukarkan OAuth code: {}", err_text));
        }

        #[derive(Deserialize)]
        struct RawTokenResp {
            access_token: String,
            refresh_token: Option<String>,
            expires_in: u64,
        }

        let raw: RawTokenResp = res
            .json()
            .await
            .map_err(|e| format!("Gagal decode token response: {}", e))?;

        let refresh_token = match raw.refresh_token {
            Some(rt) => rt,
            None => {
                let guard = self.oauth_tokens.read().await;
                guard
                    .as_ref()
                    .map(|t| t.refresh_token.clone())
                    .ok_or_else(|| "Google did not return a refresh_token. Pastikan access_type=offline & prompt=consent.".to_string())?
            }
        };

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let expires_at = now + raw.expires_in.saturating_sub(60);

        let mut user_email = None;
        if let Ok(about_res) = http
            .get("https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)")
            .bearer_auth(&raw.access_token)
            .send()
            .await
        {
            if let Ok(about_json) = about_res.json::<serde_json::Value>().await {
                if let Some(em) = about_json["user"]["emailAddress"].as_str() {
                    user_email = Some(em.to_string());
                }
            }
        }

        let tokens = OAuthTokens {
            access_token: raw.access_token,
            refresh_token,
            expires_at,
            email: user_email,
        };

        {
            let mut guard = self.oauth_tokens.write().await;
            *guard = Some(tokens.clone());
        }

        if let Some(parent) = self.oauth_file_path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        if let Ok(json_str) = serde_json::to_string_pretty(&tokens) {
            let _ = fs::write(&self.oauth_file_path, json_str);
        }

        info!("Google Drive OAuth successfully connected for: {:?}", tokens.email);
        Ok(tokens)
    }

    pub async fn refresh_oauth_token(
        &self,
        http: &reqwest::Client,
        refresh_token: &str,
    ) -> Result<String, String> {
        let client_id = Self::get_google_client_id();
        let client_secret = Self::get_google_client_secret().ok_or_else(|| {
            "GOOGLE_CLIENT_SECRET belum dikonfigurasi di server environment.".to_string()
        })?;

        let res = http
            .post("https://oauth2.googleapis.com/token")
            .form(&[
                ("client_id", client_id.as_str()),
                ("client_secret", client_secret.as_str()),
                ("refresh_token", refresh_token),
                ("grant_type", "refresh_token"),
            ])
            .send()
            .await
            .map_err(|e| format!("OAuth token refresh network error: {}", e))?;

        if !res.status().is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Gagal me-refresh OAuth token: {}", err_text));
        }

        #[derive(Deserialize)]
        struct RefreshResp {
            access_token: String,
            expires_in: u64,
        }

        let raw: RefreshResp = res
            .json()
            .await
            .map_err(|e| format!("Failed to decode refresh response: {}", e))?;

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let expires_at = now + raw.expires_in.saturating_sub(60);

        {
            let mut guard = self.oauth_tokens.write().await;
            if let Some(existing) = guard.as_mut() {
                existing.access_token = raw.access_token.clone();
                existing.expires_at = expires_at;

                if let Ok(json_str) = serde_json::to_string_pretty(&existing) {
                    let _ = fs::write(&self.oauth_file_path, json_str);
                }
            }
        }

        Ok(raw.access_token)
    }

    pub async fn get_access_token(&self, http: &reqwest::Client) -> Result<String, String> {
        let oauth_opt = { self.oauth_tokens.read().await.clone() };
        if let Some(tokens) = oauth_opt {
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();

            if now < tokens.expires_at {
                return Ok(tokens.access_token);
            }

            match self.refresh_oauth_token(http, &tokens.refresh_token).await {
                Ok(new_token) => return Ok(new_token),
                Err(e) => {
                    warn!("Failed to refresh user OAuth token: {}", e);
                }
            }
        }

        let sa = self.service_account.as_ref().ok_or_else(|| {
            "Google Drive belum terhubung. Silakan klik 'Hubungkan Google Drive' terlebih dahulu.".to_string()
        })?;

        {
            let cache = self.token_cache.read().await;
            if let Some(cached) = &*cache {
                if Instant::now() < cached.expires_at {
                    return Ok(cached.token.clone());
                }
            }
        }

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let token_uri = sa
            .token_uri
            .as_deref()
            .unwrap_or("https://oauth2.googleapis.com/token");

        let claims = JwtClaims {
            iss: &sa.client_email,
            scope: "https://www.googleapis.com/auth/drive",
            aud: token_uri,
            exp: now + 3600,
            iat: now,
        };

        let encoding_key = EncodingKey::from_rsa_pem(sa.private_key.as_bytes())
            .map_err(|e| format!("Invalid RSA private key: {}", e))?;

        let jwt = jsonwebtoken::encode(&Header::new(Algorithm::RS256), &claims, &encoding_key)
            .map_err(|e| format!("Failed to sign JWT: {}", e))?;

        let res = http
            .post(token_uri)
            .form(&[
                ("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer"),
                ("assertion", &jwt),
            ])
            .send()
            .await
            .map_err(|e| format!("Token request failed: {}", e))?;

        if !res.status().is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Google OAuth token error: {}", err_text));
        }

        let token_resp: TokenResponse = res
            .json()
            .await
            .map_err(|e| format!("Failed to decode token response: {}", e))?;

        let expires_at = Instant::now() + Duration::from_secs(token_resp.expires_in.saturating_sub(60));
        let token = token_resp.access_token.clone();

        {
            let mut cache = self.token_cache.write().await;
            *cache = Some(CachedToken {
                token: token.clone(),
                expires_at,
            });
        }

        Ok(token)
    }

    pub async fn get_root_folder_id(&self, http: &reqwest::Client) -> Result<String, String> {
        {
            let cached = self.cached_root_id.read().await;
            if let Some(id) = &*cached {
                return Ok(id.clone());
            }
        }

        let token = self.get_access_token(http).await?;
        let q = format!(
            "mimeType = 'application/vnd.google-apps.folder' and name = '{}' and trashed = false",
            self.root_folder_name.replace("'", "\\'")
        );

        let res = http
            .get("https://www.googleapis.com/drive/v3/files")
            .bearer_auth(&token)
            .query(&[
                ("q", q.as_str()),
                ("fields", "files(id, name)"),
                ("supportsAllDrives", "true"),
                ("includeItemsFromAllDrives", "true"),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to search root folder: {}", e))?;

        let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
        if let Some(files) = json["files"].as_array() {
            if let Some(first) = files.first() {
                if let Some(id) = first["id"].as_str() {
                    let mut cached = self.cached_root_id.write().await;
                    *cached = Some(id.to_string());
                    return Ok(id.to_string());
                }
            }
        }

        let fallback = "1Vit-xSCTxroubMZ2ojr8NYJgmylx7uLH".to_string();
        let mut cached = self.cached_root_id.write().await;
        *cached = Some(fallback.clone());
        Ok(fallback)
    }

    pub async fn create_folder(
        &self,
        http: &reqwest::Client,
        parent_id: &str,
        name: &str,
    ) -> Result<String, String> {
        let token = self.get_access_token(http).await?;

        let body = serde_json::json!({
            "name": name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [parent_id]
        });

        let res = http
            .post("https://www.googleapis.com/drive/v3/files?supportsAllDrives=true")
            .bearer_auth(&token)
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Failed to create folder {}: {}", name, e))?;

        if !res.status().is_success() {
            return Err(format!(
                "Failed to create folder {}: {}",
                name,
                res.text().await.unwrap_or_default()
            ));
        }

        let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
        let id = json["id"]
            .as_str()
            .ok_or_else(|| "No id in folder creation response".to_string())?;

        info!("Created new Google Drive folder '{}' with id {}", name, id);
        Ok(id.to_string())
    }

    pub async fn get_active_folder(
        &self,
        http: &reqwest::Client,
    ) -> Result<ActiveFolderInfo, String> {
        let root_id = self.get_root_folder_id(http).await?;
        let token = self.get_access_token(http).await?;

        let q = format!(
            "'{}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            root_id
        );

        let res = http
            .get("https://www.googleapis.com/drive/v3/files")
            .bearer_auth(&token)
            .query(&[
                ("q", q.as_str()),
                ("fields", "files(id, name)"),
                ("pageSize", "100"),
                ("supportsAllDrives", "true"),
                ("includeItemsFromAllDrives", "true"),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to list subfolders: {}", e))?;

        let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
        let empty_vec = vec![];
        let files = json["files"].as_array().unwrap_or(&empty_vec);

        let re = Regex::new(r"^A(\d+)$").unwrap();
        let mut matching_folders: Vec<(u32, String, String)> = Vec::new();

        for f in files {
            if let (Some(id), Some(name)) = (f["id"].as_str(), f["name"].as_str()) {
                if let Some(caps) = re.captures(name) {
                    if let Ok(num) = caps[1].parse::<u32>() {
                        matching_folders.push((num, id.to_string(), name.to_string()));
                    }
                }
            }
        }

        matching_folders.sort_by_key(|item| item.0);

        let (current_num, folder_id, folder_name) = match matching_folders.iter().rfind(|(num, _, _)| *num >= 23) {
            Some((num, id, name)) => (*num, id.clone(), name.clone()),
            None => {
                if let Some((_, id, name)) = matching_folders.iter().find(|(_, _, n)| n == "A23") {
                    (23, id.clone(), name.clone())
                } else {
                    let id = self.create_folder(http, &root_id, "A23").await?;
                    (23, id, "A23".to_string())
                }
            }
        };

        let count_q = format!("'{}' in parents and trashed = false", folder_id);
        let count_res = http
            .get("https://www.googleapis.com/drive/v3/files")
            .bearer_auth(&token)
            .query(&[
                ("q", count_q.as_str()),
                ("fields", "files(id)"),
                ("pageSize", "150"),
                ("supportsAllDrives", "true"),
                ("includeItemsFromAllDrives", "true"),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to count files in folder {}: {}", folder_name, e))?;

        let count_json: serde_json::Value = count_res.json().await.map_err(|e| e.to_string())?;
        let current_count = count_json["files"].as_array().map(|a| a.len()).unwrap_or(0);

        if current_count >= 100 {
            let next_num = current_num + 1;
            let next_name = format!("A{}", next_num);
            info!(
                "Folder '{}' has reached {} files (>= 100). Auto-creating next folder '{}'...",
                folder_name, current_count, next_name
            );

            let next_id = match matching_folders.iter().find(|(_, _, n)| n == &next_name) {
                Some((_, id, _)) => id.clone(),
                None => self.create_folder(http, &root_id, &next_name).await?,
            };

            return Ok(ActiveFolderInfo {
                folder_id: next_id,
                folder_name: next_name,
                file_count: 0,
                max_capacity: 100,
            });
        }

        Ok(ActiveFolderInfo {
            folder_id,
            folder_name,
            file_count: current_count,
            max_capacity: 100,
        })
    }

    pub async fn check_file_exists(
        &self,
        http: &reqwest::Client,
        filename: &str,
    ) -> Result<bool, String> {
        let token = self.get_access_token(http).await?;
        let escaped = filename.replace("'", "\\'");
        let q = format!("name = '{}' and trashed = false", escaped);

        let res = http
            .get("https://www.googleapis.com/drive/v3/files")
            .bearer_auth(&token)
            .query(&[
                ("q", q.as_str()),
                ("fields", "files(id, name)"),
                ("pageSize", "1"),
                ("supportsAllDrives", "true"),
                ("includeItemsFromAllDrives", "true"),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to check file existence: {}", e))?;

        let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
        if let Some(files) = json["files"].as_array() {
            Ok(!files.is_empty())
        } else {
            Ok(false)
        }
    }

    pub async fn upload_file(
        &self,
        http: &reqwest::Client,
        parent_id: &str,
        filename: &str,
        data: Vec<u8>,
        mime_type: &str,
    ) -> Result<(String, String), String> {
        let token = self.get_access_token(http).await?;

        let metadata = serde_json::json!({
            "name": filename,
            "parents": [parent_id]
        });

        let boundary = format!("-------boundary_{}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(12345));
        let mut body = Vec::new();

        body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
        body.extend_from_slice(b"Content-Type: application/json; charset=UTF-8\r\n\r\n");
        body.extend_from_slice(metadata.to_string().as_bytes());
        body.extend_from_slice(b"\r\n");

        body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
        body.extend_from_slice(format!("Content-Type: {}\r\n\r\n", mime_type).as_bytes());
        body.extend_from_slice(&data);
        body.extend_from_slice(b"\r\n");

        body.extend_from_slice(format!("--{}--\r\n", boundary).as_bytes());

        let res = http
            .post("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true")
            .bearer_auth(&token)
            .header("Content-Type", format!("multipart/related; boundary={}", boundary))
            .body(body)
            .send()
            .await
            .map_err(|e| format!("Failed to upload file to Google Drive: {}", e))?;

        if !res.status().is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Google Drive upload failed: {}", err_text));
        }

        let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
        let file_id = json["id"]
            .as_str()
            .ok_or_else(|| "No file ID returned from Google Drive".to_string())?
            .to_string();

        let perm_body = serde_json::json!({
            "role": "reader",
            "type": "anyone"
        });

        let perm_res = http
            .post(format!(
                "https://www.googleapis.com/drive/v3/files/{}/permissions?supportsAllDrives=true",
                file_id
            ))
            .bearer_auth(&token)
            .json(&perm_body)
            .send()
            .await;

        if let Err(e) = perm_res {
            warn!("Failed to set public reader permission on file {}: {}", file_id, e);
        }

        let share_link = format!("https://drive.google.com/file/d/{}/view?usp=drivesdk", file_id);
        info!("Uploaded file '{}' to Google Drive (ID: {}, Link: {})", filename, file_id, share_link);

        Ok((file_id, share_link))
    }
}

fn urlencoding_encode(s: &str) -> String {
    let mut out = String::new();
    for b in s.bytes() {
        if b.is_ascii_alphanumeric() || b == b'-' || b == b'_' || b == b'.' || b == b'~' {
            out.push(b as char);
        } else {
            out.push_str(&format!("%{:02X}", b));
        }
    }
    out
}
