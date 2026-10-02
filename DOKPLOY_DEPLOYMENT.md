# 🚀 Deploying Medusa v2 Ecommerce Stack on Dokploy VPS

This guide walks you through deploying your containerized Medusa v2 stack (Backend + Admin + Next.js Storefront + PostgreSQL + Redis) to **Dokploy** on your VPS with automated Let's Encrypt SSL and Traefik routing.

---

## 📋 1. DNS Setup (Pre-requisite)

Before deploying in Dokploy, configure your domain's DNS records to point to your VPS IP address:

| Type | Name / Host | Target / Value | Purpose |
| :--- | :--- | :--- | :--- |
| **A** | `store` (or `@`) | `<YOUR_VPS_IP>` | Storefront (e.g. `store.yourdomain.com`) |
| **A** | `api` | `<YOUR_VPS_IP>` | Medusa Backend & Admin (e.g. `api.yourdomain.com`) |

> [!NOTE]
> If using Cloudflare DNS, set the Proxy status to **DNS Only (Gray Cloud)** initially so Traefik can complete Let's Encrypt HTTP-01 challenge verification seamlessly.

---

## 🛠️ 2. Deploying via Dokploy Compose (Recommended)

Dokploy has native support for Docker Compose stacks connected to its internal `dokploy-network` and Traefik ingress.

### Step 1: Push your code to GitHub / GitLab
Initialize a Git repository and push your project:
```bash
git init
git add .
git commit -m "feat: Medusa v2 ecommerce stack for Dokploy"
git remote add origin https://github.com/<your-username>/medusa-store.git
git push -u origin main
```

### Step 2: Create a Compose Service in Dokploy
1. Open your Dokploy dashboard (`http://<YOUR_VPS_IP>:3000`).
2. Navigate to **Projects** → Select or create a project (e.g. `Ecommerce`).
3. Click **Add Service** → Select **Compose**.
4. Name your service (e.g. `medusa-stack`).

### Step 3: Configure the Source
- **Provider**: Select **GitHub** / **Git**.
- **Repository**: Enter your repository URL (e.g. `https://github.com/<username>/medusa-store`).
- **Branch**: `main`.
- **Compose Path**: `docker-compose.dokploy.yml`.

### Step 4: Configure Environment Variables in Dokploy
Click on the **Environment** tab inside your Dokploy Compose service and paste the following variables (customize them with your domains and passwords):

```env
# Database Credentials
POSTGRES_USER=postgres
POSTGRES_PASSWORD=generate_a_strong_password_here_12345
POSTGRES_DB=medusa_db

# Security Secrets (generate 32+ character random strings)
JWT_SECRET=generate_random_long_secret_for_jwt_medusa_auth
COOKIE_SECRET=generate_random_long_secret_for_cookie_medusa_session

# Domains & URLs
STORE_URL=https://store.yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Medusa CORS (Critical: MUST match the exact HTTPS domains)
STORE_CORS=https://store.yourdomain.com
ADMIN_CORS=https://api.yourdomain.com
AUTH_CORS=https://store.yourdomain.com,https://api.yourdomain.com

# Storefront Settings
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.yourdomain.com
NEXT_PUBLIC_BASE_URL=https://store.yourdomain.com
NEXT_PUBLIC_DEFAULT_REGION=us
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_medusa_default_key

# Admin Setup & Seeding
MEDUSA_ADMIN_EMAIL=admin@yourdomain.com
MEDUSA_ADMIN_PASSWORD=SetAStrongAdminPassword123!
SEED_DB=true
```

### Step 5: Configure Domains & SSL in Dokploy
Go to the **Domains** tab in your Dokploy Compose service:

1. **Add Storefront Domain**:
   - **Host**: `store.yourdomain.com` (or `yourdomain.com`)
   - **Service Name**: `storefront`
   - **Container Port**: `8000`
   - **Certificate**: Enable **Let's Encrypt (HTTPS)**

2. **Add Backend / Admin Domain**:
   - **Host**: `api.yourdomain.com`
   - **Service Name**: `backend`
   - **Container Port**: `9000`
   - **Certificate**: Enable **Let's Encrypt (HTTPS)**

### Step 6: Deploy
Click the **Deploy** button. Dokploy will:
1. Clone your repo.
2. Build the optimized Next.js 14 standalone image and Medusa v2 backend image.
3. Start PostgreSQL 16 and Redis 7 on private internal networks.
4. Run Medusa schema migrations and seed initial products and regions.
5. Traefik will automatically issue SSL certificates and route traffic securely.

---

## 🎯 3. Accessing Your Live Store

- **Customer Storefront**: `https://store.yourdomain.com`
- **Medusa Admin Dashboard**: `https://api.yourdomain.com/app`
  - **Login**: `admin@yourdomain.com`
  - **Password**: `<Your MEDUSA_ADMIN_PASSWORD>`
- **API Health Check**: `https://api.yourdomain.com/health`

---

## ⚙️ 4. Useful Dokploy Operations & CLI

### Open Container Terminal
In Dokploy, click on the **Containers** or **Terminal** tab:

1. **Create an additional Admin User**:
   Select the `backend` container and run:
   ```bash
   npx medusa user -e newadmin@yourdomain.com -p SecretPassword123!
   ```

2. **Re-run Seeding**:
   ```bash
   npm run seed
   ```

3. **Check Database Migrations**:
   ```bash
   npx medusa db:migrate
   ```

---

## 🔍 5. Dokploy VPS Troubleshooting Checklist

| Issue | Root Cause & Solution |
| :--- | :--- |
| **CORS error in browser** | Check `STORE_CORS`, `ADMIN_CORS`, and `AUTH_CORS` in Dokploy. Ensure protocol is `https://` and there are no trailing slashes. |
| **Traefik 502 Bad Gateway** | Container is still booting up or health check hasn't passed yet. Give Medusa ~30-45 seconds on first boot to complete migrations. |
| **SSL certificate pending** | Ensure your DNS A-records resolve correctly to your VPS IP address before adding domains in Dokploy. |
| **Database connection refused** | In `docker-compose.dokploy.yml`, ensure `postgres` is on the same internal network and healthcheck has passed. |
