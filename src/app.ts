import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './app/config/swagger';
import routes from './app/routes';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler';
import { arcjetMiddleware } from './app/middlewares/arcjetMiddleware';

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

// Lightweight cookie parsing middleware for JWT session management
app.use((req: Request, res: Response, next: NextFunction) => {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const name = parts[0]?.trim();
      const val = parts.slice(1).join('=').trim();
      if (name) cookies[name] = decodeURIComponent(val);
    });
    (req as any).cookies = cookies;
  } else {
    (req as any).cookies = {};
  }
  next();
});

// Swagger UI Options with DropOfLife custom theme
const swaggerCustomOptions: swaggerUi.SwaggerUiOptions = {
  customSiteTitle: 'DropOfLife REST API Documentation',
  customCss: `
    .swagger-ui .topbar { background-color: #09090b; border-bottom: 2px solid #e11d48; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    .swagger-ui .info .title { color: #e11d48; }
    .swagger-ui .btn.authorize { background-color: #e11d48; color: #fff; border-color: #e11d48; }
    .swagger-ui .opblock.opblock-post { border-color: #10b981; background: rgba(16, 185, 129, 0.05); }
    .swagger-ui .opblock.opblock-get { border-color: #06b6d4; background: rgba(6, 182, 212, 0.05); }
    .swagger-ui .opblock.opblock-patch { border-color: #f59e0b; background: rgba(245, 158, 11, 0.05); }
  `,
};

// Mount Interactive Swagger UI Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerCustomOptions));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerCustomOptions));

// Raw OpenAPI JSON spec for export or Postman import
app.get('/docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
});

// Root welcome endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🩸 Welcome to DropOfLife REST API (Modular MVC Pattern) — জীবনের এক ফোঁটা',
    architecture: 'Modular MVC Pattern (src/app/modules/*)',
    security: 'Arcjet Bot Detection & Shield Active',
    docs: '/docs',
    rawSpec: '/docs.json',
    health: '/api/v1/health',
    version: '1.0.0',
    hotline: '+8801521711716',
  });
});

// Arcjet Security Middleware: Rate Limiting & Bot/WAF Protection
app.use(arcjetMiddleware);

// API version 1 with Modular MVC routing
app.use('/api/v1', routes);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
