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

   Creates the `users` table (and database/schema if you use the defaults):

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

Base URL: `http://localhost:3000` (or your `PORT`).

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

Use `Authorization: Bearer <token>` for protected routes.

## Snowflake

Data is stored in Snowflake using the official [Node.js driver](https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver). The app uses a connection pool; ensure the configured warehouse and database exist and the user has privileges to create tables and run DML.

To add more user fields later, extend the `users` table in Snowflake (e.g. `ALTER TABLE users ADD COLUMN ...`) and update `src/services/userService.js` and validation in the routes.
