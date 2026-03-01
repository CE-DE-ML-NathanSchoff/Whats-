/**
 * Migration: add user profile (location, avatar_color) and user_configs table.
 * Run once on existing DBs: node src/db/migrateProfileAndConfig.js
 * Safe to run multiple times (adds columns only if missing; creates table if not exist).
 */
import 'dotenv/config';
import { query, execute } from '../config/snowflake.js';

async function run() {
  try {
    const db = process.env.SNOWFLAKE_DATABASE || 'COMUNITREE';
    const schema = process.env.SNOWFLAKE_SCHEMA || 'PUBLIC';
    await execute(`USE DATABASE ${db}`);
    await execute(`USE SCHEMA ${schema}`);

    const userCols = await query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_NAME = 'USERS' AND TABLE_SCHEMA = ?`,
      [schema]
    );
    const colNames = (userCols || []).map((r) => (r.COLUMN_NAME || r.column_name || '').toUpperCase());

    if (!colNames.includes('AVATAR_COLOR')) {
      await execute('ALTER TABLE users ADD COLUMN avatar_color VARCHAR(7)');
      console.log('Added users.avatar_color');
    }
    if (!colNames.includes('LOCATION')) {
      await execute('ALTER TABLE users ADD COLUMN location VARCHAR(500)');
      console.log('Added users.location');
    }

    await execute(`
      CREATE TABLE IF NOT EXISTS user_configs (
        user_id VARCHAR(36) PRIMARY KEY,
        gui_settings VARIANT,
        privacy_settings VARIANT,
        updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
        CONSTRAINT fk_config_user FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('Table user_configs created or already exists.');
    console.log('Migration profile and config done.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

run();
