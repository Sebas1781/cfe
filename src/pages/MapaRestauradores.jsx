import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { apiClient } from '../config/api';
import useAuthStore from '../stores/authStore';
import { reportService } from '../services/reportService';
import QRCode from 'qrcode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, faUser, faClipboardList, faDoorOpen, 
  faPlus, faQrcode, faMapMarkerAlt, faClipboard, faDownload 
} from '@fortawesome/free-solid-svg-icons';

export default function MapaRestauradores() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [restauradores, setRestauradores] = useState([]);
  const [selectedRestaurador, setSelectedRestaurador] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [detallesRestaurador, setDetallesRestaurador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const sidebarItems = [
    { icon: faHome, label: 'Dashboard', action: () => navigate('/dashboard') },
    { icon: faUser, label: 'Perfil', action: () => navigate('/perfil') },
    { icon: faClipboardList, label: 'Reportes', action: () => navigate('/reportes') },
    { icon: faDoorOpen, label: 'Cerrar Sesión', action: logout }
  ];

  const mapContainerStyle = {
    width: '100%',
    height: 'calc(100vh - 80px)'
  };

  const center = {
    lat: 20.0876295,
    lng: -98.7674036
  };

  useEffect(() => {
    cargarRestauradores();
  }, []);

  const cargarRestauradores = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/restauradores');
      setRestauradores(response);
    } catch (error) {
      console.error('Error al cargar restauradores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (restaurador) => {
    setSelectedRestaurador(restaurador);
  };

  const handleVerDetalle = async (id) => {
    try {
      const response = await apiClient.get(`/restauradores/${id}`);
      setDetallesRestaurador(response);
      setShowDetails(true);
      setSelectedRestaurador(null);
      
      // Generar código QR
      const qrUrl = await QRCode.toDataURL(response.codigo_qr, {
        width: 250,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
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
        {/* Header */}
        <header className="bg-white shadow-sm p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Mapa de Restauradores</h2>
          
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/scanner-qr')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faQrcode} />
              <span className="hidden sm:inline">Escanear QR</span>
            </button>
            <button
              onClick={() => navigate('/nuevo-restaurador')}
              className="px-4 py-2 bg-[#00A859] text-white rounded-lg hover:bg-[#008744] transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span className="hidden sm:inline">Agregar Restaurador</span>
            </button>
          </div>
        </header>

        {/* Map */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-xl text-gray-600">Cargando mapa...</div>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={13}
              center={center}
              options={{
                mapTypeId: 'roadmap',
                streetViewControl: false,
                mapTypeControl: true
              }}
            >
              {restauradores.map((restaurador) => (
                <Marker
                  key={restaurador.id}
                  position={{ lat: restaurador.latitud, lng: restaurador.longitud }}
                  onClick={() => handleMarkerClick(restaurador)}
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="48" height="64" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32">
                        <defs>
                          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
                          </filter>
                        </defs>
                        <path fill="#00A859" stroke="#FFFFFF" stroke-width="1.5" filter="url(#shadow)" d="M12 0C7.0375 0 3 4.0375 3 9C3 15.75 12 24 12 24S21 15.75 21 9C21 4.0375 16.9625 0 12 0Z"/>
                        <circle cx="12" cy="9" r="4" fill="#FFFFFF"/>
                      </svg>
                    `),
                    scaledSize: new window.google.maps.Size(48, 64),
                    anchor: new window.google.maps.Point(24, 64)
                  }}
                />
              ))}

              {selectedRestaurador && (
                <InfoWindow
                  position={{
                    lat: selectedRestaurador.latitud,
                    lng: selectedRestaurador.longitud
                  }}
                  onCloseClick={() => setSelectedRestaurador(null)}
                >
                  <div className="p-2">
                    <h3 className="font-bold text-lg mb-2">{selectedRestaurador.nombre}</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />
                      {selectedRestaurador.latitud.toFixed(6)}, {selectedRestaurador.longitud.toFixed(6)}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      <FontAwesomeIcon icon={faClipboard} className="mr-1" />
                      Reportes: {selectedRestaurador.total_reportes || 0}
                    </p>
                    <button
                      onClick={() => handleVerDetalle(selectedRestaurador.id)}
                      className="w-full px-3 py-2 bg-[#00A859] text-white rounded-lg hover:bg-[#008744] transition-colors text-sm"
                    >
                      Ver detalle
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>

        {/* Modal de detalles */}
        {showDetails && detallesRestaurador && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{detallesRestaurador.nombre}</h3>
                    <p className="text-gray-600 mt-1">
                      Código QR: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{detallesRestaurador.codigo_qr}</span>
                    </p>
                    <p className="text-gray-600 mt-1">
                      Ubicación: {detallesRestaurador.latitud.toFixed(6)}, {detallesRestaurador.longitud.toFixed(6)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Sección del código QR */}
                {qrCodeUrl && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h4 className="font-bold text-lg mb-3">Código QR</h4>
                    <div className="flex items-center gap-4">
                      <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40 border-2 border-gray-300 rounded-lg shadow-sm" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-3">
                          Escanea este código QR para acceder rápidamente a la información del restaurador
                        </p>
                        <button 
                          onClick={() => {
                            const link = document.createElement('a');
                            link.download = `QR-${detallesRestaurador.codigo_qr}.png`;
                            link.href = qrCodeUrl;
                            link.click();
                          }} 
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <span>📥</span>
                          Descargar Código QR
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="font-bold text-lg mb-3">Reportes de Mantenimiento ({detallesRestaurador.reportes.length})</h4>
                  
                  {detallesRestaurador.reportes.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay reportes registrados para este restaurador</p>
                  ) : (
                    <div className="space-y-3">
                      {detallesRestaurador.reportes.map((reporte) => (
                        <div
                          key={reporte.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => navigate(`/reportes/${reporte.id}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-800">Reporte #{reporte.id}</h5>
                              <p className="text-sm text-gray-600 mt-1">Tipo: {reporte.tipo}</p>
                              <p className="text-sm text-gray-600">Responsable: {reporte.responsable}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(reporte.fecha_mantenimiento).toLocaleDateString('es-MX')}
                              </p>
                            </div>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await reportService.downloadReport(reporte.id);
                                } catch (error) {
                                  console.error('Error descargando PDF:', error);
                                  alert('Error al descargar el PDF');
                                }
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold flex items-center gap-2"
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

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
