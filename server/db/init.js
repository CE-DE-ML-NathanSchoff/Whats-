/**
 * Initialize Comunitree schema in Snowflake.
 * Run once: npm run init-db
 * When using key-pair (default): on first run, prompts for MFA once to register a new key, then creates the key file and schema. After that, no MFA needed (24/7).
 */
import 'dotenv/config';
import readline from 'readline';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
/** If using MFA without passcode in .env, prompt for it so we set it before loading snowflake config. */
function promptForMfaPasscode() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('Enter your 6-digit MFA code from authenticator app: ', (code) => {
      rl.close();
      resolve((code || '').trim());
    });
  });
}

/** Resolve private key path: env or default next to project root. */
function getPrivateKeyPath() {
  const envPath = process.env.SNOWFLAKE_PRIVATE_KEY_PATH;
  if (envPath) return path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath);
  return path.resolve(process.cwd(), 'snowflake_rsa_key.p8');
}

/** Generate RSA key pair and return { publicKeyPem, privateKeyPem }. */
function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKeyPem: publicKey, privateKeyPem: privateKey };
}

/**
 * Setup key-pair for 24/7 auth: generate keys, register public key in Snowflake, write private key to file.
 * Call this when already connected with MFA/password (execute works).
 */
async function setupKeyPair(execute, keyPath) {
  const username = process.env.SNOWFLAKE_USERNAME;
  if (!username) {
    throw new Error('SNOWFLAKE_USERNAME is required to set up key-pair');
  }
  console.log('Generating RSA key pair for key-pair auth (24/7)...');
  const { publicKeyPem, privateKeyPem } = generateKeyPair();
  const pubKeyBody = publicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');
  const snowflakeUser = username.toUpperCase().replace(/"/g, '');
  const sql = `ALTER USER ${snowflakeUser} SET RSA_PUBLIC_KEY = '${pubKeyBody}'`;
  await execute(sql);
  console.log('Public key registered for user', username);
  const dir = path.dirname(keyPath);
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  try {
    fs.writeFileSync(keyPath, privateKeyPem, { mode: 0o600 });
    console.log('Private key written to', keyPath);
  } catch (writeErr) {
    const fallback = path.join(process.cwd(), 'snowflake_rsa_key.p8');
    if (fallback !== keyPath) {
      try {
        fs.writeFileSync(fallback, privateKeyPem, { mode: 0o600 });
        console.log('Could not write to', keyPath, '(e.g. permission denied). Wrote to', fallback);
        console.log('Set SNOWFLAKE_PRIVATE_KEY_PATH=' + fallback + ' in .env and ensure the app can read it.');
      } catch (_) {
        throw new Error(`Cannot write private key to ${keyPath}: ${writeErr.message}. Ensure the directory exists and is writable (e.g. Docker volume).`);
      }
    } else {
      throw new Error(`Cannot write private key to ${keyPath}: ${writeErr.message}`);
    }
  }
}

const USERS_TABLE = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) DEFAULT UUID_STRING() PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  bio VARCHAR(1000),
  avatar_url VARCHAR(500),
  avatar_color VARCHAR(7),
  location VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
