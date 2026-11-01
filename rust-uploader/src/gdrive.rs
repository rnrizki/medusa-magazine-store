use jsonwebtoken::{Algorithm, EncodingKey, Header};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::Path;
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

#[derive(Clone)]
pub struct GDriveClient {
    service_account: ServiceAccountKey,
    token_cache: Arc<RwLock<Option<CachedToken>>>,
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
            serde_json::from_str(&json_str)
                .map_err(|e| format!("Failed to parse GDRIVE_CREDENTIALS_JSON: {}", e))?
        } else {
            let key_path = env::var("GDRIVE_CREDENTIALS_FILE")
                .unwrap_or_else(|_| "service-account.json".to_string());
            if !Path::new(&key_path).exists() {
                return Err(format!("Service account file not found at: {}", key_path));
            }
            let content = fs::read_to_string(&key_path)
                .map_err(|e| format!("Failed to read service account file: {}", e))?;
            serde_json::from_str(&content)
                .map_err(|e| format!("Failed to parse service account JSON: {}", e))?
        };

        Ok(Self {
            service_account,
            token_cache: Arc::new(RwLock::new(None)),
            root_folder_name,
            cached_root_id: Arc::new(RwLock::new(None)),
        })
    }

    pub async fn get_access_token(&self, http: &reqwest::Client) -> Result<String, String> {
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

        let token_uri = self
            .service_account
            .token_uri
            .as_deref()
            .unwrap_or("https://oauth2.googleapis.com/token");

        let claims = JwtClaims {
            iss: &self.service_account.client_email,
            scope: "https://www.googleapis.com/auth/drive",
            aud: token_uri,
            exp: now + 3600,
            iat: now,
        };

        let encoding_key = EncodingKey::from_rsa_pem(self.service_account.private_key.as_bytes())
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

        // Hardcoded known fallback ID for "PDF ALL"
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

        // 1. List folders inside PDF ALL
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

        // Sort by folder number ascending
        matching_folders.sort_by_key(|item| item.0);

        // Find highest number folder >= 23, or create A23
        let (current_num, folder_id, folder_name) = match matching_folders.iter().rfind(|(num, _, _)| *num >= 23) {
            Some((num, id, name)) => (*num, id.clone(), name.clone()),
            None => {
                // Folder A23 does not exist yet. Check if A23 exists in list or create it
                if let Some((_, id, name)) = matching_folders.iter().find(|(_, _, n)| n == "A23") {
                    (23, id.clone(), name.clone())
                } else {
                    let id = self.create_folder(http, &root_id, "A23").await?;
                    (23, id, "A23".to_string())
                }
            }
        };

        // 2. Count files inside current active folder
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

        // 3. If reached 100 files, transition to next folder (e.g. A24, A25...)
        if current_count >= 100 {
            let next_num = current_num + 1;
            let next_name = format!("A{}", next_num);
            info!(
                "Folder '{}' has reached {} files (>= 100). Auto-creating next folder '{}'...",
                folder_name, current_count, next_name
            );

            // Check if next folder already created or create it
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

        // Part 1: Metadata JSON
        body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
        body.extend_from_slice(b"Content-Type: application/json; charset=UTF-8\r\n\r\n");
        body.extend_from_slice(metadata.to_string().as_bytes());
        body.extend_from_slice(b"\r\n");

        // Part 2: Media data
        body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
        body.extend_from_slice(format!("Content-Type: {}\r\n\r\n", mime_type).as_bytes());
        body.extend_from_slice(&data);
        body.extend_from_slice(b"\r\n");

        // End
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

        // Set file permission to reader for anyone with link
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
