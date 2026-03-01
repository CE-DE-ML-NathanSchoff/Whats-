# Comunitree Backend

JavaScript backend for **Comunitree**, with user accounts and Snowflake for data storage.

## Features

- **User accounts**: Register with username, password, email, and phone number
- **Login**: Authenticate and receive a JWT
- **Profile**: Get/update user profile (display name, bio, avatar URL, phone)
- **Storage**: Snowflake (Node.js driver) for all persistent data

## Prerequisites

- Node.js 18+
- A Snowflake account (database, warehouse, and a user with access)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and set:

   - `JWT_SECRET` — long random string (e.g. `openssl rand -hex 32`)
   - `SNOWFLAKE_ACCOUNT` — account identifier (e.g. `orgname-account` or `xy12345.us-east-1`)
   - `SNOWFLAKE_USERNAME` — Snowflake user
   - `SNOWFLAKE_PASSWORD` — Snowflake password
   - **MFA (recommended)**: set `SNOWFLAKE_AUTHENTICATOR=USERNAME_PASSWORD_MFA`. Put the current 6-digit code from your authenticator app in `SNOWFLAKE_PASSCODE`, or leave it unset and `npm run init-db` will prompt you. Code rotates every 30–60s.
   - **Browser login**: set `SNOWFLAKE_AUTHENTICATOR=EXTERNALBROWSER` — opens a browser to sign in. Note: with passkey/MFA, Snowflake often redirects to the app homepage instead of back to the driver, so init may time out; use MFA passcode above if that happens.
   - `SNOWFLAKE_WAREHOUSE` — e.g. `COMPUTE_WH`
   - `SNOWFLAKE_DATABASE` — e.g. `COMUNITREE` (create in Snowflake if needed)
   - `SNOWFLAKE_SCHEMA` — e.g. `PUBLIC`
   - `SNOWFLAKE_ROLE` — e.g. `ACCOUNTADMIN` or a custom role

3. **Initialize Snowflake schema**

   Creates the `users`, `communities`, `events`, and related tables (and database/schema if you use the defaults):

   ```bash
   npm run init-db
   ```

4. **Start the server**

   ```bash
   npm start
   ```

   Dev mode with auto-reload:

   ```bash
   npm run dev
   ```

## API

Base URL: `http://localhost:8000` (or your `PORT`). The server listens on port 8000 by default for reverse-proxy setups.

### Auth

| Method | Path            | Body / Auth | Description        |
|--------|-----------------|------------|--------------------|
| POST   | `/auth/register` | `username`, `email`, `password`, `phone_number?`, `display_name?`, `bio?` | Create account; returns `user` + `token` |
| POST   | `/auth/login`    | `username`, `password` | Login; returns `user` + `token`          |
| GET    | `/auth/me`       | Header: `Authorization: Bearer <token>` | Current user profile                     |

### Users

| Method | Path         | Auth | Description              |
|--------|--------------|------|--------------------------|
| GET    | `/users/:id`  | No   | Public profile by user id |
| PATCH  | `/users/me`   | Yes  | Update own profile (`display_name`, `bio`, `avatar_url`, `phone_number`) |

### User object (stored in Snowflake)

- `id`, `username`, `email`, `phone_number`
- `password_hash` (never returned in API)
- `display_name`, `bio`, `avatar_url`
- `is_active`, `created_at`, `updated_at`

### Events

Events belong to a community. If `community_id` is omitted on create, the event is assigned to the creator's friend community. Public-community events cascade to parent communities on the event board; private-community events do not. Event visibility: **public** events show all details; **private** events use per-field toggles in `visibility_settings` (e.g. `show_date`, `show_time`, `show_rsvp_count`, `show_ratings`, `show_creator`). An event appears on a community's event board only if its date is visible (always for public; for private, when `show_date` is true). RSVPs: only the event creator can see who RSVP'd; others see count when visibility allows. Ratings are fully anonymous (aggregate and count only; no one sees who rated).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/events` | Yes | Create event. Body: `title`, optional `community_id`, `event_date`, `event_time`, `broad_location`, `specific_location`, `description`, `is_public`, `visibility_settings` (for private). |
| GET | `/events/:id` | Optional | Get one event; visibility applied for viewer. |
| PATCH | `/events/:id` | Yes (creator) | Update event and/or `visibility_settings`. |
| DELETE | `/events/:id` | Yes (creator) | Soft-deactivate event. |
| GET | `/communities/:id/events` | Optional | Event board: list events for community (`limit`, `offset`, `from_date`, `to_date`). Private community: members only. |
| POST | `/events/:id/rsvp` | Yes | Add current user's RSVP. |
| DELETE | `/events/:id/rsvp` | Yes | Remove current user's RSVP. |
| GET | `/events/:id/rsvps` | Yes | Creator: list of users who RSVP'd; others: `{ count }` when visibility allows. |
| GET | `/events/:id/my-rsvp` | Yes | `{ rsvped: true }` or `{ rsvped: false }`. |
| POST | `/events/:id/rate` | Yes | Set rating 1–5 (upsert). Body: `rating`. |
| GET | `/events/:id/ratings` | Optional | `{ aggregate, count }` when visibility allows; fully anonymous. |
| GET | `/events/:id/my-rating` | Yes | Current user's rating if any; for GUI "Your rating". |

Use `Authorization: Bearer <token>` for protected routes.

## Snowflake

Data is stored in Snowflake using the official [Node.js driver](https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver). The app uses a connection pool; ensure the configured warehouse and database exist and the user has privileges to create tables and run DML.

To add more user fields later, extend the `users` table in Snowflake (e.g. `ALTER TABLE users ADD COLUMN ...`) and update `src/services/userService.js` and validation in the routes.

## Running with Docker

The app listens on **port 8000** so a reverse proxy can point to it reliably.

### Build locally

```bash
docker build -t comunitree .
docker run -p 8000:8000 --env-file .env comunitree
```

Pass all required env vars at runtime (see [.env.example](.env.example)) via `-e`, `--env-file`, or your orchestrator’s config. The image does not include `.env` or secrets.

### Pull from GitHub Container Registry

On every push to `main` or `master`, the image is built and pushed to GHCR. Replace `<owner>` and `<repo>` with your GitHub org/repo (e.g. `myorg/Whats-`):

```bash
docker pull ghcr.io/<owner>/<repo>:latest
docker run -p 8000:8000 -e JWT_SECRET=... -e SNOWFLAKE_ACCOUNT=... ... ghcr.io/<owner>/<repo>:latest
```

For a private repo, run `docker login ghcr.io` with a GitHub PAT (or GitHub CLI) before pulling.

**Note:** DB init and migrations are not run inside the container. Run `npm run init-db` (and any migrate/seed scripts) once from a host or one-off container that can reach the same Snowflake instance.
