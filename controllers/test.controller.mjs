import { updateLeadById } from '../services/kommo.service.mjs';

export const actualizarEtapaLeadCustomField = async (req, res) => {
  const { lead_id, enum_id } = req.body;

  if (!lead_id || !enum_id) {
    return res.status(400).json({ error: 'lead_id y enum_id son requeridos' });
  }

  try {
    const payload = {
      id: lead_id,
      custom_fields_values: [
        {
          field_id: 2098097, // ETAPA DEL LEAD
          values: [{ enum_id }]
        }
      ]
    };

    const result = await updateLeadById(lead_id, payload);
    res.json({ message: 'Lead actualizado', result });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el lead', detalle: error.message });
  }
};
