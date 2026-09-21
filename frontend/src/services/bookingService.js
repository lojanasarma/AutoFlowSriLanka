import api from '../api/axios';

const BASE_URL = '/bookings';

export const bookingService = {
  getAllBookings: async () => {
    const response = await api.get(BASE_URL);
    return response.data;
  },
  getBookingByRef: async (ref) => {
    const response = await api.get(`${BASE_URL}/ref/${ref}`);
    return response.data;
  },
  getMyBookings: async () => {
    const response = await api.get(`${BASE_URL}/my-bookings`);
    return response.data;
  },
  createBooking: async (bookingData) => {
    const response = await api.post(BASE_URL, bookingData);
    return response.data;
  },
  updateBookingStatus: async (bookingId, status) => {
    const response = await api.patch(`${BASE_URL}/${bookingId}/status`, null, { params: { status } });
    return response.data;
  },
  deleteBooking: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  }
};
