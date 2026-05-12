import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';

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

import planRoutes from './routes/plans';
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import agentRoutes from './routes/agent';
import paystackRoutes from './routes/paystack';


app.use('/api/plans', planRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/paystack', paystackRoutes);

// Fallback: Redirect any other GET requests to the frontend status page if it looks like a status route
app.get('/status/:ref', (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'https://daikdigitalstore.vercel.app';
  res.redirect(`${clientUrl}/status/${req.params.ref}`);
});

const startServer = async () => {

  app.listen(PORT, () => {
    console.log(`✅ DataHub Server running on port ${PORT}`);
  });
};

startServer();
