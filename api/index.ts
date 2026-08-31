import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { apiRouter } from '../server/routes';
import { ensureDbConnected } from '../server/db';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Non-blocking auto DB connection trigger for serverless cold-starts
app.use((req: Request, res: Response, next: NextFunction) => {
  ensureDbConnected().catch((err: any) => {
    console.warn('[Vercel Serverless Auto-DB]', err?.message || err);
  });
  next();
});

// Normalize URLs: Handle both /api/xxx and /xxx routes
app.use('/api', apiRouter);
app.use('/', apiRouter);

// 404 Fallback in pure JSON (Never return HTML for API requests)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `API Route Not Found: ${req.method} ${req.originalUrl || req.url}`,
  });
});

// Global Express Error Handler in pure JSON
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Serverless Error]', err);
  res.status(500).json({
    success: false,
    error: err?.message || 'Internal Server Error',
  });
});

// Prevent unhandled promise rejections from terminating the process
if (typeof process !== 'undefined') {
  process.on('unhandledRejection', (reason: any) => {
    console.warn('[Vercel Serverless Non-Fatal Rejection]', reason?.message || reason);
  });
  process.on('uncaughtException', (err: any) => {
    console.warn('[Vercel Serverless Non-Fatal Exception]', err?.message || err);
  });
}

// Export Express app directly for Vercel Node.js Serverless runtime
export default app;

