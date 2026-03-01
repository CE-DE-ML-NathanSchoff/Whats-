import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import * as userService from '../services/userService.js';
import * as userConfigService from '../services/userConfigService.js';
import * as communityService from '../services/communityService.js';
import * as friendService from '../services/friendService.js';
import * as eventService from '../services/eventService.js';
import * as profileService from '../services/profileService.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

/**
 * GET /users/me — current user profile with location, local_location_ids, and config
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const [local_location_ids, config] = await Promise.all([
      communityService.getLocalLocationIds(req.user.id),
      userConfigService.getConfig(req.user.id),
    ]);
    return res.json({ ...user, local_location_ids, config });
  } catch (err) {
    console.error('Get me error:', err);
    return res.status(500).json({ error: 'Failed to load profile' });
  }
});

/**
 * GET /users/me/communities — list communities the current user is a member of (requires JWT)
 */
router.get('/me/communities', requireAuth, async (req, res) => {
  try {
    const communities = await communityService.listMyCommunities(req.user.id);
    return res.json(communities);
  } catch (err) {
    console.error('List my communities error:', err);
    return res.status(500).json({ error: 'Failed to load your communities' });
  }
});

/**
 * GET /users/me/friend-group — get current user's friend community (create if missing for legacy users)
 */
router.get('/me/friend-group', requireAuth, async (req, res) => {
  try {
    let friendGroup = await communityService.getFriendGroupForUser(req.user.id);
    if (!friendGroup) {
      await communityService.createFriendGroupForUser(req.user.id);
      friendGroup = await communityService.getFriendGroupForUser(req.user.id);
    }
    if (!friendGroup) {
      return res.status(500).json({ error: 'Failed to load friend group' });
    }
    const members = await communityService.getMembers(friendGroup.id, { limit: 500, offset: 0 });
    return res.json({ ...friendGroup, members });
  } catch (err) {
    console.error('Get friend group error:', err);
    return res.status(500).json({ error: 'Failed to load friend group' });
  }
});

/**
 * GET /users/me/friends — list current user's friends (from friend community)
 */
router.get('/me/friends', requireAuth, async (req, res) => {
  try {
    const friends = await friendService.listFriends(req.user.id);
    return res.json(friends);
  } catch (err) {
    console.error('List friends error:', err);
    return res.status(500).json({ error: 'Failed to load friends' });
  }
});

/**
 * GET /users/me/friends/requests — list pending friend requests (incoming)
 */
router.get('/me/friends/requests', requireAuth, async (req, res) => {
  try {
    const requests = await friendService.listPendingRequests(req.user.id);
    return res.json(requests);
  } catch (err) {
    console.error('List friend requests error:', err);
    return res.status(500).json({ error: 'Failed to load friend requests' });
  }
});

/**
 * POST /users/me/friends — send friend request (body: user_id)
 */
router.post(
  '/me/friends',
  requireAuth,
  [body('user_id').isUUID(4).withMessage('user_id required and must be UUID')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const request = await friendService.sendRequest(req.user.id, req.body.user_id);
      return res.status(201).json(request);
    } catch (err) {
      if (err.code === 'SELF_REQUEST') {
        return res.status(400).json({ error: 'Cannot send friend request to yourself' });
      }
      if (err.code === 'PENDING') {
        return res.status(400).json({ error: 'Friend request already pending' });
      }
      if (err.code === 'ALREADY_FRIENDS' || err.code === 'REVERSE_PENDING') {
        return res.status(400).json({ error: err.message });
      }
      console.error('Send friend request error:', err);
      return res.status(500).json({ error: 'Failed to send friend request' });
    }
  }
);

/**
 * POST /users/me/friends/requests/:id/accept — accept a friend request
 */
router.post(
  '/me/friends/requests/:id/accept',
  requireAuth,
  [param('id').isUUID(4).withMessage('Invalid request id')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const result = await friendService.acceptRequest(req.params.id, req.user.id);
      return res.json(result);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Friend request not found' });
      }
      if (err.code === 'FORBIDDEN' || err.code === 'NOT_PENDING') {
        return res.status(400).json({ error: err.message });
      }
      if (err.code === 'FRIEND_GROUP_MISSING') {
        return res.status(500).json({ error: 'Friend group not found' });
      }
      console.error('Accept friend request error:', err);
      return res.status(500).json({ error: 'Failed to accept friend request' });
    }
  }
);

/**
 * POST /users/me/friends/requests/:id/decline — decline a friend request
 */
router.post(
  '/me/friends/requests/:id/decline',
  requireAuth,
  [param('id').isUUID(4).withMessage('Invalid request id')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const result = await friendService.declineRequest(req.params.id, req.user.id);
      return res.json(result);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Friend request not found' });
      }
      if (err.code === 'FORBIDDEN') {
        return res.status(400).json({ error: err.message });
      }
      console.error('Decline friend request error:', err);
      return res.status(500).json({ error: 'Failed to decline friend request' });
    }
  }
);

/**
 * DELETE /users/me/friends/:userId — remove a friend (symmetric: removed from both friend communities)
 */
router.delete(
  '/me/friends/:userId',
  requireAuth,
  [param('userId').isUUID(4).withMessage('Invalid user id')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const result = await friendService.removeFriend(req.user.id, req.params.userId);
      return res.json(result);
    } catch (err) {
      console.error('Remove friend error:', err);
      return res.status(500).json({ error: 'Failed to remove friend' });
    }
  }
);

