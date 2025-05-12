import { Router } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import { syncLeadsFromJson } from '../controllers/sync.controller.mjs';
import { testLeadMatchController } from '../controllers/match.controller.mjs';

const router = Router();
const upload = multer({ dest: 'uploads/' });

/**
 * POST /sync/leads/upload
 * Recibe un archivo .json de leads normalizados y sincroniza con Kommo
 */

router.post('/leads/upload', upload.single('archivo'), async (req, res) => {
  try {
    const filePath = req.file.path;

    // Leer y parsear el contenido JSON
    const contenido = await fs.readFile(filePath, 'utf-8');
    const leads = JSON.parse(contenido);

    if (!Array.isArray(leads)) {
      return res.status(400).json({ error: 'El archivo debe contener un array JSON de leads' });
    }

    const resultado = await syncLeadsFromJson(leads);
    res.json(resultado);
  } catch (error) {
    console.error('Error al procesar archivo JSON:', error);
    res.status(500).json({ error: 'Error al procesar archivo JSON' });
  }
});



router.post('/test-match', testLeadMatchController);


export default router;
