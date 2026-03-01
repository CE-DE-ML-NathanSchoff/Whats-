import { query, execute } from '../config/snowflake.js';

const DEFAULT_GUI_SETTINGS = {
  theme: 'system',
  language: 'en',
  notifications: {
    email_friend_request: true,
    email_event_reminder: true,
  },
};

const DEFAULT_PRIVACY_SETTINGS = {
  profile_visibility: 'public',
  show_location: true,
  show_events_attended: true,
  show_ratings: true,
  show_friends_list: true,
};

/**
 * Parse VARIANT from Snowflake row (may be object or string).
 * @param {unknown} val
 * @returns {object | null}
 */
function parseVariant(val) {
  if (val == null) return null;
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch (_) {
      return null;
    }
  }
  return null;
}

/**
 * Get user config. Creates default row if missing.
 * @param {string} userId
 * @returns {Promise<{ gui_settings: object, privacy_settings: object }>}
 */
export async function getConfig(userId) {
  const rows = await query(
    'SELECT gui_settings, privacy_settings FROM user_configs WHERE user_id = ?',
    [userId]
  );
  if (rows[0]) {
    const r = rows[0];
    const gui_settings = parseVariant(r.GUI_SETTINGS ?? r.gui_settings) || DEFAULT_GUI_SETTINGS;
    const privacy_settings = parseVariant(r.PRIVACY_SETTINGS ?? r.privacy_settings) || DEFAULT_PRIVACY_SETTINGS;
    return { gui_settings, privacy_settings };
  }
  await getOrCreateDefaultConfig(userId);
  return { gui_settings: DEFAULT_GUI_SETTINGS, privacy_settings: DEFAULT_PRIVACY_SETTINGS };
}

/**
 * Create default config row for user if not exists.
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function getOrCreateDefaultConfig(userId) {
  const existing = await query('SELECT 1 FROM user_configs WHERE user_id = ?', [userId]);
  if (existing.length > 0) return;
  const guiJson = JSON.stringify(DEFAULT_GUI_SETTINGS);
  const privacyJson = JSON.stringify(DEFAULT_PRIVACY_SETTINGS);
  await execute(
    'INSERT INTO user_configs (user_id, gui_settings, privacy_settings) VALUES (?, PARSE_JSON(?), PARSE_JSON(?))',
    [userId, guiJson, privacyJson]
  );
}

/**
 * Update user config (merge partial). Creates row if missing.
 * @param {string} userId
 * @param {{ gui_settings?: object, privacy_settings?: object }} updates
 * @returns {Promise<{ gui_settings: object, privacy_settings: object }>}
 */
export async function updateConfig(userId, updates) {
  const current = await getConfig(userId);
  const gui_settings = updates.gui_settings != null
    ? { ...current.gui_settings, ...updates.gui_settings }
    : current.gui_settings;
  const privacy_settings = updates.privacy_settings != null
    ? { ...current.privacy_settings, ...updates.privacy_settings }
    : current.privacy_settings;

  const guiJson = JSON.stringify(gui_settings);
  const privacyJson = JSON.stringify(privacy_settings);
  await execute(
    'UPDATE user_configs SET gui_settings = PARSE_JSON(?), privacy_settings = PARSE_JSON(?), updated_at = CURRENT_TIMESTAMP() WHERE user_id = ?',
    [guiJson, privacyJson, userId]
  );
  return { gui_settings, privacy_settings };
}
