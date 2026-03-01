import 'dotenv/config';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import communityRoutes from './routes/communities.js';
import eventRoutes from './routes/events.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 7000;
const FRONTEND_PORT = process.env.FRONTEND_PORT ? Number(process.env.FRONTEND_PORT) : null;
const BASE_PATH = (process.env.BASE_PATH || '').replace(/\/$/, '');
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const clientDist = path.join(__dirname, '..', 'client', 'dist');

// Fail fast if frontend build is missing (common cause of "white screen" in Docker)
const indexPath = path.join(clientDist, 'index.html');
if (!fs.existsSync(clientDist) || !fs.existsSync(indexPath)) {
  console.error('ERROR: Frontend build not found at', clientDist);
  console.error('Expected index.html at', indexPath);
  console.error('Rebuild the Docker image so the client is built: docker build --no-cache -t whats .');
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);

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

// When BASE_PATH is set, SPA is served at BASE_PATH/ so don't register API root there
if (!BASE_PATH) {
  router.get('/', (req, res) => {
    res.json({
      app: 'Comunitree',
      docs: 'See README for API usage',
      endpoints: {
        health: '/health',
        auth: '/auth/register, /auth/login, /auth/me',
        users: '/users/:id, /users/me, ...',
        communities: '/communities',
        events: '/events, /communities/:id/events',
      },
    });
  });
}

router.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Comunitree' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/communities', communityRoutes);
router.use('/events', eventRoutes);

// Mount API at BASE_PATH (e.g. /communitree) so frontend built with that base works
app.use(BASE_PATH || '/', router);
// When BASE_PATH is set, also mount at root so /auth, /users etc. work (avoids 404 if client hits root path)
if (BASE_PATH) {
  app.use('/', router);
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Mount frontend static + SPA fallback at a path ('' means root)
function mountFrontend(at) {
  const mount = at || '/';
  app.use(mount, express.static(clientDist));
  app.get(mount === '/' ? '*' : `${mount}/*`, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Single-port mode: serve frontend from same server
function serveFrontendFromBackend() {
  mountFrontend(BASE_PATH || '/');
}

function addProxyRoutes(frontendApp, backendOrigin) {
  const prefix = BASE_PATH || '';
  const p = (path) => (prefix ? prefix + path : path);
  frontendApp.use(p('/auth'), createProxyMiddleware({ target: backendOrigin, changeOrigin: true }));
  frontendApp.use(p('/users'), createProxyMiddleware({ target: backendOrigin, changeOrigin: true }));
  frontendApp.use(p('/communities'), createProxyMiddleware({ target: backendOrigin, changeOrigin: true }));
  frontendApp.use(p('/events'), createProxyMiddleware({ target: backendOrigin, changeOrigin: true }));
  frontendApp.use(p('/health'), createProxyMiddleware({ target: backendOrigin, changeOrigin: true }));
  frontendApp.use(p('/socket.io'), createProxyMiddleware({ target: backendOrigin, changeOrigin: true, ws: true }));
}

if (FRONTEND_PORT) {
  // Two-port mode: backend on PORT (7000), frontend on FRONTEND_PORT (8000) with proxy
  const backendOrigin = `http://127.0.0.1:${PORT}`;
  const frontendApp = express();
  // When BASE_PATH is set, redirect / to /communitree/ so users get the app instead of 404
  if (BASE_PATH) {
    frontendApp.get('/', (req, res) => res.redirect(302, BASE_PATH + '/'));
    frontendApp.use('/auth', createProxyMiddleware({ target: backendOrigin, changeOrigin: true }));
    frontendApp.use('/users', createProxyMiddleware({ target: backendOrigin, changeOrigin: true }));
    frontendApp.use('/communities', createProxyMiddleware({ target: backendOrigin, changeOrigin: true }));
    frontendApp.use('/events', createProxyMiddleware({ target: backendOrigin, changeOrigin: true }));
    frontendApp.use('/health', createProxyMiddleware({ target: backendOrigin, changeOrigin: true }));
    frontendApp.use('/socket.io', createProxyMiddleware({ target: backendOrigin, changeOrigin: true, ws: true }));
  }
  addProxyRoutes(frontendApp, backendOrigin);
  const mount = BASE_PATH || '/';
  frontendApp.use(mount, express.static(clientDist));
  frontendApp.get(mount === '/' ? '*' : `${mount}/*`, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
  const frontendServer = createServer(frontendApp);
  frontendServer.listen(FRONTEND_PORT, () => {
    const pathHint = BASE_PATH ? ` at ${BASE_PATH}` : '';
    console.log(`Comunitree frontend running on http://localhost:${FRONTEND_PORT}${pathHint}`);
  }).on('error', (err) => {
    console.error('Failed to start frontend server:', err);
    process.exit(1);
  });
} else {
  serveFrontendFromBackend();
}

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
