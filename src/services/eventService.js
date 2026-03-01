import crypto from 'crypto';
import { query, execute } from '../config/snowflake.js';
import * as communityService from './communityService.js';
import * as userService from './userService.js';

const DEFAULT_VISIBILITY = {
  show_date: false,
  show_time: false,
  show_broad_location: false,
  show_specific_location: false,
  show_rsvp_count: false,
  show_ratings: false,
  show_description: false,
  show_creator: false,
};

/**
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown> | null}
 */
function rowToEvent(row) {
  if (!row) return null;
  const id = row.ID ?? row.id;
  const community_id = row.COMMUNITY_ID ?? row.community_id;
  const creator_id = row.CREATOR_ID ?? row.creator_id;
  const title = row.TITLE ?? row.title;
  const description = row.DESCRIPTION ?? row.description;
  const event_date = row.EVENT_DATE ?? row.event_date;
  const event_time = row.EVENT_TIME ?? row.event_time;
  const broad_location = row.BROAD_LOCATION ?? row.broad_location;
  const specific_location = row.SPECIFIC_LOCATION ?? row.specific_location;
  const is_public = row.IS_PUBLIC ?? row.is_public;
  let visibility_settings = row.VISIBILITY_SETTINGS ?? row.visibility_settings;
  if (visibility_settings && typeof visibility_settings === 'string') {
    try {
      visibility_settings = JSON.parse(visibility_settings);
    } catch (_) {
      visibility_settings = null;
    }
  }
  const is_active = row.IS_ACTIVE ?? row.is_active;
  const created_at = row.CREATED_AT ?? row.created_at;
  const updated_at = row.UPDATED_AT ?? row.updated_at;
  return {
    id,
    community_id,
    creator_id,
    title,
    description: description ?? null,
    event_date: event_date != null ? String(event_date).slice(0, 10) : null,
    event_time: event_time ?? null,
    broad_location: broad_location ?? null,
    specific_location: specific_location ?? null,
    is_public: is_public ?? true,
    visibility_settings: visibility_settings ?? null,
    is_active: is_active ?? true,
    created_at,
    updated_at,
  };
}

/**
 * Create event. If community_id missing, use creator's friend community.
 * @param {string} creatorId
 * @param {{ community_id?: string, title: string, event_date?: string, event_time?: string, broad_location?: string, specific_location?: string, description?: string, is_public?: boolean, visibility_settings?: object }} payload
 * @returns {Promise<Record<string, unknown>>}
 */
