import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { apiClient } from '../config/api';
import useAuthStore from '../stores/authStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, faUser, faClipboardList, faDoorOpen, 
  faMapMarkerAlt, faSave, faArrowLeft 
} from '@fortawesome/free-solid-svg-icons';
import QRCode from 'qrcode';

export default function NuevoRestaurador() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [nombre, setNombre] = useState('');
  const [markerPosition, setMarkerPosition] = useState({
    lat: 20.0876295,
    lng: -98.7674036
  });
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [restauradorCreado, setRestauradorCreado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const sidebarItems = [
    { icon: faHome, label: 'Dashboard', action: () => navigate('/dashboard') },
    { icon: faUser, label: 'Perfil', action: () => navigate('/perfil') },
    { icon: faClipboardList, label: 'Reportes', action: () => navigate('/reportes') },
    { icon: faDoorOpen, label: 'Cerrar Sesión', action: logout }
  ];

  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };

  const handleMapClick = useCallback((e) => {
    setMarkerPosition({
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      alert('Por favor ingrese un nombre para el restaurador');
      return;
    }

    try {
      setLoading(true);
      
      const response = await apiClient.post('/restauradores', {
        nombre: nombre.trim(),
        latitud: markerPosition.lat,
        longitud: markerPosition.lng
      });

      // Generar código QR
      const qrUrl = await QRCode.toDataURL(response.codigo_qr, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeUrl(qrUrl);
      setRestauradorCreado(response);
      
      alert('Restaurador creado exitosamente!');
    } catch (error) {
      console.error('Error al crear restaurador:', error);
      alert('Error al crear el restaurador');
    } finally {
      setLoading(false);
    }
  };

  const descargarQR = () => {
    const link = document.createElement('a');
    link.download = `QR-${restauradorCreado.codigo_qr}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const crearOtro = () => {
    setNombre('');
    setMarkerPosition({
      lat: 20.0876295,
      lng: -98.7674036
    });
    setQrCodeUrl('');
    setRestauradorCreado(null);
  };

  if (restauradorCreado) {
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
            <h2 className="text-2xl font-bold text-gray-800">Restaurador Creado</h2>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Restaurador creado exitosamente!</h3>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre:</label>
                  <p className="text-lg font-semibold">{restauradorCreado.nombre}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código QR:</label>
                  <p className="text-lg font-mono bg-gray-100 px-3 py-2 rounded">{restauradorCreado.codigo_qr}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación:</label>
                  <p className="text-sm text-gray-600">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                    {restauradorCreado.latitud.toFixed(6)}, {restauradorCreado.longitud.toFixed(6)}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mb-6">
                <h4 className="font-semibold text-gray-800 mb-4 text-center">Código QR del Restaurador</h4>
                <div className="flex justify-center mb-4">
                  <img src={qrCodeUrl} alt="QR Code" className="border-4 border-gray-200 rounded-lg" />
                </div>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Descarga e imprime este código QR para pegarlo en el restaurador físico
                </p>
                <button
                  onClick={descargarQR}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  📥 Descargar Código QR
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={crearOtro}
                  className="flex-1 px-4 py-3 bg-[#00A859] text-white rounded-lg hover:bg-[#008744] transition-colors font-semibold"
                >
                  + Crear Otro Restaurador
                </button>
                <button
                  onClick={() => navigate('/restauradores')}
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                >
                  Ver Mapa
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold text-gray-800">Agregar Nuevo Restaurador</h2>
          <button
            onClick={() => navigate('/restauradores')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Volver
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Nombre del Restaurador: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Restaurador Central A1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Ubicación en el Mapa: <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Haz clic en el mapa para seleccionar la ubicación del restaurador
                </p>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    zoom={13}
                    center={markerPosition}
                    onClick={handleMapClick}
                    options={{
                      streetViewControl: false
                    }}
                  >
                    <Marker
                      position={markerPosition}
                      draggable={true}
                      onDragEnd={(e) => {
                        setMarkerPosition({
                          lat: e.latLng.lat(),
                          lng: e.latLng.lng()
                        });
                      }}
                    />
                  </GoogleMap>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                  Coordenadas: {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-[#00A859] text-white rounded-lg hover:bg-[#008744] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} />
                      Crear Restaurador
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/restauradores')}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
