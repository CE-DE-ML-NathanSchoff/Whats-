import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import communityRoutes from './routes/communities.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    app: 'Comunitree',
    docs: 'See README for API usage',
    endpoints: {
      health: '/health',
      auth: '/auth/register, /auth/login, /auth/me',
      users: '/users/:id, /users/me',
      communities: '/communities',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Comunitree' });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/communities', communityRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const preferredPort = Number(process.env.PORT) || 3000;

function tryListen(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      const actualPort = server.address().port;
      console.log(`Comunitree backend running on http://localhost:${actualPort}`);
      if (actualPort !== preferredPort) {
        console.log(`(Port ${preferredPort} was in use; using ${actualPort} instead)`);
      }
      resolve(server);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        server.close(() => tryListen(port + 1).then(resolve).catch(reject));
      } else {
        reject(err);
      }
    });
  });
}

tryListen(preferredPort).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
