import { KOMMO_ETAPA_ENUMS } from '../config/kommo.enums.mjs';

export const esEstadoMasAvanzado = (actualEnumId, nuevoEstadoTexto) => {
  const estadoNuevo = KOMMO_ETAPA_ENUMS[nuevoEstadoTexto?.toUpperCase()];
  if (!estadoNuevo) return false;

  // Buscar el enum inverso por ID
  const estadoActual = Object.values(KOMMO_ETAPA_ENUMS).find(e => e.enum_id === actualEnumId);

  // Si no tiene estado actual, permitir avanzar
  if (!estadoActual) return true;

  return estadoNuevo.orden > estadoActual.orden;
};

export const obtenerEnumId = (estado) => {
  return KOMMO_ETAPA_ENUMS[estado?.toUpperCase()]?.enum_id || null;
};
