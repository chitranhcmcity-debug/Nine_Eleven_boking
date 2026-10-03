import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import express from 'express';
import cookieParser from 'cookie-parser';
import { publicRouter } from './routes/public.js';
import { bookingRouter } from './routes/booking.js';
import { shopRouter } from './routes/shop.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { HttpError } from './http.js';

const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist/client/browser');

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.use('/api', publicRouter);
  app.use('/api', bookingRouter);
  app.use('/api', shopRouter);
  app.use('/api/admin', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', (_req, res) => res.status(404).json({ message: 'Không tìm thấy.' }));

  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use((err, _req, res, _next) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }
    if (err?.name === 'CastError') {
      return res.status(404).json({ message: 'Không tìm thấy.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ.' });
  });

  return app;
}
