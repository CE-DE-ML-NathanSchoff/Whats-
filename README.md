# Comunitree

Full-stack app for **Comunitree**: a React + Vite frontend and Node.js backend with user accounts, events, communities, and Snowflake for data storage.

## Project structure

- **`server/`** — Express.js API (auth, users, communities, events, watering). Snowflake for persistence. Socket.io for realtime updates.
- **`client/`** — React 19 + Vite 7 SPA. Tailwind CSS, Framer Motion, MapLibre. Uses the backend API and JWT auth.

## Features

- **User accounts**: Register with username, password, email; login returns a JWT.
- **Profile**: Get/update user profile (display name, bio, avatar, location).
- **Communities & events**: Create and join communities; create events (trees); RSVP, rate, and “water” events.
- **Realtime**: Socket.io for live event updates (created, updated, watered).
- **Storage**: Snowflake (Node.js driver) for all persistent data.

## Prerequisites

- Node.js 18+
- A Snowflake account (database, warehouse, and a user with access)

## Setup

### 1. Install dependencies

From the repo root:

```bash
npm install
cd client && npm install && cd ..
```

### 2. Configure environment

Copy `.env.example` to `.env` and set:

- `JWT_SECRET` — long random string (e.g. `openssl rand -hex 32`)
- `SNOWFLAKE_ACCOUNT` — account identifier (e.g. `orgname-account` or `xy12345.us-east-1`)
- `SNOWFLAKE_USERNAME` — Snowflake user
- `SNOWFLAKE_PASSWORD` — Snowflake password
- **Key-pair (default, 24/7)**: `SNOWFLAKE_AUTHENTICATOR=SNOWFLAKE_JWT` and `SNOWFLAKE_PRIVATE_KEY_PATH=./snowflake_rsa_key.p8`. On first `npm run init-db` you are prompted for your MFA code once; init-db generates a key pair, registers it with Snowflake, and writes the private key to that path. After that, the app uses the key only (no MFA, no container dependency).
- **MFA only**: set `SNOWFLAKE_AUTHENTICATOR=USERNAME_PASSWORD_MFA`; leave `SNOWFLAKE_PASSCODE` unset and init-db will prompt. Not suitable for long-running servers (TOTP expires every 30s).
- **Browser login**: set `SNOWFLAKE_AUTHENTICATOR=EXTERNALBROWSER` to sign in via browser (not for headless/Docker).
- `SNOWFLAKE_WAREHOUSE` — e.g. `COMPUTE_WH`
- `SNOWFLAKE_DATABASE` — e.g. `COMUNITREE`
- `SNOWFLAKE_SCHEMA` — e.g. `PUBLIC`
- `SNOWFLAKE_ROLE` — e.g. `ACCOUNTADMIN` or a custom role

### 3. Initialize Snowflake schema

Creates the `users`, `communities`, `events`, `event_waters`, and related tables. With key-pair (default), the first run prompts for your MFA code once, then generates and registers a key and creates the schema; later runs and the app use the key file only.

```bash
npm run init-db
```

### 4. Run the app

**Option A — Backend only (serves built frontend if `client/dist` exists):**

```bash
npm start
```

Dev mode with auto-reload:

```bash
npm run dev
```

**Option B — Frontend dev server (proxies API to backend):**

Terminal 1 (backend):

```bash
npm run dev
```

Terminal 2 (frontend):

```bash
npm run dev:client
```

Open the client URL (e.g. `http://localhost:5173`). The Vite dev server proxies `/auth`, `/users`, `/communities`, `/events`, and `/socket.io` to the backend (default `http://localhost:8000`).

**Production build (single server):**

```bash
npm run build:client
npm start
```

The backend serves the built client from `client/dist` and handles all API and Socket.io on port 8000.

---

## Backend API

Base URL: `http://localhost:8000` (or your `PORT`).

### Auth

| Method | Path            | Body / Auth | Description        |
|--------|-----------------|-------------|--------------------|
| POST   | `/auth/register` | `username`, `email`, `password`, `phone_number?`, `display_name?`, `bio?` | Create account; returns `user` + `token` |
| POST   | `/auth/login`    | `username`, `password` | Login; returns `user` + `token`          |
| GET    | `/auth/me`       | Header: `Authorization: Bearer <token>` | Current user profile                     |

### Users

