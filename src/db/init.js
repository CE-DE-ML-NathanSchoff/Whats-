/**
 * Initialize Comunitree schema in Snowflake.
 * Run once: npm run init-db
 * Ensure COMUNITREE database and warehouse exist in Snowflake first.
 */
import 'dotenv/config';
import readline from 'readline';

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
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
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
  CONSTRAINT chk_invite_status CHECK (status IN ('pending', 'accepted', 'declined')),
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
  CONSTRAINT chk_friendship_status CHECK (status IN ('pending', 'accepted', 'declined')),
  CONSTRAINT fk_friendship_requester FOREIGN KEY (requester_id) REFERENCES users(id),
  CONSTRAINT fk_friendship_addressee FOREIGN KEY (addressee_id) REFERENCES users(id),
  CONSTRAINT uq_friendship_pair UNIQUE (requester_id, addressee_id)
);
`;

async function init() {
  // If MFA is required and passcode not in .env, prompt so it's set before snowflake config loads
  if (process.env.SNOWFLAKE_AUTHENTICATOR === 'USERNAME_PASSWORD_MFA' && !process.env.SNOWFLAKE_PASSCODE) {
    process.env.SNOWFLAKE_PASSCODE = await promptForMfaPasscode();
  }
  const { execute } = await import('../config/snowflake.js');

  const database = process.env.SNOWFLAKE_DATABASE || 'COMUNITREE';
  const schema = process.env.SNOWFLAKE_SCHEMA || 'PUBLIC';

  try {
    await execute(`CREATE DATABASE IF NOT EXISTS ${database}`);
    await execute(`USE DATABASE ${database}`);
    await execute(`USE SCHEMA ${schema}`);
    await execute(USERS_TABLE);
    console.log('Table users created or already exists.');
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
    console.log('Comunitree DB init done.');
  } catch (err) {
    console.error('Init failed:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

init();
