import express from 'express';
import dotenv from 'dotenv';


dotenv.config();

import authRoutes from './routes/auth.routes.mjs';
import syncRoutes from './routes/sync.routes.mjs';
import createRoutes from './routes/create.routes.mjs';
import updateDirectRoutes from './controllers/update-direct.controller.mjs';





const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use('/auth', authRoutes);
app.use('/sync', syncRoutes);
app.use('/create', createRoutes);
app.use('/update', updateDirectRoutes);



app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
