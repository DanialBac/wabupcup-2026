import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { apiRouter } from '../server/routes';
import { initDatabaseConnection } from '../server/db';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy non-blocking DB initialization
let isDbInitStarted = false;
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!isDbInitStarted) {
    isDbInitStarted = true;
    initDatabaseConnection().catch(err => {
      console.warn('[Vercel Serverless] DB init non-blocking note:', err?.message || err);
    });
  }
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

// Export both standard handler function and Express app for Vercel Node.js runtime
export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel Handler Fatal Error]', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        error: err?.message || 'Fatal Serverless Handler Error',
      })
    );
  }
}