`;

const USER_CONFIGS_TABLE = `
CREATE TABLE IF NOT EXISTS user_configs (
  user_id VARCHAR(36) PRIMARY KEY,
  gui_settings VARIANT,
  privacy_settings VARIANT,
  updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  CONSTRAINT fk_config_user FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

const COMMUNITIES_TABLE = `
CREATE TABLE IF NOT EXISTS communities (
  id VARCHAR(36) DEFAULT UUID_STRING() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL,
  parent_id VARCHAR(36),
  founder_id VARCHAR(36),
  is_friend_group BOOLEAN DEFAULT FALSE,
  description VARCHAR(2000),
  profile_data VARIANT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  CONSTRAINT fk_community_parent FOREIGN KEY (parent_id) REFERENCES communities(id),
  CONSTRAINT fk_community_founder FOREIGN KEY (founder_id) REFERENCES users(id)
);
`;

const COMMUNITY_MEMBERS_TABLE = `
CREATE TABLE IF NOT EXISTS community_members (
  community_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (community_id, user_id),
  CONSTRAINT fk_member_community FOREIGN KEY (community_id) REFERENCES communities(id),
  CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

const COMMUNITY_PARENTS_TABLE = `
CREATE TABLE IF NOT EXISTS community_parents (
  community_id VARCHAR(36) NOT NULL,
  parent_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (community_id, parent_id),
  CONSTRAINT fk_cp_community FOREIGN KEY (community_id) REFERENCES communities(id),
  CONSTRAINT fk_cp_parent FOREIGN KEY (parent_id) REFERENCES communities(id)
);
`;

const COMMUNITY_INVITES_TABLE = `
CREATE TABLE IF NOT EXISTS community_invites (
  id VARCHAR(36) DEFAULT UUID_STRING() PRIMARY KEY,
  community_id VARCHAR(36) NOT NULL,
  inviter_id VARCHAR(36) NOT NULL,
  invitee_id VARCHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  CONSTRAINT fk_invite_community FOREIGN KEY (community_id) REFERENCES communities(id),
  CONSTRAINT fk_invite_inviter FOREIGN KEY (inviter_id) REFERENCES users(id),
  CONSTRAINT fk_invite_invitee FOREIGN KEY (invitee_id) REFERENCES users(id),
  CONSTRAINT uq_community_invitee UNIQUE (community_id, invitee_id)
);
`;

const FRIENDSHIPS_TABLE = `
CREATE TABLE IF NOT EXISTS friendships (
  id VARCHAR(36) DEFAULT UUID_STRING() PRIMARY KEY,
  requester_id VARCHAR(36) NOT NULL,
  addressee_id VARCHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  CONSTRAINT fk_friendship_requester FOREIGN KEY (requester_id) REFERENCES users(id),
  CONSTRAINT fk_friendship_addressee FOREIGN KEY (addressee_id) REFERENCES users(id),
  CONSTRAINT uq_friendship_pair UNIQUE (requester_id, addressee_id)
);
`;

const EVENTS_TABLE = `
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(36) DEFAULT UUID_STRING() PRIMARY KEY,
  community_id VARCHAR(36) NOT NULL,
  creator_id VARCHAR(36) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description VARCHAR(5000),
  event_date DATE,
  event_time VARCHAR(50),
  broad_location VARCHAR(500),
  specific_location VARCHAR(1000),
  is_public BOOLEAN DEFAULT TRUE,
  visibility_settings VARIANT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  CONSTRAINT fk_event_community FOREIGN KEY (community_id) REFERENCES communities(id),
  CONSTRAINT fk_event_creator FOREIGN KEY (creator_id) REFERENCES users(id)
);
`;

const EVENT_RSVPS_TABLE = `
CREATE TABLE IF NOT EXISTS event_rsvps (
  event_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (event_id, user_id),
  CONSTRAINT fk_rsvp_event FOREIGN KEY (event_id) REFERENCES events(id),
  CONSTRAINT fk_rsvp_user FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

const EVENT_RATINGS_TABLE = `
CREATE TABLE IF NOT EXISTS event_ratings (
  event_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  rating INT NOT NULL,
  created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (event_id, user_id),
  CONSTRAINT fk_rating_event FOREIGN KEY (event_id) REFERENCES events(id),
  CONSTRAINT fk_rating_user FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

const EVENT_WATERS_TABLE = `
CREATE TABLE IF NOT EXISTS event_waters (
  event_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (event_id, user_id),
  CONSTRAINT fk_water_event FOREIGN KEY (event_id) REFERENCES events(id),
  CONSTRAINT fk_water_user FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

/** Run schema creation (tables, etc.). */
async function runSchema(execute) {
  const database = process.env.SNOWFLAKE_DATABASE || 'COMUNITREE';
  const schema = process.env.SNOWFLAKE_SCHEMA || 'PUBLIC';

  await execute(`CREATE DATABASE IF NOT EXISTS ${database}`);
  await execute(`USE DATABASE ${database}`);
  await execute(`USE SCHEMA ${schema}`);
  await execute(USERS_TABLE);
  console.log('Table users created or already exists.');
  await execute(USER_CONFIGS_TABLE);
  console.log('Table user_configs created or already exists.');
  await execute(COMMUNITIES_TABLE);
  console.log('Table communities created or already exists.');
  await execute(COMMUNITY_MEMBERS_TABLE);
  console.log('Table community_members created or already exists.');
  await execute(COMMUNITY_PARENTS_TABLE);
  console.log('Table community_parents created or already exists.');
  await execute(COMMUNITY_INVITES_TABLE);
  console.log('Table community_invites created or already exists.');
  await execute(FRIENDSHIPS_TABLE);
  console.log('Table friendships created or already exists.');
  await execute(EVENTS_TABLE);
  console.log('Table events created or already exists.');
  await execute(EVENT_RSVPS_TABLE);
  console.log('Table event_rsvps created or already exists.');
  await execute(EVENT_RATINGS_TABLE);
  console.log('Table event_ratings created or already exists.');
  await execute(EVENT_WATERS_TABLE);
  console.log('Table event_waters created or already exists.');
  for (const [col, def] of [['waters_count', 'INT DEFAULT 0'], ['link', 'VARCHAR(2000)']]) {
    try {
      await execute(`ALTER TABLE events ADD COLUMN IF NOT EXISTS ${col} ${def}`);
      console.log(`Column ${col} added or already exists.`);
    } catch (e) {
      if (/ambiguous|already exists/i.test(e.message)) {
        console.log(`Column ${col} already exists, skipping.`);
      } else throw e;
    }
  }
}

async function init() {
  const keyPath = getPrivateKeyPath();
  const useJwt = process.env.SNOWFLAKE_AUTHENTICATOR === 'SNOWFLAKE_JWT';
  // Key exists only if: file at path exists, OR we have inline key (and we're not using path)
  const pathSet = !!process.env.SNOWFLAKE_PRIVATE_KEY_PATH?.trim();
  const keyExists = pathSet ? fs.existsSync(keyPath) : !!process.env.SNOWFLAKE_PRIVATE_KEY?.trim();

  const needsKeySetup = useJwt && !keyExists;

  if (needsKeySetup) {
    console.log('Key-pair auth is set but no key file found. Will connect with MFA once to create and register a key, then create the schema.');
    process.env.SNOWFLAKE_AUTHENTICATOR = 'USERNAME_PASSWORD_MFA';
    // Unset path so snowflake config won't try to read non-existent file
    delete process.env.SNOWFLAKE_PRIVATE_KEY_PATH;
    if (!process.env.SNOWFLAKE_PASSCODE?.trim()) {
      if (!process.stdin.isTTY) {
        console.error('Cannot prompt for MFA: stdin is not a TTY. Set SNOWFLAKE_PASSCODE in .env or run with -it (e.g. docker run -it ...).');
        process.exit(1);
      }
      process.env.SNOWFLAKE_PASSCODE = await promptForMfaPasscode();
    }
  } else if (process.env.SNOWFLAKE_AUTHENTICATOR === 'USERNAME_PASSWORD_MFA' && !process.env.SNOWFLAKE_PASSCODE?.trim()) {
    if (!process.stdin.isTTY) {
      console.error('Cannot prompt for MFA: stdin is not a TTY. Set SNOWFLAKE_PASSCODE in .env or run with -it.');
      process.exit(1);
    }
    process.env.SNOWFLAKE_PASSCODE = await promptForMfaPasscode();
  }

  const { execute } = await import('../config/snowflake.js');

  try {
    if (needsKeySetup) {
      await setupKeyPair(execute, keyPath);
      console.log('Key-pair setup complete. Future runs (and the app) can use SNOWFLAKE_AUTHENTICATOR=SNOWFLAKE_JWT and SNOWFLAKE_PRIVATE_KEY_PATH=' + keyPath);
    }
    await runSchema(execute);
    console.log('Comunitree DB init done.');
  } catch (err) {
    console.error('Init failed:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

init();
