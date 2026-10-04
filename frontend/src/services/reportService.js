import api from '../api/axios';

export const reportService = {
  getSummary: async () => {
    const response = await api.get('/reports/summary');
    return response.data;
  }
};
