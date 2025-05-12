import { KOMMO_ETAPA_ENUMS } from '../config/kommo.enums.mjs';

export const esEstadoMasAvanzado = (actual, nuevo) => {
  const estadoActual = KOMMO_ETAPA_ENUMS[actual?.toUpperCase()] || { orden: 0 };
  const estadoNuevo  = KOMMO_ETAPA_ENUMS[nuevo?.toUpperCase()] || { orden: 0 };
  return estadoNuevo.orden > estadoActual.orden;
};

export const obtenerEnumId = (estado) => {
  return KOMMO_ETAPA_ENUMS[estado?.toUpperCase()]?.enum_id || null;
};
