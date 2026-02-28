/**
 * Migration: add private communities and friend groups support.
 * Run once on existing DBs: node src/db/migratePrivateAndFriends.js
 * Safe to run multiple times (creates tables if not exist; alters only if needed).
 */
import 'dotenv/config';
import { query, execute } from '../config/snowflake.js';

async function run() {
  try {
    // 1. Add founder_id and is_friend_group to communities if missing
    const cols = await query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_NAME = 'COMMUNITIES' AND TABLE_SCHEMA = CURRENT_SCHEMA()`
    );
    const hasFounderId = cols.some((r) => (r.COLUMN_NAME || r.column_name || '').toUpperCase() === 'FOUNDER_ID');
    const hasFriendGroup = cols.some((r) => (r.COLUMN_NAME || r.column_name || '').toUpperCase() === 'IS_FRIEND_GROUP');
    if (!hasFounderId) {
      await execute('ALTER TABLE communities ADD COLUMN founder_id VARCHAR(36)');
      console.log('Added communities.founder_id');
    }
    if (!hasFriendGroup) {
      await execute('ALTER TABLE communities ADD COLUMN is_friend_group BOOLEAN DEFAULT FALSE');
      console.log('Added communities.is_friend_group');
    }

    // 2. Update community type constraint to include PRIVATE
    try {
      await execute('ALTER TABLE communities DROP CONSTRAINT chk_community_type');
    } catch (_) {
      // ignore if already dropped or not present
    }
    await execute("ALTER TABLE communities ADD CONSTRAINT chk_community_type CHECK (type IN ('LOCATION', 'SUB', 'PRIVATE'))");
    console.log('Updated chk_community_type');

    // 3. Update community_members role constraint to include owner
    try {
      await execute('ALTER TABLE community_members DROP CONSTRAINT chk_member_role');
    } catch (_) {
      // ignore
    }
    await execute("ALTER TABLE community_members ADD CONSTRAINT chk_member_role CHECK (role IN ('member', 'moderator', 'owner'))");
    console.log('Updated chk_member_role');

    // 4. Create new tables
    await execute(`
      CREATE TABLE IF NOT EXISTS community_parents (
        community_id VARCHAR(36) NOT NULL,
        parent_id VARCHAR(36) NOT NULL,
        PRIMARY KEY (community_id, parent_id),
        CONSTRAINT fk_cp_community FOREIGN KEY (community_id) REFERENCES communities(id),
        CONSTRAINT fk_cp_parent FOREIGN KEY (parent_id) REFERENCES communities(id)
      )
    `);
    await execute(`
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
      )
    `);
    await execute(`
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
      )
    `);
    console.log('Created community_parents, community_invites, friendships if not exist.');
    console.log('Migration done.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

run();
