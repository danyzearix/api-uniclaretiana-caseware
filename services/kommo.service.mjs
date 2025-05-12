import axios from 'axios';
import dotenv from 'dotenv';
import qs from 'qs';


dotenv.config();

const BASE_URL = process.env.BASEURL;

// //Metodo para LLAMAR CONTACTOS
// export const getContacts = async () => {
//   const response = await axios.get(`${process.env.BASEURL}/contacts`, {
//     headers: {
//       Authorization: `Bearer ${process.env.CLIENT_SECRET}`
//     }
//   });
//   return response.data;
// };

export const getAllContacts = async () => {
  const todos = [];
  let page = 1;
  let continuar = true;

  try {
    while (continuar) {
      const response = await axios.get(`${process.env.BASEURL}/contacts`, {
        headers: {
          Authorization: `Bearer ${process.env.CLIENT_SECRET}`
        },
        params: {
          page,
          limit: 250
        }
      });

      const items = response.data._embedded?.contacts || [];
      todos.push(...items);

      if (response.data._links?.next?.href) {
        page += 1;
      } else {
        continuar = false;
      }
    }

    return todos;

  } catch (error) {
    console.error('❌ Error al obtener contactos:', error.response?.data || error.message);
    throw new Error('Error al obtener contactos');
  }
};

export const getFilteredLeadsPorPeriodo = async () => {
  const todosLeads = [];
  let page = 1;
  let seguir = true;

  try {
    while (seguir) {
      const response = await axios.get(`${BASE_URL}/leads`, {
        headers: {
          Authorization: `Bearer ${process.env.CLIENT_SECRET}`
        },
        params: {
          with: 'contacts',
          page,
          limit: 250
        },
        paramsSerializer: params => qs.stringify(params, { encode: false })
      });

      const leads = response.data._embedded?.leads || [];

      // Filtrar por PERIODO SINU
      const leadsFiltrados = leads.filter(lead =>
        lead.custom_fields_values?.some(f =>
          f.field_id === 2102547 &&
          f.values?.some(v => v.enum_id === 1521409)
        )
      );

      todosLeads.push(...leadsFiltrados);

      // Verificar si hay más páginas
      const nextHref = response.data._links?.next?.href;
      if (nextHref) {
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

//Metodo para LLAMAR todos los leads
export const getLeads = async () => {
  try {
    const response = await axios.get(`${process.env.BASEURL}/leads`, {
      headers: {
        Authorization: `Bearer ${process.env.CLIENT_SECRET}`
      },
      params: {
        with: 'contacts',
        filter: {
          custom_fields_values: {
            2102547: 1521409
          }
        }
      },
      paramsSerializer: params => qs.stringify(params, { encode: false })
    });

    return response.data;

  } catch (error) {
    console.error('❌ Error al llamar a Kommo:', error.response?.data || error.message);
    throw new Error('Error al obtener leads');
  }
};

//Metodo para ACTUALIZAR 1 lead por ID
export const updateLeadById = async (leadId, data) => {
  try {
    const response = await axios.patch(`${process.env.BASEURL}/leads/${leadId}`, [data], {
      headers: {
        Authorization: `Bearer ${process.env.CLIENT_SECRET}`
      }
    });

    console.log(`✅ Respuesta de Kommo para lead ${leadId}:`);
    console.log(JSON.stringify(response.data, null, 2)); // Mostrar respuesta de Kommo

    return response.data;
  } catch (error) {
    console.error('Error al actualizar el lead:', error.response?.data || error.message);
    throw error;
  }
};

//Método para LLAMAR 1 lead por ID
 
  export const getLeadById = async (leadId) => {
    try {
      const response = await axios.get(`${process.env.BASEURL}/leads/${leadId}`, {
        headers: {
          Authorization: `Bearer ${process.env.CLIENT_SECRET}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error al obtener lead con ID ${leadId}:`, error.response?.data || error.message);
      throw error;
    }
  };

  export const updateMultipleLeads = async (leadsArray) => {
    try {
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