| Method | Path         | Auth | Description              |
|--------|--------------|------|--------------------------|
| GET    | `/users/:id`  | No   | Public profile by user id |
| PATCH  | `/users/me`   | Yes  | Update own profile (`display_name`, `bio`, `avatar_url`, `phone_number`, `location`) |
| GET    | `/users/me/friends` | Yes | Friends list |
| GET    | `/users/me/friends/requests` | Yes | Pending friend requests |
| POST   | `/users/me/friends` | Yes | Send friend request (body: `user_id`) |
| POST   | `/users/me/friends/requests/:id/accept` | Yes | Accept request |
| POST   | `/users/me/friends/requests/:id/decline` | Yes | Decline request |
| DELETE | `/users/me/friends/:userId` | Yes | Remove friend |

### Events

Events belong to a community. If `community_id` is omitted on create, the event is assigned to the creator's friend community. Public-community events cascade to parent communities on the event board; private-community events do not. Visibility: **public** events show all details; **private** events use per-field toggles in `visibility_settings`. RSVPs: only the creator sees who RSVP'd; others see count when visibility allows. Ratings are anonymous (aggregate/count only). **Watering**: one water per user per event; `waters_count` on the event.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/events` | Yes | Create event. Body: `title`, optional `community_id`, `event_date`, `event_time`, `broad_location`, `specific_location`, `description`, `link`, `is_public`, `visibility_settings`. |
| GET | `/events/:id` | Optional | Get one event; visibility applied for viewer. |
| PATCH | `/events/:id` | Yes (creator) | Update event, `link`, and/or `visibility_settings`. |
| DELETE | `/events/:id` | Yes (creator) | Soft-deactivate event. |
| GET | `/communities/:id/events` | Optional | Event board: list events (`limit`, `offset`, `from_date`, `to_date`). |
| POST | `/events/:id/rsvp` | Yes | Add current user's RSVP. |
| DELETE | `/events/:id/rsvp` | Yes | Remove RSVP. |
| GET | `/events/:id/rsvps` | Yes | Creator: list of users who RSVP'd; others: `{ count }`. |
| GET | `/events/:id/my-rsvp` | Yes | `{ rsvped: true }` or `{ rsvped: false }`. |
| POST | `/events/:id/rate` | Yes | Set rating 1–5 (upsert). Body: `rating`. |
| GET | `/events/:id/ratings` | Optional | `{ aggregate, count }` when visibility allows. |
| GET | `/events/:id/my-rating` | Yes | Current user's rating if any. |
| POST | `/events/:id/water` | Yes | Water event (one per user). |
| DELETE | `/events/:id/water` | Yes | Remove your water. |
| GET | `/events/:id/waters` | Optional | `{ count }`. |
| GET | `/events/:id/my-water` | Yes | `{ watered: true }` or `{ watered: false }`. |

Use `Authorization: Bearer <token>` for protected routes.

### Communities

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/communities` | Optional | List communities (`type`, `parent_id`, `active_only`). |
| GET | `/communities/:id` | No | Get community by id or slug. |
| GET | `/communities/:id/events` | Optional | List events for community. |
| GET | `/communities/:id/members` | No | Members (paginated). |
| POST | `/communities` | Yes | Create Sub or Private community. |
| PATCH | `/communities/:id` | Yes | Update community. |
| POST | `/communities/:id/join` | Yes | Join community. |
| POST | `/communities/:id/leave` | Yes | Leave community. |
| POST | `/communities/:id/invite` | Yes | Invite user (body: `user_id` or `email`). |
| GET | `/communities/invites` | Yes | Pending invites. |
| POST | `/communities/invites/:id/accept` | Yes | Accept invite. |
| POST | `/communities/invites/:id/decline` | Yes | Decline invite. |

## Snowflake

Data is stored in Snowflake using the official [Node.js driver](https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver). The app uses a connection pool; ensure the configured warehouse and database exist and the user has privileges to create tables and run DML.

