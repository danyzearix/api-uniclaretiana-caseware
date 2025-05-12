import { getAllContacts, getFilteredLeadsPorPeriodo, updateMultipleLeads } from '../services/kommo.service.mjs';
import { esEstadoMasAvanzado, obtenerEnumId } from '../utils/estado.util.mjs';

export const syncLeadsFromJson = async (leadsExcel) => {
  const resultado = {
    actualizados: [],
    sin_cambios: [],
    no_encontrados: [],
    errores: []
  };

  try {
    const leadsKommo = await getFilteredLeadsPorPeriodo();
    const contactosKommo = await getAllContacts();

    const contactosMap = new Map();
    contactosKommo.forEach(c => contactosMap.set(c.id, c));

    const leadsParaActualizar = [];

    for (const leadExcel of leadsExcel) {
      const leadEmail = String(leadExcel.correo || '').trim().toLowerCase();
      const leadTelefono = String(leadExcel.telefono || '').replace(/\D/g, '');

      const match = leadsKommo.find(l => {
        const contactoId = l._embedded?.contacts?.[0]?.id;
        const contacto = contactosMap.get(contactoId);

        if (!contacto) return false;

        const emails = (contacto.custom_fields_values || [])
          .filter(f => f.field_code === 'EMAIL')
          .flatMap(f => f.values.map(v => (v.value || '').trim().toLowerCase()));

        const telefonos = (contacto.custom_fields_values || [])
          .filter(f => f.field_code === 'PHONE')
          .flatMap(f => f.values.map(v => (v.value || '').replace(/\D/g, '')));

        return emails.includes(leadEmail) || telefonos.includes(leadTelefono);
      });

      if (!match) {
        resultado.no_encontrados.push({ correo: leadExcel.correo, telefono: leadExcel.telefono });
        continue;
      }

      const etapaActual = match.custom_fields_values?.find(f => f.field_id === 2098097)?.values?.[0]?.value;
      const estadoNuevo = leadExcel.estado;

      if (!esEstadoMasAvanzado(etapaActual, estadoNuevo)) {
        resultado.sin_cambios.push({ id: match.id, etapaActual });
        continue;
      }

      const enum_id_nuevo = obtenerEnumId(estadoNuevo);
      if (!enum_id_nuevo) {
        resultado.errores.push({ id: match.id, error: 'Enum ID no encontrado' });
        continue;
      }

      leadsParaActualizar.push({
        id: match.id,
        name: leadExcel.nombre || match.name,
        custom_fields_values: [
          {
            field_id: 2098097,
            values: [{ enum_id: enum_id_nuevo }]
          }
        ]
      });

      resultado.actualizados.push({ id: match.id, nuevo_estado: estadoNuevo });
    }

    if (leadsParaActualizar.length > 0) {
      await updateMultipleLeads(leadsParaActualizar);
    }

    return resultado;

  } catch (error) {
    console.error('❌ Error general en sincronización:', error);
    throw error;
  }
};
