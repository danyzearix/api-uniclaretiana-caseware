import axios from 'axios';
import dotenv from 'dotenv';
import qs from 'qs';

dotenv.config();

const BASE_URL = process.env.BASEURL;

/**
 * Obtiene todos los contactos con paginación.
 */
export const getAllContacts = async (contactIds = []) => {
  if (!contactIds.length) return [];

  const todos = [];

  for (const id of contactIds) {
    try {
      const response = await axios.get(`${BASE_URL}/contacts`, {
        headers: { Authorization: `Bearer ${process.env.CLIENT_SECRET}` },
        params: {
          'filter[id]': id,
          limit: 1
        },
        paramsSerializer: params => qs.stringify(params, { encode: false })
      });

      const items = response.data._embedded?.contacts || [];
      todos.push(...items);

      console.log(`✅ Contacto recibido para ID ${id}: ${items.length}`);
    } catch (error) {
      console.error(`❌ Error al obtener contacto ${id}:`, error.response?.data || error.message);
    }
  }

  console.log(`✅ Total contactos recuperados: ${todos.length}`);
  return todos;
};


/**
 * Obtiene los leads filtrados por pipeline y por periodo SINU, incluyendo los contactos relacionados.
 */
export const getFilteredLeadsPorPeriodo = async () => {
  const todosLeads = [];
  let page = 1;
  let seguir = true;

  try {
    while (seguir) {
      const response = await axios.get(`${BASE_URL}/leads`, {
        headers: { Authorization: `Bearer ${process.env.CLIENT_SECRET}` },
        params: {
          'filter[pipeline_id]': 11109788,
          with: 'contacts',
          page,
          limit: 250
        },
        paramsSerializer: params => qs.stringify(params, { encode: false })
      });

      const leads = response.data._embedded?.leads || [];
      todosLeads.push(...leads);

      if (response.data._links?.next?.href) {
        page += 1;
      } else {
        seguir = false;
      }
    }

    return todosLeads;

  } catch (error) {
    console.error('❌ Error al obtener leads paginados:', error.response?.data || error.message);
    throw new Error('Error al obtener leads por periodo');
  }
};

/**
 * Método para llamar a todos los leads con filtro por periodo SINU.
 */
export const getLeads = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/leads`, {
      headers: {
        Authorization: `Bearer ${process.env.CLIENT_SECRET}`
      },
      params: {
        with: 'contacts',
        'filter[custom_fields_values][2102547]': 1521409
      },
      paramsSerializer: params => qs.stringify(params, { encode: false })
    });

    return response.data;

  } catch (error) {
    console.error('❌ Error al llamar a Kommo:', error.response?.data || error.message);
    throw new Error('Error al obtener leads');
  }
};

/**
 * Método para actualizar un solo lead por ID.
 */
export const updateLeadById = async (leadId, data) => {
  try {
    const response = await axios.patch(`${BASE_URL}/leads/${leadId}`, [data], {
      headers: {
        Authorization: `Bearer ${process.env.CLIENT_SECRET}`
      }
    });

    console.log(`✅ Lead ${leadId} actualizado correctamente:`, JSON.stringify(response.data, null, 2));
    return response.data;

  } catch (error) {
    console.error('❌ Error al actualizar el lead:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Método para obtener un solo lead por ID.
 */
export const getLeadById = async (leadId) => {
  try {
    const response = await axios.get(`${BASE_URL}/leads/${leadId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLIENT_SECRET}`
      }
    });
    return response.data;

  } catch (error) {
    console.error(`❌ Error al obtener lead ${leadId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Método para actualizar múltiples leads.
 */
export const updateMultipleLeads = async (leadsArray) => {
  try {
    console.log(`🚀 Enviando actualización a Kommo para ${leadsArray.length} leads`);
    console.log(JSON.stringify(leadsArray, null, 2));
    const response = await axios.patch(`${BASE_URL}/leads`, leadsArray, {
      headers: {
        Authorization: `Bearer ${process.env.CLIENT_SECRET}`
      }
    });
    return response.data;

  } catch (error) {
    console.error('❌ Error al actualizar múltiples leads:', error.response?.data || error.message);
    throw error;
  }
};

export const createContact = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/contacts`, [data], {
      headers: {
        Authorization: `Bearer ${process.env.CLIENT_SECRET}`
      }
    });
    return response.data._embedded.contacts[0];
  } catch (error) {
    console.error('❌ Error al crear contacto:', error.response?.data || error.message);
    throw error;
  }
};

export const createLead = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/leads`, [data], {
      headers: {
        Authorization: `Bearer ${process.env.CLIENT_SECRET}`
      }
    });
    return response.data._embedded.leads[0];
  } catch (error) {
    console.error('❌ Error al crear lead:', error.response?.data || error.message);
    throw error;
  }
};