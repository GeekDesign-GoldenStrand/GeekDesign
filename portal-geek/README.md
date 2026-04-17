# Portal Geek — Local Development Setup

Web platform for Geek Design built with Next.js 16, PostgreSQL 18, and Prisma 7.

---

## Prerequisites

Install these once on your machine. You don't need to install PostgreSQL directly — Docker handles it.

| Tool               | Version   | Download                                                                                                                    |
| ------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Node.js**        | 22+ (LTS) | via [nvm](https://github.com/nvm-sh/nvm) (Mac/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows) (Windows) |
| **Docker Desktop** | Latest    | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)                                        |

### Install Node 22 via nvm

```bash
# Mac / Linux
nvm install 22
nvm use 22
nvm alias default 22   # makes v22 the default for all new terminals

# Windows (nvm-windows)
nvm install 22
nvm use 22
```

---

## First-time setup

### 1. Clone the repo and install dependencies

```bash
git clone <repo-url>
cd portal-geek
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

The default values in `.env` already match the Docker database — no changes needed for local dev.

### 3. Start the database

Open Docker Desktop first (it needs to be running), then:

```bash
# From the repo root (where docker-compose.yml lives, one level above portal-geek)
cd ..
docker compose up -d
cd portal-geek
```

> The `-d` flag runs the container in the background. PostgreSQL 18 will be available at `localhost:5432`.

### 4. Run database migrations

```bash
npm run db:migrate
# When prompted for a migration name, type: init
```

This creates all the tables in the database.

### 5. Seed test data

```bash
npm run db:seed
```

This loads roles, order statuses, a test product with pricing, and a demo client.

### 6. Start the dev server

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

---

## Daily workflow

```bash
# Start the database (if Docker isn't running)
docker compose up -d          # from repo root

# Start the dev server
npm run dev                   # from portal-geek/
```

---

## Useful commands

| Command               | What it does                                             |
| --------------------- | -------------------------------------------------------- |
| `npm run dev`         | Start Next.js dev server                                 |
| `npm run build`       | Production build                                         |
| `npm run lint`        | Run ESLint                                               |
| `npm run lint:fix`    | Auto-fix lint errors                                     |
| `npm run format`      | Format all files with Prettier                           |
| `npm run db:migrate`  | Create and apply a new migration                         |
| `npm run db:generate` | Regenerate Prisma client after schema changes            |
| `npm run db:seed`     | Seed the database with test data                         |
| `npm run db:studio`   | Open Prisma Studio (visual DB browser) at localhost:5555 |

---

## How Docker works here

You do **not** install PostgreSQL on your machine. Docker downloads an official PostgreSQL 18 image and runs it in an isolated container. Your app connects to it on `localhost:5432` just like a normal database.

```
Your app (Next.js)
      │
      │  localhost:5432
      ▼
Docker container (PostgreSQL 18)
      │
      ▼
Docker volume (data persists between restarts)
```

**Stopping the database:**

```bash
docker compose stop        # stops the container, keeps data
docker compose down        # stops and removes the container, keeps data
docker compose down -v     # stops, removes container AND wipes data (fresh start)
```

---

## Tech stack

| Layer      | Technology              |
| ---------- | ----------------------- |
| Framework  | Next.js 16 (App Router) |
| Language   | TypeScript 6            |
| Database   | PostgreSQL 18           |
| ORM        | Prisma 7                |
| Styling    | Tailwind CSS 4          |
| Linting    | ESLint 9 + Airbnb rules |
| Formatting | Prettier 3              |
