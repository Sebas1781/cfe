import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import localforage from 'localforage';

// Configurar localforage para almacenamiento offline
localforage.config({
  name: 'plataforma-cfe',
  storeName: 'forms',
});

const useFormStore = create(
  persist(
    (set, get) => ({
      formData: {},
      pendingForms: [],
      isSyncing: false,
      
      // Guardar datos del formulario
      saveFormData: (data) => set({ formData: data }),
      
      // Agregar formulario pendiente de envío
      addPendingForm: async (formData) => {
        const form = {
          id: Date.now(),
          data: formData,
          timestamp: new Date().toISOString(),
          synced: false,
        };
        
        // Guardar en IndexedDB
        await localforage.setItem(`form_${form.id}`, form);
        
        set((state) => ({
          pendingForms: [...state.pendingForms, form],
        }));
        
        return form.id;
      },
      
      // Sincronizar formularios pendientes
      syncPendingForms: async () => {
        set({ isSyncing: true });
        const { pendingForms } = get();
        
        for (const form of pendingForms) {
          try {
            // Detectar la URL del servidor
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const port = window.location.port || '3000';
            const baseURL = hostname === 'localhost' || hostname === '127.0.0.1'
              ? 'http://localhost:3000/api'
              : `${protocol}//${hostname}:${port}/api`;
            
            const response = await fetch(`${baseURL}/reports/generate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              },
              body: JSON.stringify(form.data)
            });
            
            if (response.ok) {
              // Eliminar de IndexedDB si se sincronizó exitosamente
              await localforage.removeItem(`form_${form.id}`);
              
              set((state) => ({
                pendingForms: state.pendingForms.filter((f) => f.id !== form.id),
              }));
              
              console.log('✅ Formulario sincronizado:', form.id);
            } else {
              console.error('❌ Error sincronizando formulario:', form.id);
            }
          } catch (error) {
            console.error('Error syncing form:', error);
          }
        }
        
        set({ isSyncing: false });
      },
      
      // Limpiar formulario actual
      clearFormData: () => set({ formData: {} }),
    }),
    {
      name: 'form-storage',
    }
  )
);

export default useFormStore;