/**
 * GET /users/:id — get a user's public profile (optional auth). Privacy applied when not owner.
 */
router.get(
  '/:id',
  optionalAuth,
  [param('id').isUUID(4).withMessage('Invalid user id')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const profile = await profileService.getPublicProfile(
        req.params.id,
        req.user?.id
      );
      if (!profile) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json(profile);
    } catch (err) {
      console.error('Get user error:', err);
      return res.status(500).json({ error: 'Failed to load user' });
    }
  }
);

const updateValidators = [
  body('display_name').optional().trim().isLength({ max: 255 }),
  body('bio').optional().trim().isLength({ max: 1000 }),
  body('avatar_url').optional().trim().isLength({ max: 500 }),
  body('phone_number').optional().trim().isLength({ max: 50 }),
];

/**
 * PATCH /users/me — update current user profile (requires JWT)
 */
router.patch('/me', requireAuth, updateValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const user = await userService.updateUser(req.user.id, req.body);
    return res.json(user);
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ error: 'Update failed' });
  }
});

/**
 * GET /users/me/locations — list location communities the user is local to
 */
router.get('/me/locations', requireAuth, async (req, res) => {
  try {
    const locations = await communityService.listLocationCommunitiesForUser(req.user.id);
    return res.json(locations);
  } catch (err) {
    console.error('List my locations error:', err);
    return res.status(500).json({ error: 'Failed to load your locations' });
  }
});

/**
 * POST /users/me/locations — join a location community (body: community_id)
 */
router.post(
  '/me/locations',
  requireAuth,
  [body('community_id').isUUID(4).withMessage('community_id required and must be UUID')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      await communityService.joinLocationCommunity(req.user.id, req.body.community_id);
      const locations = await communityService.listLocationCommunitiesForUser(req.user.id);
      return res.status(201).json(locations);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Community not found' });
      }
      if (err.code === 'NOT_LOCATION') {
        return res.status(400).json({ error: err.message });
      }
      console.error('Join location error:', err);
      return res.status(500).json({ error: 'Failed to join location' });
    }
  }
);

/**
 * DELETE /users/me/locations/:communityId — leave a location community
 */
router.delete(
  '/me/locations/:communityId',
  requireAuth,
  [param('communityId').isUUID(4).withMessage('Invalid community id')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      await communityService.leaveLocationCommunity(req.user.id, req.params.communityId);
      return res.json({ left: true });
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Community not found' });
      }
      if (err.code === 'NOT_LOCATION') {
        return res.status(400).json({ error: err.message });
      }
      console.error('Leave location error:', err);
      return res.status(500).json({ error: 'Failed to leave location' });
    }
  }
);

/**
 * GET /users/me/events — list events the current user has RSVP'd to (with my_rating)
 */
router.get('/me/events', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    const events = await eventService.listEventsAttendedByUser(req.user.id, { limit, offset });
    return res.json(events);
  } catch (err) {
    console.error('List my events error:', err);
    return res.status(500).json({ error: 'Failed to load your events' });
  }
});

/**
 * GET /users/me/ratings — list events the current user has rated
 */
router.get('/me/ratings', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    const ratings = await eventService.listMyEventRatings(req.user.id, { limit, offset });
    return res.json(ratings);
  } catch (err) {
    console.error('List my ratings error:', err);
    return res.status(500).json({ error: 'Failed to load your ratings' });
  }
});

/**
 * GET /users/me/config — get current user's GUI and privacy settings
 */
router.get('/me/config', requireAuth, async (req, res) => {
  try {
    const config = await userConfigService.getConfig(req.user.id);
    return res.json(config);
  } catch (err) {
    console.error('Get config error:', err);
    return res.status(500).json({ error: 'Failed to load config' });
  }
});

/**
 * PATCH /users/me/config — update GUI and/or privacy settings (partial merge)
 */
router.patch(
  '/me/config',
  requireAuth,
  [
    body('gui_settings').optional().isObject(),
    body('privacy_settings').optional().isObject(),
    body('gui_settings.theme').optional().isIn(['system', 'light', 'dark']),
    body('privacy_settings.profile_visibility').optional().isIn(['public', 'friends', 'private']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { gui_settings, privacy_settings } = req.body;
      const updates = {};
      if (gui_settings != null) updates.gui_settings = gui_settings;
      if (privacy_settings != null) updates.privacy_settings = privacy_settings;
      const config = await userConfigService.updateConfig(req.user.id, updates);
      return res.json(config);
    } catch (err) {
      console.error('Update config error:', err);
      return res.status(500).json({ error: 'Failed to update config' });
    }
  }
);

/**
 * POST /users/me/avatar — set avatar: body { url } for custom image URL, or empty / { use_random_color: true } for new random solid color
 */
router.post(
  '/me/avatar',
  requireAuth,
  [body('url').optional().trim().isLength({ max: 500 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { url } = req.body;
      const trimmed = url != null ? String(url).trim() : '';
      const user = await userService.setAvatarUrl(req.user.id, trimmed || null);
      return res.json(user);
    } catch (err) {
      console.error('Set avatar error:', err);
      return res.status(500).json({ error: 'Failed to set avatar' });
    }
  }
);

export default router;
