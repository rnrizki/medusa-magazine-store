use chrono::Utc;
use hmac::{Hmac, Mac};
use reqwest::header::{HeaderMap, HeaderName, HeaderValue};
use sha2::{Digest, Sha256};
use std::env;
use tracing::{error, info};

type HmacSha256 = Hmac<Sha256>;

#[derive(Clone, Debug)]
pub struct S3Config {
    pub endpoint: String,
    pub bucket: String,
    pub region: String,
    pub access_key: String,
    pub secret_key: String,
}

impl S3Config {
    pub fn from_env() -> Self {
        Self {
            endpoint: env::var("S3_ENDPOINT")
                .unwrap_or_else(|_| "https://s3api2.skyconnection.id".to_string()),
            bucket: env::var("S3_BUCKET").unwrap_or_else(|_| "image".to_string()),
            region: env::var("S3_REGION").unwrap_or_else(|_| "ap-southeast-3".to_string()),
            access_key: env::var("S3_ACCESS_KEY")
                .unwrap_or_else(|_| "XqrFYxNFGTbdH5twUGIm".to_string()),
            secret_key: env::var("S3_SECRET_KEY")
                .unwrap_or_else(|_| "mzx149zjcUUTxhNseluIkEMe5MVoL6j0AEju7anS".to_string()),
        }
    }
}

fn sha256_hex(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hex::encode(hasher.finalize())
}

fn hmac_sha256(key: &[u8], data: &[u8]) -> Vec<u8> {
    let mut mac = HmacSha256::new_from_slice(key).expect("HMAC can take key of any size");
    mac.update(data);
    mac.finalize().into_bytes().to_vec()
}

pub async fn upload_to_s3(
    client: &reqwest::Client,
    config: &S3Config,
    key: &str,
    data: &[u8],
    content_type: &str,
) -> Result<String, String> {
    let now = Utc::now();
    let amz_date = now.format("%Y%m%dT%H%M%SZ").to_string();
    let date_stamp = now.format("%Y%m%d").to_string();

    let endpoint_url = reqwest::Url::parse(&config.endpoint)
        .map_err(|e| format!("Invalid S3 endpoint URL: {}", e))?;
    let host = endpoint_url
        .host_str()
        .ok_or_else(|| "No host in S3 endpoint URL".to_string())?;

    // Path-style: /<bucket>/<key>
    let clean_key = key.trim_start_matches('/');
    let canonical_uri = format!("/{}/{}", config.bucket, clean_key);
    let request_url = format!("{}/{}", config.endpoint.trim_end_matches('/'), canonical_uri.trim_start_matches('/'));

    let payload_hash = sha256_hex(data);

    let canonical_headers = format!(
        "content-type:{}\nhost:{}\nx-amz-content-sha256:{}\nx-amz-date:{}\n",
        content_type, host, payload_hash, amz_date
    );
    let signed_headers = "content-type;host;x-amz-content-sha256;x-amz-date";

    let canonical_request = format!(
        "PUT\n{}\n\n{}\n{}\n{}",
        canonical_uri, canonical_headers, signed_headers, payload_hash
    );

    let credential_scope = format!("{}/{}/s3/aws4_request", date_stamp, config.region);
    let string_to_sign = format!(
        "AWS4-HMAC-SHA256\n{}\n{}\n{}",
        amz_date,
        credential_scope,
        sha256_hex(canonical_request.as_bytes())
    );

    // Calculate signature key
    let k_secret = format!("AWS4{}", config.secret_key);
    let k_date = hmac_sha256(k_secret.as_bytes(), date_stamp.as_bytes());
    let k_region = hmac_sha256(&k_date, config.region.as_bytes());
    let k_service = hmac_sha256(&k_region, b"s3");
    let k_signing = hmac_sha256(&k_service, b"aws4_request");

    let signature = hex::encode(hmac_sha256(&k_signing, string_to_sign.as_bytes()));

    let auth_header = format!(
        "AWS4-HMAC-SHA256 Credential={}/{}, SignedHeaders={}, Signature={}",
        config.access_key, credential_scope, signed_headers, signature
    );

    let mut headers = HeaderMap::new();
    headers.insert(
        HeaderName::from_static("content-type"),
        HeaderValue::from_str(content_type).unwrap(),
    );
    headers.insert(
        HeaderName::from_static("host"),
        HeaderValue::from_str(host).unwrap(),
    );
    headers.insert(
        HeaderName::from_static("x-amz-date"),
        HeaderValue::from_str(&amz_date).unwrap(),
    );
    headers.insert(
        HeaderName::from_static("x-amz-content-sha256"),
        HeaderValue::from_str(&payload_hash).unwrap(),
    );
    headers.insert(
        HeaderName::from_static("authorization"),
        HeaderValue::from_str(&auth_header).unwrap(),
    );

    let res = client
        .put(&request_url)
        .headers(headers)
        .body(data.to_vec())
        .send()
        .await
        .map_err(|e| format!("Failed to send S3 request: {}", e))?;

    if !res.status().is_success() {
        let status = res.status();
        let err_body = res.text().await.unwrap_or_default();
        error!("S3 PUT failed [{}]: {}", status, err_body);
        return Err(format!("S3 PUT failed with status {}: {}", status, err_body));
    }

    let public_url = format!("{}/{}", config.endpoint.trim_end_matches('/'), canonical_uri.trim_start_matches('/'));
    info!("Successfully uploaded to S3: {}", public_url);
    Ok(public_url)
}
