import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
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

const startServer = async () => {

  app.listen(PORT, () => {
    console.log(`DataHub Server running on port ${PORT}`);
  });
};

startServer();
