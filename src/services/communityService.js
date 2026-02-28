import { query, execute } from '../config/snowflake.js';

/**
 * Map a Snowflake row to a community object (camelCase).
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown> | null}
 */
function rowToCommunity(row) {
  if (!row) return null;
  const id = row.ID ?? row.id;
  const name = row.NAME ?? row.name;
  const slug = row.SLUG ?? row.slug;
  const type = row.TYPE ?? row.type;
  const parent_id = row.PARENT_ID ?? row.parent_id;
  const founder_id = row.FOUNDER_ID ?? row.founder_id;
  const is_friend_group = row.IS_FRIEND_GROUP ?? row.is_friend_group;
  const description = row.DESCRIPTION ?? row.description;
  const profile_data = row.PROFILE_DATA ?? row.profile_data;
  const is_active = row.IS_ACTIVE ?? row.is_active;
  const created_at = row.CREATED_AT ?? row.created_at;
  const updated_at = row.UPDATED_AT ?? row.updated_at;
  return {
    id,
    name,
    slug,
    type,
    parent_id: parent_id ?? null,
    founder_id: founder_id ?? null,
    is_friend_group: is_friend_group ?? false,
    description: description ?? null,
    profile_data: profile_data ?? null,
    is_active: is_active ?? true,
    created_at,
    updated_at,
  };
}

/**
 * Map a Snowflake row to a community_member object.
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown> | null}
 */
function rowToMember(row) {
  if (!row) return null;
  const community_id = row.COMMUNITY_ID ?? row.community_id;
  const user_id = row.USER_ID ?? row.user_id;
  const role = row.ROLE ?? row.role;
  const joined_at = row.JOINED_AT ?? row.joined_at;
  return {
    community_id,
    user_id,
    role,
    joined_at,
  };
}

/**
 * Get community by id. Returns null if not found or inactive (for Sub).
 * @param {string} id
 * @param {{ includeInactive?: boolean }} [opts]
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function getById(id, opts = {}) {
  let sql = `
    SELECT id, name, slug, type, parent_id, founder_id, is_friend_group, description, profile_data, is_active, created_at, updated_at
    FROM communities WHERE id = ?
  `;
  const binds = [id];
  if (!opts.includeInactive) {
    sql += ' AND is_active = TRUE';
  }
  const rows = await query(sql, binds);
  const community = rows[0] ? rowToCommunity(rows[0]) : null;
  if (!community) return null;
  const countRows = await query(
    'SELECT COUNT(*) AS cnt FROM community_members WHERE community_id = ?',
    [id]
  );
  const cnt = countRows[0]?.CNT ?? countRows[0]?.cnt ?? 0;
  return { ...community, member_count: Number(cnt) };
}

/**
 * Get community by slug.
 * @param {string} slug
 * @param {{ includeInactive?: boolean }} [opts]
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function getBySlug(slug, opts = {}) {
  let sql = `
    SELECT id, name, slug, type, parent_id, founder_id, is_friend_group, description, profile_data, is_active, created_at, updated_at
    FROM communities WHERE slug = ?
  `;
  const binds = [slug];
  if (!opts.includeInactive) {
    sql += ' AND is_active = TRUE';
  }
  const rows = await query(sql, binds);
  if (!rows[0]) return null;
  return getById(rows[0].ID ?? rows[0].id, opts);
}

/**
 * List communities with optional filters.
 * When type is PRIVATE, only communities the user is a member of are returned (userId required).
 * When type is not set and userId is set, includes PRIVATE communities where user is member.
 * @param {{ type?: string, parent_id?: string, activeOnly?: boolean, userId?: string }} [filters]
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function listCommunities(filters = {}) {
  const { type, parent_id, activeOnly = true, userId } = filters;
  const conditions = [];
  const binds = [];
  if (type) {
    if (type === 'PRIVATE') {
      if (userId) {
        conditions.push("c.type = 'PRIVATE'");
        conditions.push('EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = c.id AND m.user_id = ?)');
        binds.push(userId);
      } else {
        conditions.push('1 = 0');
      }
    } else {
      conditions.push('c.type = ?');
      binds.push(type);
    }
  } else {
    if (userId) {
      conditions.push("(c.type IN ('LOCATION','SUB') OR (c.type = 'PRIVATE' AND EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = c.id AND m.user_id = ?)))");
      binds.push(userId);
    } else {
      conditions.push("c.type IN ('LOCATION','SUB')");
    }
  }
  if (parent_id !== undefined && parent_id !== null) {
    conditions.push('c.parent_id = ?');
    binds.push(parent_id);
  }
  if (activeOnly) {
    conditions.push('c.is_active = TRUE');
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT c.id, c.name, c.slug, c.type, c.parent_id, c.founder_id, c.is_friend_group, c.description, c.profile_data, c.is_active, c.created_at, c.updated_at,
           (SELECT COUNT(*) FROM community_members m WHERE m.community_id = c.id) AS member_count
    FROM communities c
    ${where}
    ORDER BY c.name
  `;
  const rows = await query(sql, binds);
  return rows.map((r) => {
    const c = rowToCommunity(r);
    const cnt = r.MEMBER_COUNT ?? r.member_count ?? 0;
    return { ...c, member_count: Number(cnt) };
  });
}

/**
 * Create a Sub-Community. Caller must be a member of the parent Location.
 * @param {string} userId
 * @param {{ name: string, slug: string, parent_id: string, description?: string, profile_data?: object }} data
 * @returns {Promise<Record<string, unknown>>}
 */
