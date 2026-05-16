import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import paystackRoutes from './routes/paystack';
import planRoutes from './routes/plans';
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import agentRoutes from './routes/agent';
import { validateEnv } from './utils/validateEnv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'https://daikdigitalstore.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
// Explicitly handle preflight for all routes
app.options('*', cors());
app.use(morgan('dev'));

// ⚠️ IMPORTANT: Only the Paystack webhook needs raw body for HMAC verification.
// Strategy:
//   1. Apply express.raw() ONLY to /api/paystack/webhook (before express.json)
//      so the Buffer is preserved for crypto.createHmac signature checking.
//   2. Register express.json() globally — body-parser skips already-parsed bodies,
//      so the webhook body stays as a Buffer; all other routes get JSON parsing.
//   3. Mount paystackRoutes once AFTER express.json() so /initialize/:orderId
//      gets a proper parsed req.body object.
app.use('/api/paystack/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'DataHub API Server is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      plans: '/api/plans',
      orders: '/api/orders'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});



app.use('/api/paystack', paystackRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agent', agentRoutes);

// Fallback: Redirect any other GET requests to the frontend status page if it looks like a status route
app.get('/status/:ref', (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'https://daikdigitalstore.vercel.app';
  res.redirect(`${clientUrl}/status/${req.params.ref}`);
});

const startServer = async () => {
  const { missing, placeholder } = validateEnv();

  if (missing.length || placeholder.length) {
    console.error('❌ Application environment validation failed. Please fix the missing / placeholder values above and restart.');
  }

  app.listen(PORT, () => {
    console.log(`✅ DataHub Server running on port ${PORT}`);
  });
};

startServer();
