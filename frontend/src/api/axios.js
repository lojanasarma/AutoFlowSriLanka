import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for centralized error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      
      if (status === 400) {
        message.error('Bad Request. Please check your input.');
      } else if (status === 401) {
        message.error('Unauthorized. Please login again.');
      } else if (status === 403) {
        message.error('Forbidden. You do not have permission to perform this action.');
      } else if (status === 404) {
        message.error('Resource not found.');
      } else if (status >= 500) {
        message.error('Server error. Please try again later.');
      }
    } else if (error.request) {
      // The request was made but no response was received
      message.error('Network error. Cannot connect to the server.');
    } else {
      // Something happened in setting up the request that triggered an Error
      message.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