export async function createSubCommunity(userId, data) {
  const { name, slug, parent_id, description, profile_data } = data;

  const parentRows = await query(
    "SELECT id FROM communities WHERE id = ? AND type = 'LOCATION' AND is_active = TRUE",
    [parent_id]
  );
  if (!parentRows.length) {
    const err = new Error('Parent community not found or is not a Location');
    err.code = 'PARENT_NOT_LOCATION';
    throw err;
  }

  const memberRows = await query(
    'SELECT 1 FROM community_members WHERE community_id = ? AND user_id = ?',
    [parent_id, userId]
  );
  if (!memberRows.length) {
    const err = new Error('You must be a member of the Location to create a sub-community');
    err.code = 'NOT_LOCAL';
    throw err;
  }

  const slugRows = await query('SELECT 1 FROM communities WHERE slug = ?', [slug]);
  if (slugRows.length) {
    const err = new Error('Slug already in use');
    err.code = 'SLUG_TAKEN';
    throw err;
  }

  const profileJson = profile_data != null ? JSON.stringify(profile_data) : null;
  const sql = `
    INSERT INTO communities (name, slug, type, parent_id, description, profile_data)
    VALUES (?, ?, 'SUB', ?, ?, PARSE_JSON(?))
  `;
  await execute(sql, [
    name,
    slug,
    parent_id,
    description || null,
    profileJson ?? 'null',
  ]);

  const created = await query(
    'SELECT id, name, slug, type, parent_id, description, profile_data, is_active, created_at, updated_at FROM communities WHERE slug = ?',
    [slug]
  );
  const community = rowToCommunity(created[0]);
  const communityId = community.id;

  await execute(
    'INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)',
    [communityId, userId, 'moderator']
  );

  return getById(communityId);
}

/**
 * Create the default friend community for a user (one per user). Called at signup.
 * @param {string} userId
 * @returns {Promise<Record<string, unknown>>}
 */
export async function createFriendGroupForUser(userId) {
  const userRows = await query('SELECT username FROM users WHERE id = ?', [userId]);
  const username = userRows[0]?.USERNAME ?? userRows[0]?.username ?? 'User';
  const name = `${username}'s friends`;
  const slug = `friends-${userId}`;

  const profileJson = null;
  const sql = `
    INSERT INTO communities (name, slug, type, parent_id, founder_id, is_friend_group, description, profile_data)
    VALUES (?, ?, 'PRIVATE', NULL, ?, TRUE, NULL, PARSE_JSON(?))
  `;
  await execute(sql, [name, slug, userId, profileJson ?? 'null']);

  const created = await query(
    'SELECT id, name, slug, type, parent_id, founder_id, is_friend_group, description, profile_data, is_active, created_at, updated_at FROM communities WHERE slug = ?',
    [slug]
  );
  const community = rowToCommunity(created[0]);
  const communityId = community.id;
  await execute(
    'INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)',
    [communityId, userId, 'owner']
  );
  return getById(communityId);
}

