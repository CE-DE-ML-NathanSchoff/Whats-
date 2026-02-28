import { query, execute } from '../config/snowflake.js';
import * as communityService from './communityService.js';

/**
 * Send a friend request (requester = current user, addressee = target user).
 * @param {string} requesterId
 * @param {string} addresseeId
 * @returns {Promise<Record<string, unknown>>}
 */
export async function sendRequest(requesterId, addresseeId) {
  if (requesterId === addresseeId) {
    const err = new Error('Cannot send friend request to yourself');
    err.code = 'SELF_REQUEST';
    throw err;
  }
  const existing = await query(
    'SELECT id, status FROM friendships WHERE requester_id = ? AND addressee_id = ?',
    [requesterId, addresseeId]
  );
  if (existing.length) {
    const status = existing[0].STATUS ?? existing[0].status;
    if (status === 'pending') {
      const err = new Error('Friend request already pending');
      err.code = 'PENDING';
      throw err;
    }
    if (status === 'accepted') {
      const err = new Error('Already friends');
      err.code = 'ALREADY_FRIENDS';
      throw err;
    }
  }
  const reverse = await query(
    'SELECT id, status FROM friendships WHERE requester_id = ? AND addressee_id = ?',
    [addresseeId, requesterId]
  );
  if (reverse.length) {
    const status = reverse[0].STATUS ?? reverse[0].status;
    if (status === 'pending') {
      const err = new Error('This user has already sent you a friend request');
      err.code = 'REVERSE_PENDING';
      throw err;
    }
    if (status === 'accepted') {
      const err = new Error('Already friends');
      err.code = 'ALREADY_FRIENDS';
      throw err;
    }
  }
  await execute(
    'DELETE FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)',
    [requesterId, addresseeId, addresseeId, requesterId]
  );
  await execute(
    'INSERT INTO friendships (requester_id, addressee_id, status) VALUES (?, ?, \'pending\')',
    [requesterId, addresseeId]
  );
  const rows = await query(
    'SELECT id, requester_id, addressee_id, status, created_at FROM friendships WHERE requester_id = ? AND addressee_id = ?',
    [requesterId, addresseeId]
  );
  const r = rows[0];
  return {
    id: r.ID ?? r.id,
    requester_id: r.REQUESTER_ID ?? r.requester_id,
    addressee_id: r.ADDRESSEE_ID ?? r.addressee_id,
    status: r.STATUS ?? r.status,
    created_at: r.CREATED_AT ?? r.created_at,
  };
}

/**
 * Accept a friend request. Add both users to each other's friend communities.
 * @param {string} requestId - friendship id
 * @param {string} accepteeId - user accepting (must be addressee)
 * @returns {Promise<Record<string, unknown>>}
 */
export async function acceptRequest(requestId, accepteeId) {
  const rows = await query(
    'SELECT id, requester_id, addressee_id, status FROM friendships WHERE id = ?',
    [requestId]
  );
  if (!rows[0]) {
    const err = new Error('Friend request not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  const r = rows[0];
  const requesterId = r.REQUESTER_ID ?? r.requester_id;
  const addresseeId = r.ADDRESSEE_ID ?? r.addressee_id;
  const status = r.STATUS ?? r.status;
  if (addresseeId !== accepteeId) {
    const err = new Error('You can only accept requests sent to you');
    err.code = 'FORBIDDEN';
    throw err;
  }
  if (status !== 'pending') {
    const err = new Error('Request is no longer pending');
    err.code = 'NOT_PENDING';
    throw err;
  }
  await execute("UPDATE friendships SET status = 'accepted' WHERE id = ?", [requestId]);

  const requesterFriendGroup = await communityService.getFriendGroupForUser(requesterId);
  const addresseeFriendGroup = await communityService.getFriendGroupForUser(addresseeId);
  if (!requesterFriendGroup || !addresseeFriendGroup) {
    const err = new Error('Friend group not found for user');
    err.code = 'FRIEND_GROUP_MISSING';
    throw err;
  }
  const alreadyInRequester = await communityService.isMember(addresseeId, requesterFriendGroup.id);
  if (!alreadyInRequester) {
    await communityService.addMember(requesterFriendGroup.id, addresseeId, 'member');
  }
  const alreadyInAddressee = await communityService.isMember(requesterId, addresseeFriendGroup.id);
  if (!alreadyInAddressee) {
    await communityService.addMember(addresseeFriendGroup.id, requesterId, 'member');
  }

  return {
    id: requestId,
    requester_id: requesterId,
    addressee_id: addresseeId,
    status: 'accepted',
  };
}

/**
 * Decline a friend request.
 * @param {string} requestId
 * @param {string} userId - must be addressee
 * @returns {Promise<{ declined: boolean }>}
 */
export async function declineRequest(requestId, userId) {
  const rows = await query(
    'SELECT addressee_id, status FROM friendships WHERE id = ?',
    [requestId]
  );
  if (!rows[0]) {
    const err = new Error('Friend request not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  const addresseeId = rows[0].ADDRESSEE_ID ?? rows[0].addressee_id;
  if (addresseeId !== userId) {
    const err = new Error('You can only decline requests sent to you');
    err.code = 'FORBIDDEN';
    throw err;
  }
  await execute("UPDATE friendships SET status = 'declined' WHERE id = ?", [requestId]);
  return { declined: true };
}

/**
 * List pending friend requests for the current user (where they are the addressee).
 * @param {string} userId
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function listPendingRequests(userId) {
  const rows = await query(
    `SELECT f.id, f.requester_id, f.addressee_id, f.status, f.created_at,
            u.username AS requester_username, u.display_name AS requester_display_name
     FROM friendships f
     JOIN users u ON u.id = f.requester_id AND u.is_active = TRUE
     WHERE f.addressee_id = ? AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.ID ?? r.id,
    requester_id: r.REQUESTER_ID ?? r.requester_id,
    addressee_id: r.ADDRESSEE_ID ?? r.addressee_id,
    status: r.STATUS ?? r.status,
    created_at: r.CREATED_AT ?? r.created_at,
    requester_username: r.REQUESTER_USERNAME ?? r.requester_username,
    requester_display_name: r.REQUESTER_DISPLAY_NAME ?? r.requester_display_name,
  }));
}

/**
 * List friends for a user (members of their friend community, excluding self).
 * @param {string} userId
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function listFriends(userId) {
  const friendGroup = await communityService.getFriendGroupForUser(userId);
  if (!friendGroup) return [];
  const members = await communityService.getMembers(friendGroup.id, { limit: 500, offset: 0 });
  return members.filter((m) => m.user_id !== userId);
}

/**
 * Remove a friend: remove from both users' friend communities (symmetric) and update/delete friendship.
 * @param {string} userId - current user
 * @param {string} friendUserId - friend to remove
 * @returns {Promise<{ removed: boolean }>}
 */
export async function removeFriend(userId, friendUserId) {
  const myFriendGroup = await communityService.getFriendGroupForUser(userId);
  const theirFriendGroup = await communityService.getFriendGroupForUser(friendUserId);
  if (myFriendGroup) {
    await communityService.removeMemberFromCommunity(myFriendGroup.id, friendUserId);
  }
  if (theirFriendGroup) {
    await communityService.removeMemberFromCommunity(theirFriendGroup.id, userId);
  }
  await execute(
    'DELETE FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)',
    [userId, friendUserId, friendUserId, userId]
  );
  return { removed: true };
}
