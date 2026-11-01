# Multi-stage Dockerfile for Rust Bulk PDF Uploader & Cover Extractor
FROM rust:1-slim AS builder

WORKDIR /app

# Cache dependencies
COPY Cargo.toml ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src

# Copy source code and build final binary
COPY src ./src
RUN touch src/main.rs && cargo build --release

# Runtime image (lightweight debian-slim with poppler-utils for pdftoppm)
FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl poppler-utils && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/rust-uploader /app/rust-uploader

ENV PORT=3002
ENV RUST_LOG=info

EXPOSE 3002

HEALTHCHECK --interval=5s --timeout=3s --retries=5 \
  CMD curl -fsS http://localhost:3002/health || exit 1

CMD ["/app/rust-uploader"]
