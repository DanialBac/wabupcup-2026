import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { apiRouter } from '../server/routes';
import { initDatabaseConnection } from '../server/db';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 1. Safe DB init middleware (Runs before any route handler)
let isDbInitialized = false;
let dbInitPromise: Promise<boolean> | null = null;

app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (!isDbInitialized) {
    if (!dbInitPromise) {
      dbInitPromise = initDatabaseConnection()
        .then(res => {
          isDbInitialized = true;
          return res;
        })
        .catch(err => {
          console.warn('[Vercel Serverless] DB init background warning:', err);
          isDbInitialized = true; // Avoid re-triggering constantly on failures
          return false;
        });
    }
    // Don't block requests indefinitely if DB takes long, but await initial attempt
    await Promise.race([
      dbInitPromise,
      new Promise(resolve => setTimeout(resolve, 2000)),
    ]);
  }
  next();
});

// 2. Mount routes to handle both /api/xxx and /xxx (in case Vercel strips /api prefix)
app.use('/api', apiRouter);
app.use('/', apiRouter);

// 3. 404 Fallback in pure JSON (Never return HTML for API requests)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'API Route Not Found',
    path: req.originalUrl || req.url,
    method: req.method,
  });
});

// 4. Global Express Error Handler in pure JSON
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]', err);
  res.status(500).json({
    error: err?.message || 'Internal Server Error',
    success: false,
  });
});

export default app;

