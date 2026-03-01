import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import communityRoutes from './routes/communities.js';
import eventRoutes from './routes/events.js';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    app: 'Comunitree',
    docs: 'See README for API usage',
    endpoints: {
      health: '/health',
      auth: '/auth/register, /auth/login, /auth/me',
      users: '/users/:id, /users/me, /users/me/config, /users/me/avatar, /users/me/locations, /users/me/events, /users/me/ratings, /users/me/friends, ...',
      communities: '/communities',
      events: '/events, /communities/:id/events',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Comunitree' });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/communities', communityRoutes);
app.use('/events', eventRoutes);

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
