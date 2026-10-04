import api from '../api/axios';

const BASE_URL = '/fuel';

export const fuelService = {
  getAllStations: async () => {
    const response = await api.get(`${BASE_URL}/stations`);
    return response.data;
  },
  getFuelTypes: async () => {
    const response = await api.get(`${BASE_URL}/types`);
    return response.data;
  },
  createFuelType: async (fuelType) => {
    const response = await api.post(`${BASE_URL}/types`, fuelType);
    return response.data;
  },
  updateFuelTypeStatus: async (id, status) => {
    const response = await api.patch(`${BASE_URL}/types/${id}/status`, null, { params: { status } });
    return response.data;
  },
  getInventory: async (stationId) => {
    const response = await api.get(`${BASE_URL}/inventory`, { params: stationId ? { stationId } : {} });
    return response.data;
  },
  createInventory: async (inventory) => {
    const response = await api.post(`${BASE_URL}/inventory`, inventory);
    return response.data;
  },
  updateInventory: async (id, inventory) => {
    const response = await api.put(`${BASE_URL}/inventory/${id}`, inventory);
    return response.data;
  },
  updateStock: async (id, update) => {
    const response = await api.post(`${BASE_URL}/inventory/${id}/stock`, update);
    return response.data;
  },
  getStockMovements: async (stationId) => {
    const response = await api.get(`${BASE_URL}/stock-movements`, { params: stationId ? { stationId } : {} });
    return response.data;
  },
  getSummary: async (period, stationId) => {
    const response = await api.get(`${BASE_URL}/reports/summary`, { params: { period, ...(stationId ? { stationId } : {}) } });
    return response.data;
  },
  createStation: async (station) => {
    const response = await api.post(`${BASE_URL}/stations`, station);
    return response.data;
  },
  updateStation: async (id, station) => {
    const response = await api.put(`${BASE_URL}/stations/${id}`, station);
    return response.data;
  },
  deleteStation: async (id) => {
    const response = await api.delete(`${BASE_URL}/stations/${id}`);
    return response.data;
  },
  getLogsByVehicle: async (vehicleId) => {
    const response = await api.get(`${BASE_URL}/logs/vehicle/${vehicleId}`);
    return response.data;
  },
  getLogsByStation: async (stationId) => {
    const response = await api.get(`${BASE_URL}/logs/station/${stationId}`);
    return response.data;
  },
  recordFuelLog: async (logData) => {
    const response = await api.post(`${BASE_URL}/logs`, logData);
    return response.data;
  },
  updateLogStatus: async (logId, status) => {
    const response = await api.patch(`${BASE_URL}/logs/${logId}/status`, null, { params: { status } });
    return response.data;
  },
  deleteFuelLog: async (logId) => {
    const response = await api.delete(`${BASE_URL}/logs/${logId}`);
    return response.data;
  }
};
