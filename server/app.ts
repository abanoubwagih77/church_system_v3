import express from 'express';
import cors from 'cors';
import { initDatabase } from './db.js';
import { authRouter } from './routes/auth.js';
import { portalRouter } from './routes/portal.js';
import { servantsRouter } from './routes/servants.js';
import { servicesRouter } from './routes/services.js';
import { attendanceRouter } from './routes/attendance.js';
import { usersRouter } from './routes/users.js';
import { auditRouter } from './routes/audit.js';
import { reportsRouter } from './routes/reports.js';
import { scannerRouter } from './routes/scanner.js';
import { meetingsRouter } from './routes/meetings.js';

export function createExpressApp() {
  // Ensure DB initialized
  initDatabase();

  const app = express();

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
  app.use('/api/meetings', meetingsRouter);

  return app;
}
