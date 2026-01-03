// Detectar el protocolo y hostname actual
const protocol = window.location.protocol; // 'http:' o 'https:'
const hostname = window.location.hostname;
const port = window.location.port || '3000';

const API_URL = import.meta.env.VITE_API_URL || 
  (hostname === 'localhost' || hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : `${protocol}//${hostname}:${port}/api`); // Usa el protocolo actual

export const apiClient = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};

export default apiClient;
export { API_URL };
