import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import * as communityService from '../services/communityService.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * GET /communities — list communities (filter by type, parent_id, activeOnly).
 * When authenticated, PRIVATE communities are filtered to those the user is a member of.
 */
router.get(
  '/',
  optionalAuth,
  [
    query('type').optional().isIn(['LOCATION', 'SUB', 'PRIVATE']).withMessage('type must be LOCATION, SUB, or PRIVATE'),
    query('parent_id').optional().isUUID(4).withMessage('Invalid parent_id'),
    query('active_only').optional().isBoolean().withMessage('active_only must be boolean'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const activeOnly = req.query.active_only !== 'false';
      const filters = {
        type: req.query.type || undefined,
        parent_id: req.query.parent_id || undefined,
        activeOnly,
        userId: req.user?.id,
      };
      const communities = await communityService.listCommunities(filters);
      return res.json(communities);
    } catch (err) {
      console.error('List communities error:', err);
      return res.status(500).json({ error: 'Failed to list communities' });
    }
  }
);

/**
 * GET /communities/invites — list pending invites for the current user (auth required)
 */
router.get('/invites', requireAuth, async (req, res) => {
  try {
    const invites = await communityService.getPendingInvitesForUser(req.user.id);
    return res.json(invites);
  } catch (err) {
    console.error('List invites error:', err);
    return res.status(500).json({ error: 'Failed to list invites' });
  }
});

/**
 * POST /communities/invites/:inviteId/accept — accept a community invite (auth required)
 */
router.post(
  '/invites/:inviteId/accept',
  requireAuth,
  param('inviteId').isUUID(4).withMessage('Invalid invite id'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const community = await communityService.acceptInvite(req.params.inviteId, req.user.id);
      return res.json(community);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Invite not found' });
      }
      if (err.code === 'FORBIDDEN' || err.code === 'INVITE_INVALID') {
        return res.status(400).json({ error: err.message });
      }
      console.error('Accept invite error:', err);
      return res.status(500).json({ error: 'Failed to accept invite' });
    }
  }
);

/**
 * POST /communities/invites/:inviteId/decline — decline a community invite (auth required)
 */
router.post(
  '/invites/:inviteId/decline',
  requireAuth,
  param('inviteId').isUUID(4).withMessage('Invalid invite id'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const result = await communityService.declineInvite(req.params.inviteId, req.user.id);
      return res.json(result);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Invite not found' });
      }
      if (err.code === 'FORBIDDEN') {
        return res.status(400).json({ error: err.message });
      }
      console.error('Decline invite error:', err);
      return res.status(500).json({ error: 'Failed to decline invite' });
    }
  }
);

/**
 * GET /communities/:id — get one community by id or slug (with member count)
 */
router.get(
  '/:id',
  param('id').trim().notEmpty().withMessage('Community id or slug required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const idOrSlug = req.params.id;
      const community =
        UUID_REGEX.test(idOrSlug)
          ? await communityService.getById(idOrSlug)
          : await communityService.getBySlug(idOrSlug);
      if (!community) {
        return res.status(404).json({ error: 'Community not found' });
      }
      return res.json(community);
    } catch (err) {
      console.error('Get community error:', err);
      return res.status(500).json({ error: 'Failed to load community' });
    }
  }
);

/**
 * GET /communities/:id/members — list members (paginated). :id can be community id or slug.
 */
router.get(
  '/:id/members',
  [
    param('id').trim().notEmpty().withMessage('Community id or slug required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const idOrSlug = req.params.id;
      const community =
        UUID_REGEX.test(idOrSlug)
          ? await communityService.getById(idOrSlug)
          : await communityService.getBySlug(idOrSlug);
      if (!community) {
        return res.status(404).json({ error: 'Community not found' });
      }
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const offset = req.query.offset ? Number(req.query.offset) : 0;
      const members = await communityService.getMembers(community.id, { limit, offset });
      return res.json(members);
    } catch (err) {
      console.error('Get members error:', err);
      return res.status(500).json({ error: 'Failed to load members' });
    }
  }
);

