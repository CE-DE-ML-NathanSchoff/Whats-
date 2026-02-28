import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import * as userService from '../services/userService.js';
import * as communityService from '../services/communityService.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();

const registerValidators = [
  body('username').trim().isLength({ min: 2, max: 255 }).withMessage('Username must be 2–255 characters'),
  body('email').trim().isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone_number').optional().trim().isLength({ max: 50 }).withMessage('Phone number max 50 characters'),
  body('display_name').optional().trim().isLength({ max: 255 }),
  body('bio').optional().trim().isLength({ max: 1000 }),
];

const loginValidators = [
  body('username').trim().notEmpty().withMessage('Username required'),
  body('password').notEmpty().withMessage('Password required'),
];

/**
 * POST /auth/register
 * Body: { username, email, password, phone_number?, display_name?, bio? }
 */
router.post('/register', registerValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { username, email, password, phone_number, display_name, bio } = req.body;

  try {
    const existingUsername = await userService.findByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    const existingEmail = await userService.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await userService.createUser({
      username,
      email,
      password,
      phone_number: phone_number || undefined,
      display_name: display_name || undefined,
      bio: bio || undefined,
    });

    await communityService.createFriendGroupForUser(user.id);

    const token = signToken({ id: user.id, username: user.username });
    return res.status(201).json({
      message: 'Account created',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone_number: user.phone_number,
        display_name: user.display_name,
        bio: user.bio,
        created_at: user.created_at,
      },
      token,
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /auth/login
 * Body: { username, password }
 */
router.post('/login', loginValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { username, password } = req.body;

  try {
    const user = await userService.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const valid = await userService.verifyPassword(password, user.PASSWORD_HASH || user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = signToken({
      id: user.ID || user.id,
      username: user.USERNAME || user.username,
    });
    const safeUser = {
      id: user.ID || user.id,
      username: user.USERNAME || user.username,
      email: user.EMAIL || user.email,
      phone_number: user.PHONE_NUMBER ?? user.phone_number,
      display_name: user.DISPLAY_NAME ?? user.display_name,
      bio: user.BIO ?? user.bio,
      created_at: user.CREATED_AT || user.created_at,
    };
    return res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /auth/me — current user (requires JWT). Includes local_location_ids for Local/Traveler context.
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const local_location_ids = await communityService.getLocalLocationIds(req.user.id);
    return res.json({ ...user, local_location_ids });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Failed to load user' });
  }
});

export default router;
