import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';


dotenv.config();

import authRoutes from './routes/auth.routes.mjs';
import syncRoutes from './routes/sync.routes.mjs';
import createRoutes from './routes/create.routes.mjs';
import updateDirectRoutes from './controllers/update-direct.controller.mjs';

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: 'http://localhost:5173', // frontend
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));



app.use(express.json({ limit: '10mb' }));
app.use('/auth', authRoutes);
app.use('/sync', syncRoutes);
app.use('/create', createRoutes);
app.use('/update', updateDirectRoutes);



app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
