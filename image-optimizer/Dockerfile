# Multi-stage Dockerfile for Rust Image Optimizer
FROM rust:1.80-slim AS builder

WORKDIR /app

# Cache dependencies
COPY Cargo.toml ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src

# Copy source code and build final binary
COPY src ./src
RUN touch src/main.rs && cargo build --release

# Runtime image (ultra-lightweight debian-slim)
FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/image-optimizer /app/image-optimizer

ENV PORT=3001
ENV RUST_LOG=info

EXPOSE 3001

HEALTHCHECK --interval=5s --timeout=3s --retries=5 \
  CMD curl -fsS http://localhost:3001/health || exit 1

CMD ["/app/image-optimizer"]
