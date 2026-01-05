import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { apiClient } from '../config/api';
import useAuthStore from '../stores/authStore';
import { reportService } from '../services/reportService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, faUser, faClipboardList, faDoorOpen, 
  faQrcode, faArrowLeft, faDownload 
} from '@fortawesome/free-solid-svg-icons';

export default function ScannerQR() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const scannerRef = useRef(null);

  const sidebarItems = [
    { icon: faHome, label: 'Dashboard', action: () => navigate('/dashboard') },
    { icon: faUser, label: 'Perfil', action: () => navigate('/perfil') },
    { icon: faClipboardList, label: 'Reportes', action: () => navigate('/reportes') },
    { icon: faDoorOpen, label: 'Cerrar Sesión', action: logout }
  ];

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error('Error clearing scanner:', err));
      }
    };
  }, []);

  const iniciarScanner = () => {
    setScanning(true);
    setError('');
    setResult(null);

    // Esperar a que el DOM esté listo antes de inicializar el scanner
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      scannerRef.current = scanner;

      scanner.render(onScanSuccess, onScanError);
    }, 100);
  };

  const onScanSuccess = async (decodedText) => {
    console.log('QR escaneado:', decodedText);
    
    // Detener el scanner
    if (scannerRef.current) {
      await scannerRef.current.clear();
      scannerRef.current = null;
    }
    
    setScanning(false);

    // Buscar el restaurador por código QR
    try {
      const response = await apiClient.get(`/restauradores/qr/${decodedText}`);
      setResult(response);
    } catch (error) {
      console.error('Error al buscar restaurador:', error);
      setError('Código QR no reconocido o restaurador no encontrado');
    }
  };

  const onScanError = (errorMessage) => {
    // Ignorar errores de escaneo continuo
    if (!errorMessage.includes('NotFoundException')) {
      console.log('Error de escaneo:', errorMessage);
    }
  };

  const detenerScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const verEnMapa = () => {
    if (result) {
      navigate('/restauradores', { 
        state: { 
          restauradorId: result.id,
          lat: result.latitud,
          lng: result.longitud
        } 
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:block w-64 bg-white shadow-lg">
        <div className="p-6">
          <div className="flex justify-center mb-8">
            <img src="/IMAGES/logocfeNegro.png" alt="CFE" className="h-12" />
          </div>
          <nav className="space-y-2">
            {sidebarItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={item.icon} className="text-xl" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="flex items-center justify-between p-4">
          <div className="w-6"></div>
          <img src="/IMAGES/logocfeNegro.png" alt="CFE" className="h-10" />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-700 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex justify-center mb-8">
            <img src="/IMAGES/logocfeNegro.png" alt="CFE" className="h-12" />
          </div>
          <nav className="space-y-2">
            {sidebarItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={item.icon} className="text-xl" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:pt-0 pt-16">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            <FontAwesomeIcon icon={faQrcode} className="mr-2" />
            Escanear Código QR
          </h2>
          <button
            onClick={() => navigate('/restauradores')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Volver
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto">
            {!scanning && !result && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FontAwesomeIcon icon={faQrcode} className="text-blue-600 text-4xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Escanear Código QR</h3>
                <p className="text-gray-600 mb-6">
                  Escanea el código QR del restaurador para ver su ubicación y detalles
                </p>
                <button
                  onClick={iniciarScanner}
                  className="px-8 py-3 bg-[#00A859] text-white rounded-lg hover:bg-[#008744] transition-colors font-semibold"
                >
                  Iniciar Escáner
                </button>
              </div>
            )}

            {scanning && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                  Coloca el código QR frente a la cámara
                </h3>
                <div id="qr-reader" className="mb-4"></div>
                <button
                  onClick={detenerScanner}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Detener Escáner
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
                <div className="flex items-center mb-2">
                  <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <h4 className="font-semibold text-red-800">Error</h4>
                </div>
                <p className="text-red-700">{error}</p>
                <button
                  onClick={() => {
                    setError('');
                    iniciarScanner();
                  }}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Intentar de nuevo
                </button>
              </div>
            )}

            {result && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Restaurador encontrado!</h3>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="border-b border-gray-200 pb-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nombre:</label>
                    <p className="text-lg font-semibold text-gray-800">{result.nombre}</p>
                  </div>
                  
                  <div className="border-b border-gray-200 pb-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Código QR:</label>
                    <p className="text-sm font-mono bg-gray-100 px-3 py-2 rounded">{result.codigo_qr}</p>
                  </div>
                  
                  <div className="border-b border-gray-200 pb-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Ubicación:</label>
                    <p className="text-sm text-gray-700">
                      {result.latitud.toFixed(6)}, {result.longitud.toFixed(6)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Reportes de Mantenimiento: <span className="font-bold">{result.reportes?.length || 0}</span>
                    </label>
                    {result.reportes && result.reportes.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {result.reportes.map((reporte) => (
                          <div key={reporte.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-semibold text-sm">Reporte #{reporte.id}</p>
                                <p className="text-xs text-gray-600">{reporte.tipo}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(reporte.fecha_mantenimiento).toLocaleDateString('es-MX')}
                                </p>
                              </div>
                              <button
                                onClick={async () => {
                                  try {
                                    await reportService.downloadReport(reporte.id);
                                  } catch (error) {
                                    console.error('Error descargando PDF:', error);
                                    alert('Error al descargar el PDF');
                                  }
                                }}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-semibold flex items-center gap-2"
                                title="Descargar PDF"
                              >
                                <FontAwesomeIcon icon={faDownload} />
                                PDF
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={verEnMapa}
                    className="flex-1 px-6 py-3 bg-[#00A859] text-white rounded-lg hover:bg-[#008744] transition-colors font-semibold"
                  >
                    📍 Ver en Mapa
                  </button>
                  <button
                    onClick={() => {
                      setResult(null);
                      setError('');
                    }}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                  >
                    Escanear Otro
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
