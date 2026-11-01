use image::{imageops::FilterType, DynamicImage, ImageFormat};
use std::io::Cursor;
use std::path::Path;
use std::process::Command;
use tracing::{error, info, warn};

pub struct CoverResult {
    pub cover_webp: Vec<u8>,
    pub thumb_webp: Vec<u8>,
}

pub fn extract_cover_and_thumbnail(pdf_path: &Path) -> Result<CoverResult, String> {
    let temp_dir = tempfile::tempdir().map_err(|e| format!("Failed to create temp dir: {}", e))?;
    let out_prefix = temp_dir.path().join("page");

    // Run pdftoppm to extract page 1 as PNG
    let status = Command::new("pdftoppm")
        .args([
            "-png",
            "-f", "1",
            "-l", "1",
            "-r", "150",
            pdf_path.to_str().ok_or("Invalid PDF path")?,
            out_prefix.to_str().ok_or("Invalid output prefix")?,
        ])
        .output()
        .map_err(|e| format!("Failed to execute pdftoppm (ensure poppler-utils is installed): {}", e))?;

    if !status.status.success() {
        let stderr = String::from_utf8_lossy(&status.stderr);
        error!("pdftoppm failed: {}", stderr);
        return Err(format!("pdftoppm failed: {}", stderr));
    }

    // pdftoppm outputs page-1.png or page-01.png or page-001.png
    let mut extracted_file = None;
    for entry in std::fs::read_dir(temp_dir.path()).map_err(|e| e.to_string())? {
        if let Ok(entry) = entry {
            let p = entry.path();
            if let Some(ext) = p.extension() {
                if ext == "png" {
                    extracted_file = Some(p);
                    break;
                }
            }
        }
    }

    let png_path = extracted_file
        .ok_or_else(|| "pdftoppm succeeded but no PNG file was found in tempdir".to_string())?;

    let png_bytes = std::fs::read(&png_path)
        .map_err(|e| format!("Failed to read extracted PNG: {}", e))?;

    let img = image::load_from_memory(&png_bytes)
        .map_err(|e| format!("Failed to decode cover image: {}", e))?;

    // 1. Full Cover WebP
    let cover_img = if img.width() > 1400 {
        img.resize(1400, (1400.0 * img.height() as f32 / img.width() as f32) as u32, FilterType::Triangle)
    } else {
        img.clone()
    };

    let mut cover_buf = Cursor::new(Vec::new());
    cover_img
        .write_to(&mut cover_buf, ImageFormat::WebP)
        .map_err(|e| format!("Failed to encode full cover to WebP: {}", e))?;
    let cover_webp = cover_buf.into_inner();

    // 2. Thumbnail WebP (300x400 standard 3:4 portrait)
    let thumb_img = img.resize_to_fill(300, 400, FilterType::Triangle);
    let mut thumb_buf = Cursor::new(Vec::new());
    thumb_img
        .write_to(&mut thumb_buf, ImageFormat::WebP)
        .map_err(|e| format!("Failed to encode thumbnail to WebP: {}", e))?;
    let thumb_webp = thumb_buf.into_inner();

    info!(
        "Generated cover WebP ({} KB) and thumbnail WebP ({} KB)",
        cover_webp.len() / 1024,
        thumb_webp.len() / 1024
    );

    Ok(CoverResult {
        cover_webp,
        thumb_webp,
    })
}
