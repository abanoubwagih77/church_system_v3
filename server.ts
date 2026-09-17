import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db.js';
import { authRouter } from './server/routes/auth.js';
import { portalRouter } from './server/routes/portal.js';
import { servantsRouter } from './server/routes/servants.js';
import { servicesRouter } from './server/routes/services.js';
import { attendanceRouter } from './server/routes/attendance.js';
import { usersRouter } from './server/routes/users.js';
import { auditRouter } from './server/routes/audit.js';
import { reportsRouter } from './server/routes/reports.js';
import { scannerRouter } from './server/routes/scanner.js';

async function startServer() {
  // Initialize local atomic DB
  initDatabase();

  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      church: 'كنيسة الشهيد العظيم مارجرجس بمنية شبين القناطر',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/portal', portalRouter);
  app.use('/api/servants', servantsRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/attendance', attendanceRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/audit', auditRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/scanner', scannerRouter);

  // Vite Middleware in Dev vs Static in Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
