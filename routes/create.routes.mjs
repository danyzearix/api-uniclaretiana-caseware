import { Router } from 'express';
import createLeadsTestRouter from '../controllers/create.leads.test.mjs';

const router = Router();

router.use('/', createLeadsTestRouter);

export default router;
