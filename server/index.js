import 'dotenv/config';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import communityRoutes from './routes/communities.js';
import eventRoutes from './routes/events.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 8000;
const BASE_PATH = (process.env.BASE_PATH || '').replace(/\/$/, '');
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      socket.user = jwt.verify(token, JWT_SECRET);
    } catch (_) {
      // anonymous connection allowed
    }
  }
  next();
});

io.on('connection', (socket) => {
  if (socket.user) {
    socket.join(`user:${socket.user.id}`);
  }
});

app.set('io', io);

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

// Serve frontend static files in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

httpServer.listen(PORT, () => {
  console.log(`Comunitree backend running on http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down gracefully...`);
  httpServer.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Shutdown timed out, forcing exit.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { io };