/**
 * Get the friend community for a user (the default private community with is_friend_group = true).
 * @param {string} userId
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function getFriendGroupForUser(userId) {
  const rows = await query(
    `SELECT id, name, slug, type, parent_id, founder_id, is_friend_group, description, profile_data, is_active, created_at, updated_at
     FROM communities WHERE founder_id = ? AND is_friend_group = TRUE AND is_active = TRUE`,
    [userId]
  );
  if (!rows[0]) return null;
  return getById(rows[0].ID ?? rows[0].id);
}

/**
 * Create a private community. Caller becomes founder/owner. Optional parent_ids (user must be member of each).
 * @param {string} userId
 * @param {{ name: string, slug: string, description?: string, profile_data?: object, parent_ids?: string[] }} data
 * @returns {Promise<Record<string, unknown>>}
 */
export async function createPrivateCommunity(userId, data) {
  const { name, slug, description, profile_data, parent_ids = [] } = data;

  const slugRows = await query('SELECT 1 FROM communities WHERE slug = ?', [slug]);
  if (slugRows.length) {
    const err = new Error('Slug already in use');
    err.code = 'SLUG_TAKEN';
    throw err;
  }

  for (const parentId of parent_ids) {
    const parentRows = await query(
      'SELECT 1 FROM communities WHERE id = ? AND is_active = TRUE',
      [parentId]
    );
    if (!parentRows.length) {
      const err = new Error('Parent community not found or inactive');
      err.code = 'PARENT_NOT_FOUND';
      throw err;
    }
    const memberRows = await query(
      'SELECT 1 FROM community_members WHERE community_id = ? AND user_id = ?',
      [parentId, userId]
    );
    if (!memberRows.length) {
      const err = new Error('You must be a member of every parent community');
      err.code = 'NOT_MEMBER_OF_PARENT';
      throw err;
    }
  }

  const profileJson = profile_data != null ? JSON.stringify(profile_data) : null;
  const sql = `
    INSERT INTO communities (name, slug, type, parent_id, founder_id, is_friend_group, description, profile_data)
    VALUES (?, ?, 'PRIVATE', NULL, ?, FALSE, ?, PARSE_JSON(?))
  `;
  await execute(sql, [name, slug, userId, description || null, profileJson ?? 'null']);

  const created = await query(
    'SELECT id, name, slug, type, parent_id, founder_id, is_friend_group, description, profile_data, is_active, created_at, updated_at FROM communities WHERE slug = ?',
    [slug]
  );
  const community = rowToCommunity(created[0]);
  const communityId = community.id;

  for (const parentId of parent_ids) {
    await execute('INSERT INTO community_parents (community_id, parent_id) VALUES (?, ?)', [communityId, parentId]);
  }

  await execute(
    'INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)',
    [communityId, userId, 'owner']
  );
  return getById(communityId);
}

/**
 * Invite a user to a private community (founder only). Invitee by user_id or email.
 * @param {string} communityId
 * @param {string} inviterId (must be founder)
 * @param {{ user_id?: string, email?: string }} target
 * @returns {Promise<Record<string, unknown>>}
 */
