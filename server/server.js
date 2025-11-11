import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/error.js';

import authRoutes from './routes/auth.routes.js';

const app = express();

// core middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// health
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Auth & Recovery API running' });
});

// routes
app.use('/api/auth', authRoutes);

// error handler
app.use(errorHandler);

// start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

(async () => {
  await connectDB(MONGO_URI);
  app.listen(PORT, () => {
    console.log(`✅ Server on http://localhost:${PORT}`);
  });
})();