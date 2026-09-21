import api from '../api/axios';

const BASE_URL = '/payments';

export const paymentService = {
  getPaymentsByBooking: async (bookingId) => {
    const response = await api.get(`${BASE_URL}/booking/${bookingId}`);
    return response.data;
  },
  getMyPayments: async () => {
    const response = await api.get(`${BASE_URL}/my-payments`);
    return response.data;
  },
  getInvoiceByPayment: async (paymentId) => {
    const response = await api.get(`${BASE_URL}/${paymentId}/invoice`);
    return response.data;
  },
  initiatePayment: async (paymentData) => {
    const response = await api.post(BASE_URL, paymentData);
    return response.data;
  },
  verifyPayment: async (paymentId) => {
    const response = await api.post(`${BASE_URL}/${paymentId}/verify`);
    return response.data;
  },
  requestRefund: async (refundData) => {
    const response = await api.post(`${BASE_URL}/refund`, refundData);
    return response.data;
  },
  deletePayment: async (paymentId) => {
    const response = await api.delete(`${BASE_URL}/${paymentId}`);
    return response.data;
  }
};