/**
 * POST /communities — create Sub-Community (parent_id) or Private community (type: 'PRIVATE', parent_ids optional)
 */
router.post(
  '/',
  requireAuth,
  [
    body('name').trim().notEmpty().isLength({ max: 255 }).withMessage('name required, max 255 chars'),
    body('slug').trim().notEmpty().isLength({ max: 255 }).withMessage('slug required, max 255 chars'),
    body('type').optional().isIn(['PRIVATE']).withMessage('type must be PRIVATE if provided'),
    body('parent_id').optional().isUUID(4).withMessage('Valid parent_id (Location) required for SUB'),
    body('parent_ids').optional().isArray().withMessage('parent_ids must be array'),
    body('parent_ids.*').optional().isUUID(4).withMessage('Each parent_id must be UUID'),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('profile_data').optional().isObject(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const isPrivate = req.body.type === 'PRIVATE';
    if (isPrivate) {
      try {
        const community = await communityService.createPrivateCommunity(req.user.id, {
          name: req.body.name,
          slug: req.body.slug,
          description: req.body.description,
          profile_data: req.body.profile_data,
          parent_ids: req.body.parent_ids || [],
        });
        return res.status(201).json(community);
      } catch (err) {
        if (err.code === 'SLUG_TAKEN') {
          return res.status(409).json({ error: 'Slug already in use' });
        }
        if (err.code === 'PARENT_NOT_FOUND') {
          return res.status(400).json({ error: 'Parent community not found or inactive' });
        }
        if (err.code === 'NOT_MEMBER_OF_PARENT') {
          return res.status(403).json({ error: 'You must be a member of every parent community' });
        }
        console.error('Create private community error:', err);
        return res.status(500).json({ error: 'Failed to create community' });
      }
    }
    if (!req.body.parent_id) {
      return res.status(400).json({ error: 'parent_id (Location) required for sub-community' });
    }
    try {
      const community = await communityService.createSubCommunity(req.user.id, {
        name: req.body.name,
        slug: req.body.slug,
        parent_id: req.body.parent_id,
        description: req.body.description,
        profile_data: req.body.profile_data,
      });
      return res.status(201).json(community);
    } catch (err) {
      if (err.code === 'PARENT_NOT_LOCATION') {
        return res.status(400).json({ error: 'Parent community not found or is not a Location' });
      }
      if (err.code === 'NOT_LOCAL') {
        return res.status(403).json({ error: 'You must be a member of the Location to create a sub-community' });
      }
      if (err.code === 'SLUG_TAKEN') {
        return res.status(409).json({ error: 'Slug already in use' });
      }
      console.error('Create community error:', err);
      return res.status(500).json({ error: 'Failed to create community' });
    }
  }
);

/**
 * PATCH /communities/:id — update community (Sub: moderator; Private: founder; name/slug/parent_ids for private)
 */
router.patch(
  '/:id',
  requireAuth,
  [
    param('id').isUUID(4).withMessage('Invalid community id'),
    body('name').optional().trim().isLength({ max: 255 }),
    body('slug').optional().trim().isLength({ max: 255 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('profile_data').optional().isObject(),
    body('parent_ids').optional().isArray().withMessage('parent_ids must be array'),
    body('parent_ids.*').optional().isUUID(4).withMessage('Each parent_id must be UUID'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const community = await communityService.updateCommunity(
        req.params.id,
        req.user.id,
        req.body
      );
      return res.json(community);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Community not found' });
      }
      if (err.code === 'LOCATION_READONLY') {
        return res.status(403).json({ error: 'Locations can only be updated by developers' });
      }
      if (err.code === 'NOT_MEMBER') {
        return res.status(403).json({ error: 'You are not a member of this community' });
      }
      if (err.code === 'NOT_MODERATOR') {
        return res.status(403).json({ error: 'Only moderators can update the community profile' });
      }
      if (err.code === 'NOT_FOUNDER') {
        return res.status(403).json({ error: 'Only the founder can update this community' });
      }
      if (err.code === 'SLUG_TAKEN') {
        return res.status(409).json({ error: 'Slug already in use' });
      }
      console.error('Update community error:', err);
      return res.status(500).json({ error: 'Failed to update community' });
    }
  }
);

/**
 * POST /communities/:id/invite — invite user to private community (founder only; body: user_id or email)
 */
router.post(
  '/:id/invite',
  requireAuth,
  [
    param('id').isUUID(4).withMessage('Invalid community id'),
    body('user_id').optional().isUUID(4).withMessage('user_id must be UUID'),
    body('email').optional().isEmail().withMessage('email must be valid'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (!req.body.user_id && !req.body.email) {
      return res.status(400).json({ error: 'user_id or email required' });
    }
    try {
      const invite = await communityService.inviteToCommunity(req.params.id, req.user.id, {
        user_id: req.body.user_id,
        email: req.body.email,
      });
      return res.status(201).json(invite);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Community not found or is not private' });
      }
      if (err.code === 'NOT_FOUNDER') {
        return res.status(403).json({ error: 'Only the founder can invite members' });
      }
      if (err.code === 'USER_NOT_FOUND') {
        return res.status(404).json({ error: 'User not found' });
      }
      if (err.code === 'ALREADY_MEMBER') {
        return res.status(400).json({ error: 'User is already a member' });
      }
      if (err.code === 'INVITE_PENDING') {
        return res.status(400).json({ error: 'Invite already pending' });
      }
      console.error('Invite error:', err);
      return res.status(500).json({ error: 'Failed to send invite' });
    }
  }
);

/**
 * DELETE /communities/:id/members/:userId — remove member from private community (founder only)
 */
router.delete(
  '/:id/members/:userId',
  requireAuth,
  [
    param('id').isUUID(4).withMessage('Invalid community id'),
    param('userId').isUUID(4).withMessage('Invalid user id'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const result = await communityService.removeMember(req.params.id, req.user.id, req.params.userId);
      return res.json(result);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Community not found or is not private' });
      }
      if (err.code === 'NOT_FOUNDER') {
        return res.status(403).json({ error: 'Only the founder can remove members' });
      }
      if (err.code === 'CANNOT_REMOVE_FOUNDER') {
        return res.status(400).json({ error: err.message });
      }
      console.error('Remove member error:', err);
      return res.status(500).json({ error: 'Failed to remove member' });
    }
  }
);

/**
 * POST /communities/:id/join — join community (auth required). Private communities are invite-only.
 */
router.post(
  '/:id/join',
  requireAuth,
  param('id').isUUID(4).withMessage('Invalid community id'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const result = await communityService.join(req.user.id, req.params.id);
      return res.status(result.joined ? 201 : 200).json(result);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Community not found' });
      }
      if (err.code === 'PRIVATE_INVITE_ONLY') {
        return res.status(400).json({ error: 'Private communities are invite-only' });
      }
      console.error('Join community error:', err);
      return res.status(500).json({ error: 'Failed to join community' });
    }
  }
);

/**
 * POST /communities/:id/leave — leave community (auth required). Friend group founder cannot leave.
 */
router.post(
  '/:id/leave',
  requireAuth,
  param('id').isUUID(4).withMessage('Invalid community id'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const result = await communityService.leave(req.user.id, req.params.id);
      return res.json(result);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Community not found' });
      }
      if (err.code === 'CANNOT_LEAVE_FRIEND_GROUP') {
        return res.status(403).json({ error: 'You cannot leave your friend community' });
      }
      console.error('Leave community error:', err);
      return res.status(500).json({ error: 'Failed to leave community' });
    }
  }
);

/**
 * GET /communities/:id/local-status — get is_member and is_local for current user (auth required)
 */
router.get(
  '/:id/local-status',
  requireAuth,
  param('id').isUUID(4).withMessage('Invalid community id'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const status = await communityService.getLocalStatus(req.user.id, req.params.id);
      return res.json(status);
    } catch (err) {
      console.error('Local status error:', err);
      return res.status(500).json({ error: 'Failed to get local status' });
    }
  }
);

export default router;