export async function inviteToCommunity(communityId, inviterId, target) {
  const community = await getById(communityId, { includeInactive: true });
  if (!community || community.type !== 'PRIVATE') {
    const err = new Error('Community not found or is not private');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (community.founder_id !== inviterId) {
    const err = new Error('Only the founder can invite members');
    err.code = 'NOT_FOUNDER';
    throw err;
  }
  let inviteeId = target.user_id;
  if (!inviteeId && target.email) {
    const userRows = await query('SELECT id FROM users WHERE email = ? AND is_active = TRUE', [target.email]);
    if (!userRows.length) {
      const err = new Error('User not found');
      err.code = 'USER_NOT_FOUND';
      throw err;
    }
    inviteeId = userRows[0].ID ?? userRows[0].id;
  }
  if (!inviteeId) {
    const err = new Error('user_id or email required');
    err.code = 'INVALID_INPUT';
    throw err;
  }
  const existingMember = await query(
    'SELECT 1 FROM community_members WHERE community_id = ? AND user_id = ?',
    [communityId, inviteeId]
  );
  if (existingMember.length) {
    const err = new Error('User is already a member');
    err.code = 'ALREADY_MEMBER';
    throw err;
  }
  const existing = await query(
    'SELECT id, status FROM community_invites WHERE community_id = ? AND invitee_id = ?',
    [communityId, inviteeId]
  );
  if (existing.length) {
    const status = existing[0].STATUS ?? existing[0].status;
    if (status === 'pending') {
      const err = new Error('Invite already pending');
      err.code = 'INVITE_PENDING';
      throw err;
    }
  }
  await execute(
    'DELETE FROM community_invites WHERE community_id = ? AND invitee_id = ?',
    [communityId, inviteeId]
  );
  await execute(
    'INSERT INTO community_invites (community_id, inviter_id, invitee_id, status) VALUES (?, ?, ?, \'pending\')',
    [communityId, inviterId, inviteeId]
  );
  const rows = await query(
    'SELECT id, community_id, inviter_id, invitee_id, status, created_at FROM community_invites WHERE community_id = ? AND invitee_id = ?',
    [communityId, inviteeId]
  );
  const r = rows[0];
  return {
    id: r.ID ?? r.id,
    community_id: r.COMMUNITY_ID ?? r.community_id,
    inviter_id: r.INVITER_ID ?? r.inviter_id,
    invitee_id: r.INVITEE_ID ?? r.invitee_id,
    status: r.STATUS ?? r.status,
    created_at: r.CREATED_AT ?? r.created_at,
  };
}

/**
 * Get invite by id.
 * @param {string} inviteId
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function getInviteById(inviteId) {
  const rows = await query(
    'SELECT id, community_id, inviter_id, invitee_id, status, created_at FROM community_invites WHERE id = ?',
    [inviteId]
  );
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    id: r.ID ?? r.id,
    community_id: r.COMMUNITY_ID ?? r.community_id,
    inviter_id: r.INVITER_ID ?? r.inviter_id,
    invitee_id: r.INVITEE_ID ?? r.invitee_id,
    status: r.STATUS ?? r.status,
    created_at: r.CREATED_AT ?? r.created_at,
  };
}

/**
 * Accept a community invite (invitee only).
 * @param {string} inviteId
 * @param {string} userId (must be invitee)
 * @returns {Promise<Record<string, unknown>>}
 */
export async function acceptInvite(inviteId, userId) {
  const invite = await getInviteById(inviteId);
  if (!invite) {
    const err = new Error('Invite not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (invite.invitee_id !== userId) {
    const err = new Error('You can only accept invites sent to you');
    err.code = 'FORBIDDEN';
    throw err;
  }
  if (invite.status !== 'pending') {
    const err = new Error('Invite is no longer pending');
    err.code = 'INVITE_INVALID';
    throw err;
  }
  await execute(
    'INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)',
    [invite.community_id, userId, 'member']
  );
  await execute("UPDATE community_invites SET status = 'accepted' WHERE id = ?", [inviteId]);
  return getById(invite.community_id);
}

/**
 * Decline a community invite (invitee only).
 * @param {string} inviteId
 * @param {string} userId (must be invitee)
 * @returns {Promise<{ declined: boolean }>}
 */
export async function declineInvite(inviteId, userId) {
  const invite = await getInviteById(inviteId);
  if (!invite) {
    const err = new Error('Invite not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (invite.invitee_id !== userId) {
    const err = new Error('You can only decline invites sent to you');
    err.code = 'FORBIDDEN';
    throw err;
  }
  await execute("UPDATE community_invites SET status = 'declined' WHERE id = ?", [inviteId]);
  return { declined: true };
}

/**
 * List pending community invites for a user (invitee).
 * @param {string} userId
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function getPendingInvitesForUser(userId) {
  const rows = await query(
    `SELECT i.id, i.community_id, i.inviter_id, i.invitee_id, i.status, i.created_at,
            c.name AS community_name, c.slug AS community_slug,
            u.username AS inviter_username, u.display_name AS inviter_display_name
     FROM community_invites i
     JOIN communities c ON c.id = i.community_id AND c.is_active = TRUE
     JOIN users u ON u.id = i.inviter_id AND u.is_active = TRUE
     WHERE i.invitee_id = ? AND i.status = 'pending'
     ORDER BY i.created_at DESC`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.ID ?? r.id,
    community_id: r.COMMUNITY_ID ?? r.community_id,
    inviter_id: r.INVITER_ID ?? r.inviter_id,
    invitee_id: r.INVITEE_ID ?? r.invitee_id,
    status: r.STATUS ?? r.status,
    created_at: r.CREATED_AT ?? r.created_at,
    community_name: r.COMMUNITY_NAME ?? r.community_name,
    community_slug: r.COMMUNITY_SLUG ?? r.community_slug,
    inviter_username: r.INVITER_USERNAME ?? r.inviter_username,
    inviter_display_name: r.INVITER_DISPLAY_NAME ?? r.inviter_display_name,
  }));
}

/**
 * Remove a member from a private community (founder only). Cannot remove self (founder).
 * @param {string} communityId
 * @param {string} actorId (must be founder)
 * @param {string} memberUserId
 * @returns {Promise<{ removed: boolean }>}
 */
export async function removeMember(communityId, actorId, memberUserId) {
  const community = await getById(communityId, { includeInactive: true });
  if (!community || community.type !== 'PRIVATE') {
    const err = new Error('Community not found or is not private');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (community.founder_id !== actorId) {
    const err = new Error('Only the founder can remove members');
    err.code = 'NOT_FOUNDER';
    throw err;
  }
  if (community.founder_id === memberUserId) {
    const err = new Error('Founder cannot be removed; use leave to delete the community');
    err.code = 'CANNOT_REMOVE_FOUNDER';
    throw err;
  }
  const result = await execute(
    'DELETE FROM community_members WHERE community_id = ? AND user_id = ?',
    [communityId, memberUserId]
  );
  return { removed: true };
}

/**
 * Join a community. No-op if already a member. Private communities are invite-only (use acceptInvite).
 * @param {string} userId
 * @param {string} communityId
 * @returns {Promise<{ joined: boolean, community: Record<string, unknown> }>}
 */
export async function join(userId, communityId) {
  const community = await getById(communityId);
  if (!community) {
    const err = new Error('Community not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (community.type === 'PRIVATE') {
    const err = new Error('Private communities are invite-only');
    err.code = 'PRIVATE_INVITE_ONLY';
    throw err;
  }

  const existing = await query(
    'SELECT 1 FROM community_members WHERE community_id = ? AND user_id = ?',
    [communityId, userId]
  );
  if (existing.length) {
    return { joined: false, community };
  }

  await execute(
    'INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)',
    [communityId, userId, 'member']
  );
  return { joined: true, community: await getById(communityId) };
}

/**
 * Leave a community. Friend group founder cannot leave. Private founder leaving deletes the community.
 * If Sub and last member, mark community inactive.
 * @param {string} userId
 * @param {string} communityId
 * @returns {Promise<{ left: boolean }>}
 */
export async function leave(userId, communityId) {
  const community = await getById(communityId, { includeInactive: true });
  if (!community) {
    const err = new Error('Community not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (community.type === 'PRIVATE' && community.is_friend_group && community.founder_id === userId) {
    const err = new Error('You cannot leave your friend community');
    err.code = 'CANNOT_LEAVE_FRIEND_GROUP';
    throw err;
  }

  const wasMember = await isMember(userId, communityId);
  if (wasMember) {
    await execute(
      'DELETE FROM community_members WHERE community_id = ? AND user_id = ?',
      [communityId, userId]
    );
  }
  const left = wasMember;

  if (left && community.type === 'PRIVATE' && community.founder_id === userId) {
    await execute('DELETE FROM community_invites WHERE community_id = ?', [communityId]);
    await execute('DELETE FROM community_members WHERE community_id = ?', [communityId]);
    await execute('DELETE FROM community_parents WHERE community_id = ?', [communityId]);
    await execute('DELETE FROM communities WHERE id = ?', [communityId]);
    return { left: true };
  }

  if (left && community.type === 'SUB') {
    const countRows = await query(
      'SELECT COUNT(*) AS cnt FROM community_members WHERE community_id = ?',
      [communityId]
    );
    const cnt = Number(countRows[0]?.CNT ?? countRows[0]?.cnt ?? 0);
    if (cnt === 0) {
      await execute('UPDATE communities SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP() WHERE id = ?', [
        communityId,
      ]);
    }
  }

  return { left };
}

/**
 * Add a user to a community as member (internal use e.g. friend acceptance). No duplicate check.
 * @param {string} communityId
 * @param {string} userId
 * @param {string} [role='member']
 * @returns {Promise<void>}
 */
export async function addMember(communityId, userId, role = 'member') {
  await execute(
    'INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)',
    [communityId, userId, role]
  );
}

/**
 * Remove a user from a community (internal use e.g. remove friend). No permission check.
 * @param {string} communityId
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function removeMemberFromCommunity(communityId, userId) {
  await execute(
    'DELETE FROM community_members WHERE community_id = ? AND user_id = ?',
    [communityId, userId]
  );
}

/**
 * Check if user is a member of a community.
 * @param {string} userId
 * @param {string} communityId
 * @returns {Promise<boolean>}
 */
export async function isMember(userId, communityId) {
  const rows = await query(
    'SELECT 1 FROM community_members WHERE community_id = ? AND user_id = ?',
    [communityId, userId]
  );
  return rows.length > 0;
}

/**
 * Check if user is "Local" for a Location (is a member of that Location).
 * @param {string} userId
 * @param {string} locationId
 * @returns {Promise<boolean>}
 */
export async function isLocal(userId, locationId) {
  return isMember(userId, locationId);
}

/**
 * Get members of a community with optional pagination.
 * @param {string} communityId
 * @param {{ limit?: number, offset?: number }} [pagination]
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function getMembers(communityId, pagination = {}) {
  const { limit = 50, offset = 0 } = pagination;
  const sql = `
    SELECT cm.community_id, cm.user_id, cm.role, cm.joined_at,
           u.username, u.display_name, u.avatar_url
    FROM community_members cm
    JOIN users u ON u.id = cm.user_id AND u.is_active = TRUE
    WHERE cm.community_id = ?
    ORDER BY cm.joined_at ASC
    LIMIT ? OFFSET ?
  `;
  const rows = await query(sql, [communityId, limit, offset]);
  return rows.map((r) => ({
    community_id: r.COMMUNITY_ID ?? r.community_id,
    user_id: r.USER_ID ?? r.user_id,
    role: r.ROLE ?? r.role,
    joined_at: r.JOINED_AT ?? r.joined_at,
    username: r.USERNAME ?? r.username,
    display_name: r.DISPLAY_NAME ?? r.display_name,
    avatar_url: r.AVATAR_URL ?? r.avatar_url,
  }));
}

/**
 * Update community. Private: founder only, can update name, slug, description, profile_data, parent_ids.
 * Sub: moderator only, description and profile_data. Locations are dev-only.
 * @param {string} communityId
 * @param {string} userId
 * @param {{ description?: string, profile_data?: object, name?: string, slug?: string, parent_ids?: string[] }} updates
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function updateCommunity(communityId, userId, updates) {
  const community = await getById(communityId, { includeInactive: true });
  if (!community) {
    const err = new Error('Community not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (community.type === 'LOCATION') {
    const err = new Error('Locations can only be updated by developers');
    err.code = 'LOCATION_READONLY';
    throw err;
  }

  const isPrivateFounder = community.type === 'PRIVATE' && community.founder_id === userId;
  if (community.type === 'PRIVATE') {
    if (!isPrivateFounder) {
      const err = new Error('Only the founder can update this community');
      err.code = 'NOT_FOUNDER';
      throw err;
    }
  } else {
    const memberRows = await query(
      'SELECT role FROM community_members WHERE community_id = ? AND user_id = ?',
      [communityId, userId]
    );
    if (!memberRows.length) {
      const err = new Error('You are not a member of this community');
      err.code = 'NOT_MEMBER';
      throw err;
    }
    const role = memberRows[0].ROLE ?? memberRows[0].role;
    if (role !== 'moderator') {
      const err = new Error('Only moderators can update the community profile');
      err.code = 'NOT_MODERATOR';
      throw err;
    }
  }

  const setClauses = [];
  const values = [];
  if (updates.description !== undefined) {
    setClauses.push('description = ?');
    values.push(updates.description);
  }
  if (updates.profile_data !== undefined) {
    setClauses.push('profile_data = PARSE_JSON(?)');
    values.push(JSON.stringify(updates.profile_data));
  }
  if (isPrivateFounder && updates.name !== undefined) {
    setClauses.push('name = ?');
    values.push(updates.name);
  }
  if (isPrivateFounder && updates.slug !== undefined) {
    if (updates.slug !== community.slug) {
      const slugRows = await query('SELECT 1 FROM communities WHERE slug = ? AND id != ?', [updates.slug, communityId]);
      if (slugRows.length) {
        const err = new Error('Slug already in use');
        err.code = 'SLUG_TAKEN';
        throw err;
      }
    }
    setClauses.push('slug = ?');
    values.push(updates.slug);
  }
  if (setClauses.length > 0) {
    setClauses.push('updated_at = CURRENT_TIMESTAMP()');
    values.push(communityId);
    await execute(`UPDATE communities SET ${setClauses.join(', ')} WHERE id = ?`, values);
  }

  if (isPrivateFounder && updates.parent_ids !== undefined) {
    await execute('DELETE FROM community_parents WHERE community_id = ?', [communityId]);
    for (const parentId of updates.parent_ids) {
      const parentRows = await query('SELECT 1 FROM communities WHERE id = ? AND is_active = TRUE', [parentId]);
      if (parentRows.length) {
        const memberRows = await query(
          'SELECT 1 FROM community_members WHERE community_id = ? AND user_id = ?',
          [parentId, userId]
        );
        if (memberRows.length) {
          await execute('INSERT INTO community_parents (community_id, parent_id) VALUES (?, ?)', [communityId, parentId]);
        }
      }
    }
  }
  return getById(communityId);
}

/**
 * List communities the current user is a member of.
 * @param {string} userId
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function listMyCommunities(userId) {
  const sql = `
    SELECT c.id, c.name, c.slug, c.type, c.parent_id, c.founder_id, c.is_friend_group, c.description, c.profile_data, c.is_active, c.created_at, c.updated_at,
           cm.role, cm.joined_at,
           (SELECT COUNT(*) FROM community_members m WHERE m.community_id = c.id) AS member_count
    FROM communities c
    JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = ?
    WHERE c.is_active = TRUE
    ORDER BY c.type, c.name
  `;
  const rows = await query(sql, [userId]);
  return rows.map((r) => {
    const c = rowToCommunity(r);
    return {
      ...c,
      role: r.ROLE ?? r.role,
      joined_at: r.JOINED_AT ?? r.joined_at,
      member_count: Number(r.MEMBER_COUNT ?? r.member_count ?? 0),
    };
  });
}

/**
 * Get Location ids the user is a member of (for "Local" designation).
 * @param {string} userId
 * @returns {Promise<string[]>}
 */
export async function getLocalLocationIds(userId) {
  const rows = await query(
    `SELECT c.id FROM communities c
     JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = ?
     WHERE c.type = 'LOCATION' AND c.is_active = TRUE`,
    [userId]
  );
  return rows.map((r) => r.ID ?? r.id);
}

/**
 * Get local status for a user in a community (for Locations: is_member = is_local).
 * @param {string} userId
 * @param {string} communityId
 * @returns {Promise<{ is_member: boolean, is_local: boolean }>}
 */
export async function getLocalStatus(userId, communityId) {
  const community = await getById(communityId);
  if (!community) {
    return { is_member: false, is_local: false };
  }
  const is_member = await isMember(userId, communityId);
  const is_local = community.type === 'LOCATION' ? is_member : await isLocal(userId, community.parent_id);
  return { is_member, is_local };
}
