import axios from 'axios';

const api = axios.create({
  // Allow local development without a frontend .env file; deployments can override it.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:6062/api',
});



api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Log successful response
    // console.log('API Response:', {
    //   url: response.config.url,
    //   status: response.status,
    //   data: response.data,
    // });
    return response;
  },
  (error) => {
    // Log error response
    console.error('API request failed:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = `${import.meta.env.BASE_URL}login`;
    }
    return Promise.reject(error);
  }
);

export default api;
