import { query } from '../config/snowflake.js';
import * as userService from './userService.js';
import * as userConfigService from './userConfigService.js';
import * as friendService from './friendService.js';
import * as communityService from './communityService.js';

/**
 * Get public profile for a user, applying privacy settings for the viewer.
 * @param {string} profileUserId - user whose profile is being viewed
 * @param {string | undefined} viewerId - authenticated viewer (undefined if anonymous)
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function getPublicProfile(profileUserId, viewerId) {
  const user = await userService.findById(profileUserId);
  if (!user) return null;

  const config = await userConfigService.getConfig(profileUserId);
  const privacy = config.privacy_settings || {};
  const isOwner = viewerId === profileUserId;
  const isFriend = viewerId ? await friendService.areFriends(profileUserId, viewerId) : false;

  if (isOwner) {
    const local_communities = await communityService.listLocationCommunitiesForUser(profileUserId);
    const [eventsCount, ratingsCount, friendsCount] = await Promise.all([
      countUserEventRsvps(profileUserId),
      countUserRatings(profileUserId),
      countUserFriends(profileUserId),
    ]);
    return {
      ...user,
      local_communities,
      events_attended_count: eventsCount,
      ratings_count: ratingsCount,
      friends_count: friendsCount,
      config,
    };
  }

  const visibility = privacy.profile_visibility || 'public';
  const canSeeFull = visibility === 'public' || (visibility === 'friends' && isFriend);

  if (!canSeeFull) {
    return {
      id: user.id,
      username: user.username,
      avatar_url: user.avatar_url ?? null,
    };
  }

  const out = {
    id: user.id,
    username: user.username,
    display_name: user.display_name ?? null,
    bio: user.bio ?? null,
    avatar_url: user.avatar_url ?? null,
    location: privacy.show_location !== false ? (user.location ?? null) : null,
    created_at: user.created_at,
  };

  if (privacy.show_location !== false) {
    out.local_communities = await communityService.listLocationCommunitiesForUser(profileUserId);
  }
  if (privacy.show_events_attended !== false) {
    out.events_attended_count = await countUserEventRsvps(profileUserId);
  }
  if (privacy.show_ratings !== false) {
    out.ratings_count = await countUserRatings(profileUserId);
  }
  if (privacy.show_friends_list !== false) {
    out.friends_count = await countUserFriends(profileUserId);
  }

  return out;
}

async function countUserEventRsvps(userId) {
  const rows = await query(
    'SELECT COUNT(*) AS cnt FROM event_rsvps WHERE user_id = ?',
    [userId]
  );
  return Number(rows[0]?.CNT ?? rows[0]?.cnt ?? 0);
}

async function countUserRatings(userId) {
  const rows = await query(
    'SELECT COUNT(*) AS cnt FROM event_ratings WHERE user_id = ?',
    [userId]
  );
  return Number(rows[0]?.CNT ?? rows[0]?.cnt ?? 0);
}

async function countUserFriends(userId) {
  const friends = await friendService.listFriends(userId);
  return friends.length;
}
