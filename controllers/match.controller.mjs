import { getFilteredLeadsPorPeriodo, getAllContacts } from '../services/kommo.service.mjs';
import { esEstadoMasAvanzado, obtenerEnumId } from '../utils/estado.util.mjs';
import { updateMultipleLeads } from '../services/kommo.service.mjs';
import { KOMMO_ETAPA_ENUMS } from '../config/kommo.enums.mjs';
import axios from 'axios';

import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.BASEURL;



export const testLeadMatchController = async (req, res) => {
  try {
    const leadsExcel = req.body;

    if (!Array.isArray(leadsExcel) || leadsExcel.length === 0) {
      return res.status(400).json({ error: 'El cuerpo debe ser un arreglo de leads.' });
    }

    console.log('✅ JSON recibido:', leadsExcel);

    const leadsKommo = await getFilteredLeadsPorPeriodo();
    console.log(`✅ Leads encontrados en pipeline: ${leadsKommo.length}`);

    const contactIds = leadsKommo.flatMap(l => l._embedded?.contacts?.map(c => c.id) || []);
    const uniqueContactIds = [...new Set(contactIds.filter(Boolean))];
    console.log(`✅ Contact IDs únicos extraídos:`, uniqueContactIds);

    const contactosKommo = await getAllContacts(uniqueContactIds);
    console.log(`✅ Contactos recuperados de Kommo: ${contactosKommo.length}`);

    const contactosMap = new Map();
    contactosKommo.forEach(c => contactosMap.set(c.id, c));

    const resultados = [];

    for (const leadExcel of leadsExcel) {
      const leadEmail = String(leadExcel.correo || '').trim().toLowerCase();
      const leadTelefono = String(leadExcel.telefono || '').replace(/\D/g, '');

      console.log(`🔍 Buscando coincidencia para: correo=${leadEmail}, telefono=${leadTelefono}`);

      const match = leadsKommo.find(l => {
        const contactosIds = l._embedded?.contacts?.map(c => c.id) || [];
        const contactos = contactosIds.map(id => contactosMap.get(id)).filter(Boolean);

        if (contactos.length === 0) return false;

        return contactos.some(contacto => {
          const emails = (contacto.custom_fields_values || [])
            .filter(f => f.field_code === 'EMAIL')
            .flatMap(f => f.values.map(v => (v.value || '').trim().toLowerCase()));

          const telefonos = (contacto.custom_fields_values || [])
            .filter(f => f.field_code === 'PHONE')
            .flatMap(f => f.values.map(v => (v.value || '').replace(/\D/g, '')));

          console.log(`📧 Emails del contacto:`, emails);
          console.log(`📞 Teléfonos del contacto:`, telefonos);

          return emails.includes(leadEmail) || telefonos.includes(leadTelefono);
        });
      });

      if (match) {
        const actualStatusId = match.status_id;
        const estadoNuevo = leadExcel.estado;
        const enumNuevo = obtenerEnumId(estadoNuevo);

        console.log(`🔄 Comparando estados: Actual Status ID = ${actualStatusId}, Nuevo Estado = ${estadoNuevo} (${enumNuevo})`);
        // ✅ Aquí empieza el nuevo bloque para completar Email o Teléfono
const contactoIdPrincipal = match._embedded?.contacts?.[0]?.id;
const contacto = contactosMap.get(contactoIdPrincipal);

if (contacto) {
  const customFields = contacto.custom_fields_values || [];
  const tieneEmailEnCRM = customFields.some(f => f.field_code === 'EMAIL' && f.values.length > 0);
  const tieneTelefonoEnCRM = customFields.some(f => f.field_code === 'PHONE' && f.values.length > 0);

  const actualizacionesContacto = [];

  if (!tieneEmailEnCRM && leadEmail) {
    console.log(`➕ Agregando EMAIL ${leadEmail} al contacto ID ${contacto.id}`);
    actualizacionesContacto.push({
      field_code: 'EMAIL',
      values: [{ value: leadEmail }]
    });
  }

  if (!tieneTelefonoEnCRM && leadTelefono) {
    console.log(`➕ Agregando TELÉFONO ${leadTelefono} al contacto ID ${contacto.id}`);
    actualizacionesContacto.push({
      field_code: 'PHONE',
      values: [{ value: leadTelefono }]
    });
  }

  if (actualizacionesContacto.length > 0) {
    try {
      const contactoUpdateResponse = await axios.patch(`${BASE_URL}/contacts/${contacto.id}`, {
        custom_fields_values: actualizacionesContacto
      }, {
        headers: { Authorization: `Bearer ${process.env.CLIENT_SECRET}` }
      });

      console.log('✅ Contacto actualizado en Kommo:', JSON.stringify(contactoUpdateResponse.data, null, 2));
    } catch (error) {
      console.error(`❌ Error al actualizar contacto ${contacto.id}:`, error.response?.data || error.message);
    }
  }
}

        resultados.push({
          correo: leadEmail,
          telefono: leadTelefono,
          encontrado: true,
          leadId: match.id,
          actualStatusId,
          nuevoEstado: estadoNuevo,
          nuevoEnumId: enumNuevo
        });

      } else {
        console.log(`❌ No se encontró coincidencia para: ${leadEmail} / ${leadTelefono}`);
        resultados.push({ correo: leadEmail, telefono: leadTelefono, encontrado: false });
      }
    }

    // Construir payload para actualización múltiple
const leadsParaActualizar = resultados
  .filter(r => r.encontrado && esEstadoMasAvanzado(r.actualStatusId, r.nuevoEstado))
  .map(r => ({
    id: r.leadId,
    status_id: r.nuevoEnumId
  }));

if (leadsParaActualizar.length > 0) {
  console.log('🚀 Ejecutando actualización real en Kommo para los siguientes leads:', JSON.stringify(leadsParaActualizar, null, 2));

  try {
    const updateResponse = await updateMultipleLeads(leadsParaActualizar);
    console.log('✅ Respuesta de Kommo:', JSON.stringify(updateResponse, null, 2));

    return res.status(200).json({ 
      resultados, 
      actualizados: leadsParaActualizar, 
      respuestaKommo: updateResponse 
    });
  } catch (error) {
    console.error('❌ Error al actualizar en Kommo:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Error al actualizar en Kommo', 
      detalle: error.response?.data || error.message 
    });
  }

} else {
  console.log('ℹ️ No hay leads para actualizar.');
  return res.status(200).json({ 
    resultados, 
    mensaje: 'No hay leads para actualizar.' 
  });
}

} catch (error) {
  console.error('❌ Error en testLeadMatchController:', error);
  return res.status(500).json({ error: 'Error interno al procesar la prueba.' });
}

};

