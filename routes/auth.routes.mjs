import { Router } from 'express';
import { getLeads, getLeadById, updateLeadById } from '../services/kommo.service.mjs';
import { getFilteredLeadsPorPeriodo } from '../services/kommo.service.mjs';
import { actualizarEtapaLeadCustomField } from '../controllers/test.controller.mjs';


const router = Router();

router.get('/leads', async (req, res) => {
    try {
      const leads = await getFilteredLeadsPorPeriodo(); // trae paginados y filtrados
      res.json({ cantidad: leads.length, leads });
    } catch (error) {
      console.error('Error al obtener leads filtrados:', error);
      res.status(500).json({ error: 'Error al obtener leads filtrados' });
    }
  });

router.get('/leads/:id', async (req, res) => {
    const leadId = req.params.id;
    try {
      const lead = await getLeadById(leadId);
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: `Error al obtener el lead con ID ${leadId}` });
    }
  });
  

router.put('/leads/:id', async (req, res) => {
    const leadId = req.params.id;
    const updateData = req.body;
  
    try {
      const updated = await updateLeadById(leadId, updateData);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar el lead' });
    }
  });


  router.post('/lead/update-etapa', actualizarEtapaLeadCustomField);

export default router;
