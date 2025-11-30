import { useEffect, useState } from 'react';
import useNetworkSync from '../hooks/useNetworkSync';

/**
 * Componente que muestra el estado de conexión y sincronización
 * Se muestra solo cuando hay datos pendientes o durante la sincronización
 */
const NetworkStatus = () => {
  const { isServerAvailable, isSyncing, pendingCount, lastSync, syncNow } = useNetworkSync();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Mostrar banner si hay datos pendientes o está sincronizando
    setShowBanner(pendingCount > 0 || isSyncing);
  }, [pendingCount, isSyncing]);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div
        className={`rounded-lg shadow-lg p-4 ${
          isServerAvailable
            ? 'bg-green-600 text-white'
            : 'bg-yellow-600 text-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isSyncing ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="font-semibold">Sincronizando...</span>
              </>
            ) : isServerAvailable ? (
              <>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-semibold">Servidor conectado</span>
              </>
            ) : (
              <>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="font-semibold">Modo offline</span>
              </>
            )}
          </div>

          {!isSyncing && isServerAvailable && pendingCount > 0 && (
            <button
              onClick={syncNow}
              className="ml-4 px-3 py-1 bg-white text-green-600 rounded text-sm font-medium hover:bg-green-50"
            >
              Sincronizar ahora
            </button>
          )}
        </div>

        <div className="mt-2 text-sm">
          {isSyncing ? (
            <p>Subiendo datos al servidor...</p>
          ) : isServerAvailable ? (
            <p>
              {pendingCount} {pendingCount === 1 ? 'formulario' : 'formularios'}{' '}
              {pendingCount > 0 ? 'listo para sincronizar' : 'sincronizados'}
            </p>
          ) : (
            <p>
              {pendingCount} {pendingCount === 1 ? 'formulario guardado' : 'formularios guardados'} offline.
              <br />
              Se sincronizarán al conectar a la red.
            </p>
          )}
        </div>

        {lastSync && (
          <div className="mt-1 text-xs opacity-75">
            Última sincronización: {lastSync.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;
