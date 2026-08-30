import express from 'express';
import cors from 'cors';
import { apiRouter } from '../server/routes';
import { initDatabaseConnection } from '../server/db';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount API routes
app.use('/api', apiRouter);

// Lazy init DB connection
let isDbInitialized = false;
app.use(async (req, res, next) => {
  if (!isDbInitialized) {
    try {
      await initDatabaseConnection();
      isDbInitialized = true;
    } catch (err) {
      console.warn('[Vercel Serverless] DB init warning:', err);
    }
  }
  next();
});

export default app;
