import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import * as eventService from '../services/eventService.js';
import * as userService from '../services/userService.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * POST /events — create event (auth required). Defaults community to creator's friend community if omitted.
 */
router.post(
  '/',
  requireAuth,
  [
    body('community_id').optional().isUUID(4).withMessage('Invalid community_id'),
    body('title').trim().notEmpty().isLength({ max: 500 }).withMessage('title required, max 500 chars'),
    body('event_date').optional().isISO8601().withMessage('event_date must be ISO date'),
    body('event_time').optional().trim().isLength({ max: 50 }),
    body('broad_location').optional().trim().isLength({ max: 500 }),
    body('specific_location').optional().trim().isLength({ max: 1000 }),
    body('description').optional().trim().isLength({ max: 5000 }),
    body('is_public').optional().isBoolean(),
    body('visibility_settings').optional().isObject(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const eventDate = req.body.event_date;
      const eventDateStr =
        eventDate instanceof Date
          ? eventDate.toISOString().slice(0, 10)
          : eventDate
            ? String(eventDate).slice(0, 10)
            : undefined;
      const payload = {
        community_id: req.body.community_id,
        title: req.body.title,
        event_date: eventDateStr,
        event_time: req.body.event_time,
        broad_location: req.body.broad_location,
        specific_location: req.body.specific_location,
        description: req.body.description,
        is_public: req.body.is_public,
        visibility_settings: req.body.visibility_settings,
      };
      const event = await eventService.createEvent(req.user.id, payload);
      return res.status(201).json(event);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Community not found' });
      }
      if (err.code === 'NOT_MEMBER') {
        return res.status(403).json({ error: err.message });
      }
      if (err.code === 'NO_FRIEND_COMMUNITY') {
        return res.status(400).json({ error: err.message });
      }
      console.error('Create event error:', err);
      return res.status(500).json({ error: 'Failed to create event' });
    }
  }
);

/**
 * GET /events/:id — get one event; visibility applied for optional viewer.
 */
router.get(
  '/:id',
  optionalAuth,
  [param('id').isUUID(4).withMessage('Invalid event id')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const event = await eventService.getEventById(req.params.id, {
        viewerId: req.user?.id,
      });
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      let creator = null;
      if (event.creator_id) {
        const needCreator =
          event.is_public ||
          event.creator_id === req.user?.id ||
          (event.visibility_settings && event.visibility_settings.show_creator);
        if (needCreator) {
          creator = await userService.findById(event.creator_id);
        }
      }
      const masked = eventService.applyEventVisibility(event, req.user?.id, {
        creator: creator || undefined,
      });
      return res.json(masked);
    } catch (err) {
      console.error('Get event error:', err);
      return res.status(500).json({ error: 'Failed to load event' });
    }
  }
);

/**
 * PATCH /events/:id — update event (creator only).
 */
router.patch(
  '/:id',
  requireAuth,
  [
    param('id').isUUID(4).withMessage('Invalid event id'),
    body('title').optional().trim().isLength({ max: 500 }),
    body('description').optional().trim().isLength({ max: 5000 }),
    body('event_date').optional().isISO8601(),
    body('event_time').optional().trim().isLength({ max: 50 }),
    body('broad_location').optional().trim().isLength({ max: 500 }),
    body('specific_location').optional().trim().isLength({ max: 1000 }),
    body('is_public').optional().isBoolean(),
    body('visibility_settings').optional().isObject(),
    body('is_active').optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const payload = { ...req.body };
      if (payload.event_date) {
        payload.event_date =
          payload.event_date instanceof Date
            ? payload.event_date.toISOString().slice(0, 10)
            : String(payload.event_date).slice(0, 10);
      }
      const event = await eventService.updateEvent(
        req.params.id,
        req.user.id,
        payload
      );
      return res.json(event);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Event not found' });
      }
      if (err.code === 'FORBIDDEN') {
        return res.status(403).json({ error: err.message });
      }
      console.error('Update event error:', err);
      return res.status(500).json({ error: 'Failed to update event' });
    }
  }
);

/**
 * DELETE /events/:id — deactivate event (creator only, soft delete).
 */
