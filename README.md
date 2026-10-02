# 🛍️ Medusa v2 Full-Stack Ecommerce in Docker

A production-ready, fully containerized headless ecommerce solution featuring **Medusa v2 Core**, **Integrated Admin Dashboard**, **Next.js 14 Storefront**, **PostgreSQL 16**, and **Redis 7** orchestrated with Docker Compose.

---

## 🏗️ Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Docker Host (Your Machine)                      │
│                                                                        │
│   Browser (Host)                                                       │
│   ├── http://localhost:8000  ──────────►  [ Storefront (Next.js 14) ] │
│   │                                                     │              │
│   └── http://localhost:9000/app ───────┐               │ SSR / API    │
│                                        ▼               ▼              │
│                           [ Medusa v2 Backend (Port 9000) ]            │
│                                        │                               │
│                         ┌──────────────┴──────────────┐                │
│                         ▼                             ▼                │
│             [ PostgreSQL 16 (DB) ]           [ Redis 7 (Cache/Events) ]│
│                (Port 5432)                      (Port 6379)            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (macOS)

### 1. Make Sure Docker Desktop is Running
If Docker Desktop is not yet running on your Mac, start it by running:
```bash
open -a Docker
```
*(Wait 10–20 seconds until the Docker whale icon in your macOS menu bar indicates it is active).*

### 2. Launch the Entire Stack
From this directory (`medusa-store`), execute:
```bash
./start.sh
# or using Make:
make up
```

This will automatically:
1. Verify Docker daemon status.
2. Initialize `.env` configuration.
3. Start **PostgreSQL 16** and **Redis 7** containers.
4. Wait for database readiness, execute migrations (`medusa db:migrate`), create your admin account, and seed demo products.
5. Launch the **Next.js Storefront** on port 8000.

---

## 🌐 Endpoints & Credentials

| Service | URL | Notes / Credentials |
| :--- | :--- | :--- |
| **Storefront** | [http://localhost:8000](http://localhost:8000) | Responsive Next.js 14 customer shop |
| **Admin Dashboard** | [http://localhost:9000/app](http://localhost:9000/app) | **Email**: `admin@medusa-store.com`<br>**Password**: `supersecret` |
| **Medusa REST API** | [http://localhost:9000](http://localhost:9000) | Core headless commerce API |
| **API Health Check**| [http://localhost:9000/health](http://localhost:9000/health) | Returns system health JSON |
| **PostgreSQL** | `localhost:5432` | User: `postgres`, Password: `postgres`, DB: `medusa_db` |
| **Redis** | `localhost:6379` | In-memory cache & event pub/sub |

---

## 📁 Project Structure

```text
medusa-store/
├── docker-compose.yml          # Container orchestration for all 4 services
├── .env                        # Central environment variables
├── .env.example                # Example environment template
├── start.sh                    # One-command bootstrap and launcher
├── Makefile                    # CLI shortcuts (make up, make down, make seed)
│
├── backend/                    # Medusa v2 Backend Engine
│   ├── Dockerfile              # Node.js 20 Alpine with native build tools
│   ├── docker-entrypoint.sh    # Waits for DB, runs migrations, seeds, starts app
│   ├── medusa-config.ts        # Medusa v2 configuration & CORS settings
│   ├── package.json            # Medusa v2 dependencies
│   ├── tsconfig.json           # TypeScript configuration
│   └── src/
│       ├── api/health/route.ts # Health check endpoint
│       └── scripts/seed.ts     # Automated database seed (products, regions, keys)
│
└── storefront/                 # Customer-Facing Next.js Storefront
    ├── Dockerfile              # Next.js development/production container
    ├── package.json            # Next.js 14, Tailwind CSS, Lucide icons
    ├── next.config.mjs         # Next.js image domain configuration
    ├── tailwind.config.ts      # Tailwind CSS styling tokens
    └── src/
        ├── app/                # App Router (pages: /, /products, /cart)
        ├── components/         # Reusable UI (Navbar, Footer, ProductCard)
        └── lib/                # Medusa API client and Cart React Context
```

---

## 🛠️ Handy CLI Commands

| Command | Action |
| :--- | :--- |
| `make up` | Start all services in the background |
| `make down` | Stop all services |
| `make logs` | Stream live logs from all containers (`docker compose logs -f`) |
| `make ps` | View container health and status |
| `make seed` | Re-run database seeding |
| `make migrate` | Run pending Medusa schema migrations |
| `make user` | Interactively create an additional admin user |
| `make clean` | Stop and wipe containers + database volumes for a fresh reset |

---

## 🔧 Customization & Extension

### Creating Custom Medusa v2 Workflows & Modules
Add your business workflows under `backend/src/workflows/` and custom modules under `backend/src/modules/`. Since `./backend/src` is volume-mounted in development mode, changes update immediately.

### Customizing Storefront Styling & Branding
- **Theme colors**: Update `storefront/tailwind.config.ts`
- **Global styles**: Update `storefront/src/app/globals.css`
- **Layout & Navigation**: Modify `storefront/src/components/Navbar.tsx` and `Footer.tsx`

---

## ❓ Troubleshooting

1. **`Cannot connect to the Docker daemon`**
   - Ensure Docker Desktop is launched on macOS:
     ```bash
     open -a Docker
     ```
2. **Port already in use (5432, 6379, 8000, 9000)**
   - If you have local Postgres or Redis running natively, change `POSTGRES_PORT` or `PORT` in your `.env` file.
3. **Resetting Database to Fresh State**
   - Run `make clean` followed by `make up`.
