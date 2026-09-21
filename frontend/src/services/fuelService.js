import api from '../api/axios';

const BASE_URL = '/fuel';

export const fuelService = {
  getAllStations: async () => {
    const response = await api.get(`${BASE_URL}/stations`);
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