**24/7 and long-running servers:** If your Snowflake user has MFA (TOTP), the passcode expires every 30–60 seconds, so it is not suitable for a long-running app. Use either **(1) key-pair authentication** (`SNOWFLAKE_AUTHENTICATOR=SNOWFLAKE_JWT` with `SNOWFLAKE_PRIVATE_KEY` or `SNOWFLAKE_PRIVATE_KEY_PATH`) or **(2) a dedicated Snowflake user without MFA** (e.g. a service account with password only). See [.env.example](.env.example) and [Snowflake key-pair auth](https://docs.snowflake.com/en/user-guide/key-pair-auth).

To add more user or event fields later, extend the tables in Snowflake (e.g. `ALTER TABLE users ADD COLUMN ...`) and update the corresponding services and route validation in `server/`.

## Client (React + Vite)

The frontend in `client/` is a React 19 app with Vite 7, Tailwind CSS, Framer Motion, and MapLibre. It uses the backend API for auth and data; JWT is stored in `localStorage` and sent as `Authorization: Bearer <token>`. Realtime updates use Socket.io (connect with the same token).

- **Scripts**: `npm run dev` (Vite dev server), `npm run build` (production build), `npm run preview` (preview build). From repo root: `npm run dev:client`, `npm run build:client`.
- **Proxy**: In dev, Vite proxies `/auth`, `/users`, `/communities`, `/events`, `/health`, and `/socket.io` to the backend.

## Docker

The container exposes **port 8000** (frontend + API proxy) and **port 7000** (API only). **Open http://localhost:8000 in your browser** for the app. Opening port 7000 shows the raw API (JSON), not the website.

The image builds both the client and server and serves the built frontend on port 8000.

**White screen?** Use http://localhost:8000 (not :7000). If the frontend was added after the image was built, rebuild: `docker build --no-cache -t comunitree .`

### Build locally

```bash
docker build -t comunitree .
docker run -p 8000:8000 --env-file .env comunitree
```

Pass all required env vars at runtime (see [.env.example](.env.example)) via `-e`, `--env-file`, or your orchestrator’s config.

### Pull from GitHub Container Registry

Replace `<owner>` and `<repo>` with your GitHub org/repo:

```bash
docker pull ghcr.io/<owner>/<repo>:latest
docker run -p 8000:8000 -e JWT_SECRET=... -e SNOWFLAKE_ACCOUNT=... ... ghcr.io/<owner>/<repo>:latest
```

For a private repo, run `docker login ghcr.io` with a GitHub PAT before pulling.

**Note:** DB init and migrations are not run inside the container. Run `npm run init-db` (and any migrate/seed scripts) once from a host or one-off container that can reach the same Snowflake instance.

## Deploying

Deploy the app on an Ubuntu VM (or similar) behind a reverse proxy. CI builds and pushes the Docker image on every push to `main`.

### Prerequisites

- Docker (and optionally Docker Compose) installed on the VM.
- A reverse proxy (Nginx, Caddy, Traefik, etc.) forwarding HTTP/HTTPS to port 8000 on the container.
- Outbound access from the VM to your Snowflake account.

### One-time: initialize Snowflake schema

Run the DB init once before the first launch. Either from a one-off container:

```bash
docker run --rm --env-file .env ghcr.io/ce-de-ml-nathanschoff/whats:main node server/db/init.js
```

Or on a host with Node.js and the repo cloned:

```bash
npm run init-db
```

Migrations (`migrate-private-friends`, `migrate-profile-config`, `seed-locations`) are also one-off and can be run the same way.

### Run the app

1. Copy `.env.example` to `.env` on the VM and fill in `JWT_SECRET`, Snowflake credentials, and set `NODE_ENV=production`.

2. Pull the latest image:

```bash
docker pull ghcr.io/ce-de-ml-nathanschoff/whats:main
```

For a private repo, authenticate first: `docker login ghcr.io -u <github-user> --password <PAT>`.

3. Start the container:

**With Docker Compose** (recommended — uses the included `docker-compose.yml`):

```bash
docker compose up -d
```

**Or with `docker run`:**

```bash
docker run -d --name comunitree -p 8000:8000 --env-file .env --restart unless-stopped ghcr.io/ce-de-ml-nathanschoff/whats:main
```

The container includes a `HEALTHCHECK`; verify with `docker ps` (look for `(healthy)`).

### Reverse proxy

Point the proxy at `localhost:8000` (or the VM's IP and port 8000). The container serves both the API and the frontend SPA.

If the app is served at a subpath (e.g. `https://example.com/communitree/`), set `BASE_PATH=/communitree` in `.env` (the image defaults to this). The proxy must forward the full path (e.g. `/communitree` and `/communitree/assets/...`) to the container so asset requests don’t 404.

TLS termination is handled by the proxy; the container stays HTTP on port 8000.

### Updating

After pushing to `main` and CI completes:

```bash
docker pull ghcr.io/ce-de-ml-nathanschoff/whats:main
docker compose up -d      # recreates with the new image
```

Or with plain Docker:

```bash
docker pull ghcr.io/ce-de-ml-nathanschoff/whats:main
docker stop comunitree && docker rm comunitree
docker run -d --name comunitree -p 8000:8000 --env-file .env --restart unless-stopped ghcr.io/ce-de-ml-nathanschoff/whats:main
```
