// server/server.js
import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/error.js';

import authRoutes from './routes/auth.routes.js';
import postRoutes from './routes/post.routes.js'; 
import notificationRoutes from "./routes/notification.routes.js";
import userRoutes from './routes/user.routes.js';

const app = express();

// core middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// health
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Auth, Recovery & Posts API running' });
});

// routes
app.use('/api/auth', authRoutes);
app.use("/api/notifications", notificationRoutes);               
app.use('/api/posts', postRoutes);               
app.use('/api/users', userRoutes);

// error handler
app.use(errorHandler);

// start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

(async () => {
  await connectDB(MONGO_URI);
  app.listen(PORT, () => {
    console.log(`Server on http://localhost:${PORT}`);
    console.log(`Connected to Mongo: ${MONGO_URI ? 'YES' : 'NO'}`);
  });
})();
