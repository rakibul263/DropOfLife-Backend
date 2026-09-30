import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins in development or matching localhost/production domain
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🩸 Welcome to DropOfLife REST API — জীবনের এক ফোঁটা',
    docs: '/api/v1/health',
    version: '1.0.0',
  });
});

// API version 1
app.use('/api/v1', routes);

// Global Error Handler
app.use(errorHandler);

export default app;
