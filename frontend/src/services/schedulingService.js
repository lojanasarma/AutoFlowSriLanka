import axios from 'axios';

const API_URL = 'http://localhost:8080/api/scheduling';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const schedulingService = {
  getAllCentres: async () => {
    const response = await axios.get(`${API_URL}/centres`, getAuthHeader());
    return response.data;
  },

  getBaysByCentre: async (centreId) => {
    const response = await axios.get(`${API_URL}/bays?centreId=${centreId}`, getAuthHeader());
    return response.data;
  },

  getSlots: async (centreId) => {
    const url = centreId ? `${API_URL}/slots?centreId=${centreId}` : `${API_URL}/slots`;
    const response = await axios.get(url, getAuthHeader());
    return response.data;
  },

  createTimeSlot: async (data) => {
    const response = await axios.post(`${API_URL}/slots`, data, getAuthHeader());
    return response.data;
  },

  createBay: async (data) => {
    const response = await axios.post(`${API_URL}/bays`, data, getAuthHeader());
    return response.data;
  },
  createCentre: async (data) => {
    const response = await axios.post(`${API_URL}/centres`, data, getAuthHeader());
    return response.data;
  },
  updateCentre: async (id, data) => {
    const response = await axios.put(`${API_URL}/centres/${id}`, data, getAuthHeader());
    return response.data;
  },
  deleteCentre: async (id) => {
    const response = await axios.delete(`${API_URL}/centres/${id}`, getAuthHeader());
    return response.data;
  },
  updateBay: async (id, data) => {
    const response = await axios.put(`${API_URL}/bays/${id}`, data, getAuthHeader());
    return response.data;
  },
  deleteBay: async (id) => {
    const response = await axios.delete(`${API_URL}/bays/${id}`, getAuthHeader());
    return response.data;
  }
};
