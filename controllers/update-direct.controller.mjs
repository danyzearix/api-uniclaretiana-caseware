import express from 'express';
import { updateMultipleLeads } from '../services/kommo.service.mjs';

const router = express.Router();

router.post('/test-direct-update', async (req, res) => {
  try {
    const leads = req.body;

    if (!Array.isArray(leads) || leads.some(l => !l.id || !l.status_id)) {
      return res.status(400).json({ error: 'Debe enviar un arreglo de objetos con "id" y "status_id"' });
    }

    console.log('✅ JSON recibido para actualización directa:', leads);

    const resultados = [];
    const errores = [];

    for (let i = 0; i < leads.length; i += 10) {
      const grupo = leads.slice(i, i + 10);
      console.log(`📦 Enviando actualización a Kommo para ${grupo.length} leads`);

      try {
        const respuesta = await updateMultipleLeads(grupo);
        resultados.push(respuesta);
        await new Promise(r => setTimeout(r, 1000)); // espera de 1 segundo entre cada lote
      } catch (error) {
        console.error('❌ Error al actualizar grupo en Kommo:', error.message);
        errores.push({ grupo, error: error.message });
      }
    }

    return res.status(200).json({ mensaje: 'Actualización directa finalizada.', respuestasKommo: resultados, errores });
  } catch (error) {
    console.error('❌ Error general en la actualización directa:', error);
    return res.status(500).json({ error: 'Error interno durante la actualización directa.' });
  }
});

export default router;
