import { useEffect, useState } from 'react';
import useFormStore from '../stores/formStore';
import { apiClient } from '../config/api';

/**
 * Hook personalizado para sincronización automática
 * Detecta cuando el servidor está disponible y sincroniza automáticamente
 */
const useNetworkSync = () => {
  const [isServerAvailable, setIsServerAvailable] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const { pendingForms, syncPendingForms } = useFormStore();

  // Verificar si el servidor está disponible
  const checkServerStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // Usar ruta relativa en producción
      const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
        : '/api';

      const response = await fetch(`${apiUrl}/health`, {
        signal: controller.signal,
        method: 'GET',
      });

      clearTimeout(timeoutId);
      const available = response.ok;
      setIsServerAvailable(available);
      return available;
    } catch (error) {
      setIsServerAvailable(false);
      return false;
    }
  };

  // Sincronizar datos cuando el servidor esté disponible
  const syncData = async () => {
    if (isSyncing || pendingForms.length === 0) {
      return;
    }

    setIsSyncing(true);
    console.log(`🔄 Sincronizando ${pendingForms.length} formularios pendientes...`);

    try {
      await syncPendingForms(apiClient);
      setLastSync(new Date());
      console.log('✅ Sincronización completada');
    } catch (error) {
      console.error('❌ Error durante la sincronización:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Verificar servidor periódicamente
  useEffect(() => {
    // Verificar inmediatamente al montar
    checkServerStatus();

    // Verificar cada 30 segundos
    const interval = setInterval(() => {
      checkServerStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Sincronizar cuando el servidor esté disponible y haya formularios pendientes
  useEffect(() => {
    if (isServerAvailable && pendingForms.length > 0 && !isSyncing) {
      syncData();
    }
  }, [isServerAvailable, pendingForms.length]);

  // Escuchar eventos de conexión del navegador
  useEffect(() => {
    const handleOnline = () => {
      console.log('📶 Conexión de internet detectada');
      checkServerStatus();
    };

    const handleOffline = () => {
      console.log('📵 Sin conexión a internet');
      setIsServerAvailable(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isServerAvailable,
    isSyncing,
    lastSync,
    pendingCount: pendingForms.length,
    syncNow: syncData,
    checkServer: checkServerStatus,
  };
};

export default useNetworkSync;