export async function createEvent(creatorId, payload) {
  let communityId = payload.community_id;
  if (!communityId) {
    const friendGroup = await communityService.getFriendGroupForUser(creatorId);
    if (!friendGroup) {
      const err = new Error('No friend community found for user');
      err.code = 'NO_FRIEND_COMMUNITY';
      throw err;
    }
    communityId = friendGroup.id;
  }

  const community = await communityService.getById(communityId);
  if (!community) {
    const err = new Error('Community not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  const isMember = await communityService.isMember(creatorId, communityId);
  if (!isMember) {
    const err = new Error('You must be a member of the community to create an event');
    err.code = 'NOT_MEMBER';
    throw err;
  }

  const is_public = payload.is_public !== false;
  let visibility_settings = payload.visibility_settings;
  if (!is_public && visibility_settings == null) {
    visibility_settings = DEFAULT_VISIBILITY;
  }
  const visibilityJson =
    visibility_settings != null ? JSON.stringify(visibility_settings) : null;
  const eventId = crypto.randomUUID();

  const sql = `
    INSERT INTO events (id, community_id, creator_id, title, description, event_date, event_time, broad_location, specific_location, is_public, visibility_settings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, PARSE_JSON(?))
  `;
  await execute(sql, [
    eventId,
    communityId,
    creatorId,
    payload.title,
    payload.description ?? null,
    payload.event_date ?? null,
    payload.event_time ?? null,
    payload.broad_location ?? null,
    payload.specific_location ?? null,
    is_public,
    visibilityJson ?? 'null',
  ]);

  return getEventById(eventId, { viewerId: creatorId });
}

/**
 * Get event by id (full row). Returns null if not found or inactive.
 * @param {string} eventId
 * @param {{ includeInactive?: boolean, viewerId?: string }} [opts]
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function getEventById(eventId, opts = {}) {
  let sql = `
    SELECT id, community_id, creator_id, title, description, event_date, event_time, broad_location, specific_location, is_public, visibility_settings, is_active, created_at, updated_at
    FROM events WHERE id = ?
  `;
  const binds = [eventId];
  if (!opts.includeInactive) {
    sql += ' AND is_active = TRUE';
  }
  const rows = await query(sql, binds);
  if (!rows[0]) return null;
  const event = rowToEvent(rows[0]);

  const [rsvpRows, ratingRows] = await Promise.all([
    query('SELECT COUNT(*) AS cnt FROM event_rsvps WHERE event_id = ?', [
      eventId,
    ]),
    query(
      'SELECT COUNT(*) AS cnt, AVG(rating) AS avg_rating FROM event_ratings WHERE event_id = ?',
      [eventId]
    ),
  ]);
  const rsvp_count = Number(rsvpRows[0]?.CNT ?? rsvpRows[0]?.cnt ?? 0);
  const rating_count = Number(ratingRows[0]?.CNT ?? ratingRows[0]?.cnt ?? 0);
  const avg = ratingRows[0]?.AVG_RATING ?? ratingRows[0]?.avg_rating;
  const rating_aggregate =
    avg != null ? Math.round(Number(avg) * 100) / 100 : null;

  return {
    ...event,
    rsvp_count,
    rating_count,
    rating_aggregate,
  };
}

/**
 * Apply visibility rules to event for a viewer. Returns object safe to send to client.
 * Creator always sees full event. For private events, non-creators see only toggled fields.
 * Ratings: never expose who rated; only aggregate/count when show_ratings. RSVP list only for creator via separate endpoint.
 * @param {Record<string, unknown>} event - event with rsvp_count, rating_aggregate, rating_count
 * @param {string | undefined} viewerId
 * @param {{ creator?: Record<string, unknown> }} [opts] - optional creator user object for show_creator
 * @returns {Record<string, unknown>}
 */
export function applyEventVisibility(event, viewerId, opts = {}) {
  const isCreator = viewerId && event.creator_id === viewerId;
  if (event.is_public || isCreator) {
    const out = { ...event };
    if (opts.creator && event.creator_id) {
      out.creator = opts.creator;
    }
    return out;
  }

  const vis = event.visibility_settings || DEFAULT_VISIBILITY;
  const out = {
    id: event.id,
    community_id: event.community_id,
    title: event.title,
    is_public: event.is_public,
  };
  if (vis.show_date && event.event_date != null) out.event_date = event.event_date;
  if (vis.show_time && event.event_time != null) out.event_time = event.event_time;
  if (vis.show_broad_location && event.broad_location != null)
    out.broad_location = event.broad_location;
  if (vis.show_specific_location && event.specific_location != null)
    out.specific_location = event.specific_location;
  if (vis.show_description && event.description != null)
    out.description = event.description;
  if (vis.show_rsvp_count) out.rsvp_count = event.rsvp_count ?? 0;
  if (vis.show_ratings) {
    out.rating_aggregate = event.rating_aggregate ?? null;
    out.rating_count = event.rating_count ?? 0;
  }
  if (vis.show_creator && opts.creator && event.creator_id) {
    out.creator = opts.creator;
  }
  return out;
}

/**
 * Check if event date is visible for listing on board (public always; private only if show_date).
 * @param {Record<string, unknown>} event
 * @returns {boolean}
 */
function isDateVisibleForBoard(event) {
  if (event.is_public) return true;
  const vis = event.visibility_settings || DEFAULT_VISIBILITY;
  return vis.show_date === true && event.event_date != null;
}

/**
 * List events for a community's event board. Private community: only members, no cascade. Public: cascade from descendants.
 * Only events where date is visible are included. Each event is visibility-masked.
 * @param {string} communityId
 * @param {string | undefined} viewerId
 * @param {{ limit?: number, offset?: number, from_date?: string, to_date?: string }} [opts]
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function listEventsForCommunity(communityId, viewerId, opts = {}) {
  const community = await communityService.getById(communityId);
  if (!community) return [];

  const { limit = 50, offset = 0, from_date, to_date } = opts;

  let communityIds = [communityId];
  if (community.type === 'LOCATION' || community.type === 'SUB') {
    communityIds = await communityService.getDescendantPublicCommunityIds(
      communityId
    );
  } else {
    if (community.type === 'PRIVATE') {
      if (!viewerId) return [];
      const isMember = await communityService.isMember(viewerId, communityId);
      if (!isMember) return [];
    }
  }

  const placeholders = communityIds.map(() => '?').join(',');
  let sql = `
    SELECT id, community_id, creator_id, title, description, event_date, event_time, broad_location, specific_location, is_public, visibility_settings, is_active, created_at, updated_at
    FROM events
    WHERE community_id IN (${placeholders}) AND is_active = TRUE
  `;
  const binds = [...communityIds];
  if (from_date) {
    sql += ' AND event_date >= ?';
    binds.push(from_date);
  }
  if (to_date) {
    sql += ' AND event_date <= ?';
    binds.push(to_date);
  }
  sql += ' ORDER BY event_date ASC, created_at ASC LIMIT ? OFFSET ?';
  binds.push(limit, offset);

  const rows = await query(sql, binds);
  const creatorIds = [...new Set(rows.map((r) => r.CREATOR_ID ?? r.creator_id))];
  const creatorMap = new Map();
  for (const cid of creatorIds) {
    if (cid) {
      const user = await userService.findById(cid);
      if (user) creatorMap.set(cid, user);
    }
  }

  const result = [];
  for (const row of rows) {
    const event = rowToEvent(row);
    const [rsvpRows, ratingRows] = await Promise.all([
      query('SELECT COUNT(*) AS cnt FROM event_rsvps WHERE event_id = ?', [
        event.id,
      ]),
      query(
        'SELECT COUNT(*) AS cnt, AVG(rating) AS avg_rating FROM event_ratings WHERE event_id = ?',
        [event.id]
      ),
    ]);
    event.rsvp_count = Number(rsvpRows[0]?.CNT ?? rsvpRows[0]?.cnt ?? 0);
    event.rating_count = Number(ratingRows[0]?.CNT ?? ratingRows[0]?.cnt ?? 0);
    const avg = ratingRows[0]?.AVG_RATING ?? ratingRows[0]?.avg_rating;
    event.rating_aggregate =
      avg != null ? Math.round(Number(avg) * 100) / 100 : null;

    if (!isDateVisibleForBoard(event)) continue;
    const creator = creatorMap.get(event.creator_id) || null;
    const masked = applyEventVisibility(event, viewerId, { creator });
    result.push(masked);
  }
  return result;
}

/**
 * Update event. Creator only.
 * @param {string} eventId
 * @param {string} userId
 * @param {{ title?: string, description?: string, event_date?: string, event_time?: string, broad_location?: string, specific_location?: string, is_public?: boolean, visibility_settings?: object, is_active?: boolean }} payload
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function updateEvent(eventId, userId, payload) {
  const event = await getEventById(eventId, { includeInactive: true });
  if (!event) {
    const err = new Error('Event not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (event.creator_id !== userId) {
    const err = new Error('Only the creator can update this event');
    err.code = 'FORBIDDEN';
    throw err;
  }

  const setClauses = [];
  const values = [];
  const allowed = [
    'title',
    'description',
    'event_date',
    'event_time',
    'broad_location',
    'specific_location',
    'is_public',
    'visibility_settings',
    'is_active',
  ];
  for (const key of allowed) {
    if (payload[key] === undefined) continue;
    if (key === 'visibility_settings') {
      setClauses.push('visibility_settings = PARSE_JSON(?)');
      values.push(JSON.stringify(payload[key]));
    } else if (key === 'is_public' || key === 'is_active') {
      setClauses.push(`${key} = ?`);
      values.push(!!payload[key]);
    } else {
      setClauses.push(`${key} = ?`);
      values.push(payload[key] ?? null);
    }
  }
  if (setClauses.length === 0) return getEventById(eventId, { viewerId: userId });
  setClauses.push('updated_at = CURRENT_TIMESTAMP()');
  values.push(eventId);
  await execute(
    `UPDATE events SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
  return getEventById(eventId, { viewerId: userId });
}

/**
 * Soft-delete (deactivate) event. Creator only.
 * @param {string} eventId
 * @param {string} userId
 * @returns {Promise<{ deleted: boolean }>}
 */
export async function deleteEvent(eventId, userId) {
  const event = await getEventById(eventId, { includeInactive: true });
  if (!event) {
    const err = new Error('Event not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (event.creator_id !== userId) {
    const err = new Error('Only the creator can delete this event');
    err.code = 'FORBIDDEN';
    throw err;
  }
  await execute('UPDATE events SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP() WHERE id = ?', [
    eventId,
  ]);
  return { deleted: true };
}

// ---------- RSVPs ----------

export async function rsvpToEvent(eventId, userId) {
  const event = await getEventById(eventId);
  if (!event) {
    const err = new Error('Event not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  await execute(
    `INSERT INTO event_rsvps (event_id, user_id)
     SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM event_rsvps WHERE event_id = ? AND user_id = ?)`,
    [eventId, userId, eventId, userId]
  );
  return { rsvped: true };
}

export async function removeRsvp(eventId, userId) {
  const { rows } = await execute(
    'DELETE FROM event_rsvps WHERE event_id = ? AND user_id = ?',
    [eventId, userId]
  );
  return { rsvped: false };
}

export async function getRsvpCount(eventId) {
  const rows = await query(
    'SELECT COUNT(*) AS cnt FROM event_rsvps WHERE event_id = ?',
    [eventId]
  );
  return Number(rows[0]?.CNT ?? rows[0]?.cnt ?? 0);
}

/**
 * List users who RSVP'd. For creator only; others get count only via getRsvpCount.
 * @param {string} eventId
 * @param {string} requesterId - must be event creator to get list
 * @returns {Promise<Array<Record<string, unknown>> | { count: number }>}
 */
export async function getRsvpsForEvent(eventId, requesterId) {
  const event = await getEventById(eventId);
  if (!event) {
    const err = new Error('Event not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  const count = await getRsvpCount(eventId);
  if (event.creator_id !== requesterId) {
    return { count };
  }
  const rows = await query(
    `SELECT er.user_id, u.username, u.display_name
     FROM event_rsvps er
     JOIN users u ON u.id = er.user_id AND u.is_active = TRUE
     WHERE er.event_id = ?
     ORDER BY er.created_at ASC`,
    [eventId]
  );
  return rows.map((r) => ({
    user_id: r.USER_ID ?? r.user_id,
    username: r.USERNAME ?? r.username,
    display_name: r.DISPLAY_NAME ?? r.display_name,
  }));
}

export async function getMyRsvp(eventId, userId) {
  const rows = await query(
    'SELECT 1 FROM event_rsvps WHERE event_id = ? AND user_id = ?',
    [eventId, userId]
  );
  return { rsvped: rows.length > 0 };
}

/**
 * List events the user has RSVP'd to (attended / planning to attend).
 * @param {string} userId
 * @param {{ limit?: number, offset?: number }} [opts]
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function listEventsAttendedByUser(userId, opts = {}) {
  const { limit = 50, offset = 0 } = opts;
  const rows = await query(
    `SELECT e.id, e.community_id, e.creator_id, e.title, e.description, e.event_date, e.event_time, e.broad_location, e.specific_location, e.is_public, e.is_active, e.created_at, e.updated_at, er.created_at AS rsvp_at
     FROM event_rsvps er
     JOIN events e ON e.id = er.event_id AND e.is_active = TRUE
     WHERE er.user_id = ?
     ORDER BY er.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  const result = [];
  for (const row of rows) {
    const event = rowToEvent(row);
    const [ratingRows] = await query(
      'SELECT rating FROM event_ratings WHERE event_id = ? AND user_id = ?',
      [event.id, userId]
    );
    const my_rating = ratingRows[0] ? (ratingRows[0].RATING ?? ratingRows[0].rating) : null;
    result.push({
      ...event,
      rsvp_at: row.RSVP_AT ?? row.rsvp_at,
      my_rating: my_rating != null ? Number(my_rating) : null,
    });
  }
  return result;
}

/**
 * List events the user has rated with their rating.
 * @param {string} userId
 * @param {{ limit?: number, offset?: number }} [opts]
 * @returns {Promise<Array<{ event_id: string, event_title: string, rating: number, created_at: string }>>}
 */
export async function listMyEventRatings(userId, opts = {}) {
  const { limit = 50, offset = 0 } = opts;
  const rows = await query(
    `SELECT er.event_id, er.rating, er.created_at, e.title AS event_title
     FROM event_ratings er
     JOIN events e ON e.id = er.event_id AND e.is_active = TRUE
     WHERE er.user_id = ?
     ORDER BY er.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  return rows.map((r) => ({
    event_id: r.EVENT_ID ?? r.event_id,
    event_title: r.EVENT_TITLE ?? r.event_title ?? '',
    rating: Number(r.RATING ?? r.rating),
    created_at: r.CREATED_AT ?? r.created_at,
  }));
}

// ---------- Ratings (anonymous) ----------

export async function rateEvent(eventId, userId, rating) {
  if (rating < 1 || rating > 5) {
    const err = new Error('Rating must be between 1 and 5');
    err.code = 'INVALID_RATING';
    throw err;
  }
  const event = await getEventById(eventId);
  if (!event) {
    const err = new Error('Event not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  const existing = await query(
    'SELECT 1 FROM event_ratings WHERE event_id = ? AND user_id = ?',
    [eventId, userId]
  );
  if (existing.length > 0) {
    await execute(
      'UPDATE event_ratings SET rating = ?, created_at = CURRENT_TIMESTAMP() WHERE event_id = ? AND user_id = ?',
      [rating, eventId, userId]
    );
  } else {
    await execute(
      'INSERT INTO event_ratings (event_id, user_id, rating) VALUES (?, ?, ?)',
      [eventId, userId, rating]
    );
  }
  return { rating };
}

export async function getRatingAggregate(eventId) {
  const rows = await query(
    'SELECT COUNT(*) AS cnt, AVG(rating) AS avg_rating FROM event_ratings WHERE event_id = ?',
    [eventId]
  );
  const count = Number(rows[0]?.CNT ?? rows[0]?.cnt ?? 0);
  const avg = rows[0]?.AVG_RATING ?? rows[0]?.avg_rating;
  const aggregate = avg != null ? Math.round(Number(avg) * 100) / 100 : null;
  return { aggregate, count };
}

export async function getMyRating(eventId, userId) {
  const rows = await query(
    'SELECT rating FROM event_ratings WHERE event_id = ? AND user_id = ?',
    [eventId, userId]
  );
  if (!rows[0]) return { rating: null };
  const r = rows[0].RATING ?? rows[0].rating;
  return { rating: r != null ? Number(r) : null };
}
