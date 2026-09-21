import api from '../api/axios';

const BASE_URL = '/notifications';

export const notificationService = {
  getUserNotifications: async (userId) => {
    const response = await api.get(`${BASE_URL}/user/${userId}`);
    return response.data;
  },
  sendNotification: async (notificationData) => {
    const response = await api.post(`${BASE_URL}/send`, notificationData);
    return response.data;
  },
  getAuditLogs: async (entity) => {
    const response = await api.get(`${BASE_URL}/audit/${entity}`);
    return response.data;
  },
  deleteNotification: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },
  deleteAuditLog: async (id) => {
    const response = await api.delete(`${BASE_URL}/audit/${id}`);
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await api.patch(`${BASE_URL}/${id}/status`);
    return response.data;
  },
  sendBulkNotification: async (role, templateId, channel) => {
    const response = await api.post(`${BASE_URL}/send-bulk?role=${role}&templateId=${templateId}&channel=${channel}`);
    return response.data;
  },
  getAllTemplates: async () => {
    const response = await api.get(`${BASE_URL}/templates`);
    return response.data;
  }
};
