import { query, execute } from '../config/snowflake.js';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Map a Snowflake row (uppercase keys) to a user object (camelCase, no password).
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown>}
 */
function rowToUser(row) {
  if (!row) return null;
  const id = row.ID ?? row.id;
  const username = row.USERNAME ?? row.username;
  const email = row.EMAIL ?? row.email;
  const phone_number = row.PHONE_NUMBER ?? row.phone_number;
  const display_name = row.DISPLAY_NAME ?? row.display_name;
  const bio = row.BIO ?? row.bio;
  const avatar_url = row.AVATAR_URL ?? row.avatar_url;
  const location = row.LOCATION ?? row.location;
  const is_active = row.IS_ACTIVE ?? row.is_active;
  const created_at = row.CREATED_AT ?? row.created_at;
  const updated_at = row.UPDATED_AT ?? row.updated_at;
  return {
    id,
    username,
    email,
    phone_number: phone_number ?? null,
    display_name: display_name ?? null,
    bio: bio ?? null,
    avatar_url: avatar_url ?? null,
    avatar_color: null,
    location: location ?? null,
    is_active: is_active ?? true,
    created_at,
    updated_at,
  };
}

/**
 * Create a new user. Password is hashed before storage.
 * @param {{ username: string, email: string, password: string, phone_number?: string, display_name?: string, bio?: string }} data
 * @returns {Promise<{ id: string, username: string, email: string, phone_number?: string, display_name?: string, bio?: string, created_at: string }>}
 */
export async function createUser(data) {
  const { username, email, password, phone_number, display_name, bio } = data;
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const sql = `
    INSERT INTO users (username, email, phone_number, password_hash, display_name, bio)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  await execute(sql, [
    username,
    email,
    phone_number || null,
    password_hash,
    display_name || null,
    bio || null,
  ]);

  const rows = await query(
    'SELECT id, username, email, phone_number, display_name, bio, avatar_url, location, created_at FROM users WHERE username = ?',
    [username]
  );
  const row = rows[0];
  return rowToUser(row);
}

/**
 * Find user by username (includes password_hash for login).
 * @param {string} username
 * @returns {Promise<{ id: string, username: string, email: string, password_hash: string, phone_number?: string, ... } | null>}
 */
export async function findByUsername(username) {
  const rows = await query(
    'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
    [username]
  );
  return rows[0] || null;
}

/**
 * Find user by email.
 * @param {string} email
 * @returns {Promise<object | null>}
 */
export async function findByEmail(email) {
  const rows = await query(
    'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
    [email]
  );
  return rows[0] || null;
}

/**
 * Find user by id (public profile, no password).
 * @param {string} id
 * @returns {Promise<object | null>}
 */
export async function findById(id) {
  const rows = await query(
    'SELECT id, username, email, phone_number, display_name, bio, avatar_url, location, is_active, created_at, updated_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] ? rowToUser(rows[0]) : null;
}

/**
 * Verify password against stored hash.
 * @param {string} plainPassword
 * @param {string} passwordHash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Update user profile fields (optional fields).
 * @param {string} userId
 * @param {{ display_name?: string, bio?: string, avatar_url?: string, phone_number?: string, location?: string }} updates
 * @returns {Promise<object | null>}
 */
export async function updateUser(userId, updates) {
  const allowed = ['display_name', 'bio', 'avatar_url', 'phone_number', 'location'];
  const setClauses = [];
  const values = [];
  for (const [key, value] of Object.entries(updates)) {
    if (allowed.includes(key) && value !== undefined) {
      setClauses.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (setClauses.length === 0) return findById(userId);
  setClauses.push('updated_at = CURRENT_TIMESTAMP()');
  values.push(userId);
  const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;
  await execute(sql, values);
  return findById(userId);
}

/**
 * Set user's avatar URL (custom image).
 * @param {string} userId
 * @param {string} url
 * @returns {Promise<object | null>}
 */
export async function setAvatarUrl(userId, url) {
  await execute(
    'UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP() WHERE id = ?',
    [url || null, userId]
  );
  return findById(userId);
}
