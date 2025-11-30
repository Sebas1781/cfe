import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      role: null, // 'admin' or 'trabajador'
      
      login: (userData) => set({
        user: userData,
        isAuthenticated: true,
        role: userData.role,
      }),
      
      logout: () => {
        localStorage.removeItem('authToken');
        set({
          user: null,
          isAuthenticated: false,
          role: null,
        });
      },
      
      updateUser: (userData) => set({ user: userData }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;
