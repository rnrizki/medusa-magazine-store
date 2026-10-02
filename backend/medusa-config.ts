import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL || "postgres://postgres:postgres@postgres:5432/medusa_db",
    redisUrl: process.env.REDIS_URL || "redis://redis:6379",
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:8000,http://localhost:3000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:7000,http://localhost:7001,http://localhost:9000",
      authCors: process.env.AUTH_CORS || "http://localhost:7000,http://localhost:7001,http://localhost:8000,http://localhost:3000,http://localhost:9000",
      jwtSecret: process.env.JWT_SECRET || "supersecret_jwt_key_medusa_ecommerce_2026",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret_cookie_key_medusa_ecommerce_2026",
    },
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    path: "/app",
  },
  modules: [
    ...(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID
      ? [
          {
            resolve: "@medusajs/medusa/file-s3",
            options: {
              bucket: process.env.S3_BUCKET,
              region: process.env.S3_REGION || "us-east-1",
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              endpoint: process.env.S3_ENDPOINT,
              url: process.env.S3_PUBLIC_URL,
            },
          },
        ]
      : []),
  ],
})
