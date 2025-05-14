import { getFilteredLeadsPorPeriodo, getAllContacts, createContact, createLead } from '../services/kommo.service.mjs';
import { obtenerEnumId as obtenerEtapaEnum } from '../utils/estado.util.mjs';
import { OBTENER_ENUM_ID_PROGRAMA } from '../config/kommo.programa.enums.mjs';

import express from 'express';

const router = express.Router();

router.post('/test-create-leads', async (req, res) => {
  try {
    const leadsExcel = req.body;

    if (!Array.isArray(leadsExcel) || leadsExcel.length === 0) {
      return res.status(400).json({ error: 'El cuerpo debe ser un arreglo de leads.' });
    }

    console.log('✅ JSON recibido con', leadsExcel.length, 'leads');

    const leadsKommo = await getFilteredLeadsPorPeriodo();
    const contactoIds = leadsKommo.flatMap(l => l._embedded?.contacts?.map(c => c.id) || []);
    const contactosKommo = await getAllContacts(contactoIds);

    const contactosMap = new Map();
    contactosKommo.forEach(c => contactosMap.set(c.id, c));

    const leadsParaCrear = [];

    for (const leadExcel of leadsExcel) {
      const email = String(leadExcel.correo || '').trim().toLowerCase();
      const telefono = String(leadExcel.telefono || '').replace(/\D/g, '');
      const documentoExcel = String(leadExcel.identificacion || '').trim();

      const existe = leadsKommo.some(lead => {
        const ids = lead._embedded?.contacts?.map(c => c.id) || [];
        return ids.some(id => {
          const contacto = contactosMap.get(id);
          if (!contacto) return false;

          const emails = (contacto.custom_fields_values || [])
            .filter(f => f.field_code === 'EMAIL')
            .flatMap(f => f.values.map(v => v.value.toLowerCase()));

          const telefonos = (contacto.custom_fields_values || [])
            .filter(f => f.field_code === 'PHONE')
            .flatMap(f => f.values.map(v => v.value.replace(/\D/g, '')));

          const documentos = (contacto.custom_fields_values || [])
            .filter(f => f.field_id === 1110886)
            .flatMap(f => f.values.map(v => String(v.value).trim()));

          return (
            emails.includes(email) ||
            telefonos.includes(telefono) ||
            documentos.includes(documentoExcel)
          );
        });
      });

      if (!existe) leadsParaCrear.push(leadExcel);
    }

    console.log(`🟠 Hay ${leadsParaCrear.length} leads/contactos por crear.`);

    const creados = [];
    const errores = [];

    for (const item of leadsParaCrear) {
      try {
        const contactoPayload = {
          name: item.nombre,
          custom_fields_values: [
            {
              field_code: 'EMAIL',
              values: [{ value: item.correo }]
            },
            {
              field_code: 'PHONE',
              values: [{ value: String(item.telefono).replace(/\D/g, '') }]
            },
            {
              field_id: 1110886,
              values: [{ value: item.identificacion }]
            }
          ]
        };

        const contactoRes = await createContact(contactoPayload);
        const contactoId = contactoRes.id;

        const etapaId = obtenerEtapaEnum(item.estado);
        const programaEnumId = OBTENER_ENUM_ID_PROGRAMA(item.programa);

        const leadPayload = {
          name: item.nombre,
          status_id: etapaId,
          pipeline_id: 11109788,
          _embedded: {
            contacts: [{ id: contactoId }]
          },
          custom_fields_values: [
            {
              field_id: 2102531,
              values: [{ enum_id: programaEnumId }]
            }
          ]
        };

        const leadRes = await createLead(leadPayload);
        creados.push({ contacto_id: contactoId, lead_id: leadRes.id });

      } catch (error) {
        console.error('❌ Error al crear contacto y lead:', error.response?.data || error.message);
        errores.push({ data: item, error: error.message });
      }
    }

    return res.status(200).json({ mensaje: `Se intentaron crear ${leadsParaCrear.length} leads/contactos`, resultado: { creados, errores } });
  } catch (error) {
    console.error('❌ Error en test-create-leads:', error);
    return res.status(500).json({ error: 'Error interno al procesar la comparación.' });
  }
});

export default router;



