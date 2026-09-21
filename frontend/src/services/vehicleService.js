import api from '../api/axios';

const BASE_URL = '/vehicles';

export const vehicleService = {
  getAllVehicles: async () => {
    const response = await api.get(BASE_URL);
    return response.data;
  },
  getVehicleByRegNo: async (regNo) => {
    const response = await api.get(`${BASE_URL}/reg/${regNo}`);
    return response.data;
  },
  getVehiclesByOwner: async (ownerId) => {
    const response = await api.get(`${BASE_URL}/owner/${ownerId}`);
    return response.data;
  },
  getMyGarage: async () => {
    const response = await api.get(`${BASE_URL}/my-garage`);
    return response.data;
  },
  createVehicle: async (vehicleData) => {
    const response = await api.post(BASE_URL, vehicleData);
    return response.data;
  },
  updateVehicle: async (id, vehicleData) => {
    const response = await api.put(`${BASE_URL}/${id}`, vehicleData);
    return response.data;
  },
  deleteVehicle: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  }
};
