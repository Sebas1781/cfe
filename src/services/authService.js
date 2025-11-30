import apiClient from '../config/api';

export const authService = {
  // Login con API backend
  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      localStorage.setItem('authToken', response.token);
      return response.user;
    } catch (error) {
      throw new Error('Credenciales inválidas');
    }
  },
  
  // Logout
  async logout() {
    try {
      localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  },
  
  // Verificar si el usuario está autenticado
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },
};