router.delete(
  '/:id',
  requireAuth,
  [param('id').isUUID(4).withMessage('Invalid event id')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      await eventService.deleteEvent(req.params.id, req.user.id);
      return res.json({ deleted: true });
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Event not found' });
      }
      if (err.code === 'FORBIDDEN') {
        return res.status(403).json({ error: err.message });
      }
      console.error('Delete event error:', err);
      return res.status(500).json({ error: 'Failed to delete event' });
    }
  }
);

/**
 * POST /events/:id/rsvp — add current user's RSVP.
 */
router.post(
  '/:id/rsvp',
  requireAuth,
  [param('id').isUUID(4).withMessage('Invalid event id')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const result = await eventService.rsvpToEvent(req.params.id, req.user.id);
      return res.status(201).json(result);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Event not found' });
      }
      console.error('RSVP error:', err);
      return res.status(500).json({ error: 'Failed to RSVP' });
    }
  }
);

/**
 * DELETE /events/:id/rsvp — remove current user's RSVP.
 */
router.delete(
  '/:id/rsvp',
  requireAuth,
  [param('id').isUUID(4).withMessage('Invalid event id')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      await eventService.removeRsvp(req.params.id, req.user.id);
      return res.json({ rsvped: false });
    } catch (err) {
      console.error('Remove RSVP error:', err);
      return res.status(500).json({ error: 'Failed to remove RSVP' });
    }
  }
);

/**
 * GET /events/:id/rsvps — for creator: list of users who RSVP'd; for others: { count } when visibility allows.
 */
router.get(
  '/:id/rsvps',
  requireAuth,
  [param('id').isUUID(4).withMessage('Invalid event id')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const result = await eventService.getRsvpsForEvent(
        req.params.id,
        req.user.id
      );
      return res.json(result);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Event not found' });
      }
      console.error('Get RSVPs error:', err);
      return res.status(500).json({ error: 'Failed to get RSVPs' });
    }
  }
);

/**
 * GET /events/:id/my-rsvp — whether current user has RSVP'd.
 */
router.get(
  '/:id/my-rsvp',
  requireAuth,
  [param('id').isUUID(4).withMessage('Invalid event id')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const result = await eventService.getMyRsvp(req.params.id, req.user.id);
      return res.json(result);
    } catch (err) {
      console.error('Get my RSVP error:', err);
      return res.status(500).json({ error: 'Failed to get RSVP status' });
    }
  }
);

/**
 * POST /events/:id/rate — set current user's rating (1–5). Upserts.
 */
router.post(
  '/:id/rate',
  requireAuth,
  [
    param('id').isUUID(4).withMessage('Invalid event id'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be 1–5'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const result = await eventService.rateEvent(
        req.params.id,
        req.user.id,
        req.body.rating
      );
      return res.status(201).json(result);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Event not found' });
      }
      if (err.code === 'INVALID_RATING') {
        return res.status(400).json({ error: err.message });
      }
      console.error('Rate event error:', err);
      return res.status(500).json({ error: 'Failed to rate event' });
    }
  }
);

/**
 * GET /events/:id/ratings — aggregate and count only (anonymous; no per-user data).
 */
router.get(
  '/:id/ratings',
  optionalAuth,
  [param('id').isUUID(4).withMessage('Invalid event id')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const event = await eventService.getEventById(req.params.id, {
        viewerId: req.user?.id,
      });
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      const showRatings =
        event.is_public ||
        event.creator_id === req.user?.id ||
        (event.visibility_settings && event.visibility_settings.show_ratings);
      if (!showRatings) {
        return res.json({ aggregate: null, count: 0 });
      }
      const result = await eventService.getRatingAggregate(req.params.id);
      return res.json(result);
    } catch (err) {
      console.error('Get ratings error:', err);
      return res.status(500).json({ error: 'Failed to get ratings' });
    }
  }
);

/**
 * GET /events/:id/my-rating — current user's rating if any (for GUI to show "Your rating").
 */
router.get(
  '/:id/my-rating',
  requireAuth,
  [param('id').isUUID(4).withMessage('Invalid event id')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const result = await eventService.getMyRating(
        req.params.id,
        req.user.id
      );
      return res.json(result);
    } catch (err) {
      console.error('Get my rating error:', err);
      return res.status(500).json({ error: 'Failed to get your rating' });
    }
  }
);

export default router;
