import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import communityRoutes from './routes/communities.js';
import eventRoutes from './routes/events.js';

const app = express();
const PORT = process.env.PORT || 8000;
const BASE_PATH = (process.env.BASE_PATH || '').replace(/\/$/, ''); // e.g. '' or '/communitree'

app.use(cors());
app.use(express.json());

const router = express.Router();

router.get('/', (req, res) => {
  const prefix = BASE_PATH || '';
  res.json({
    app: 'Comunitree',
    docs: 'See README for API usage',
    endpoints: {
      health: `${prefix}/health`,
      auth: `${prefix}/auth/register, ${prefix}/auth/login, ${prefix}/auth/me`,
      users: `${prefix}/users/:id, ${prefix}/users/me, ...`,
      communities: `${prefix}/communities`,
      events: `${prefix}/events, ${prefix}/communities/:id/events`,
    },
  });
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Comunitree' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/communities', communityRoutes);
router.use('/events', eventRoutes);

app.use(BASE_PATH || '/', router);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Comunitree backend running on http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
