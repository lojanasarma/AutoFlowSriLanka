import api from '../api/axios';

const BASE_URL = '/users';

export const userService = {
  getAllUsers: async () => {
    const response = await api.get(BASE_URL);
    return response.data;
  },
  createUser: async (userData) => {
    const response = await api.post(BASE_URL, userData);
    return response.data;
  },
  updateUser: async (id, userData) => {
    const response = await api.put(`${BASE_URL}/${id}`, userData);
    return response.data;
  },

  updateMyProfile: async (userData) => {
    const response = await api.patch('/users/me', userData);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  }
};
