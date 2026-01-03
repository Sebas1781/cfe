import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import useFormStore from '../stores/formStore';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { reportService } from '../services/reportService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUser, faClipboardList, faDoorOpen } from '@fortawesome/free-solid-svg-icons';

export default function NuevoReporte() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' o 'satellite'
  const [markerPosition, setMarkerPosition] = useState({
    lat: 20.0876295,
    lng: -98.7674036
  });
  const [uploadedImages, setUploadedImages] = useState({});
  const [uploading, setUploading] = useState(false);

  const sidebarItems = [
    { icon: faHome, label: 'Dashboard', action: () => navigate('/dashboard') },
    { icon: faUser, label: 'Perfil', action: () => navigate('/perfil') },
    { icon: faClipboardList, label: 'Reportes', action: () => navigate('/reportes') },
    { icon: faDoorOpen, label: 'Cerrar Sesión', action: logout }
  ];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event, fieldName) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      files.forEach((file) => {
        uploadFormData.append(fieldName, file);
      });

      const result = await reportService.uploadImages(uploadFormData);
      
      // Agrupar por campo
      const currentImages = uploadedImages[fieldName] || [];
      const newImages = result.files.map(f => ({
        path: f.path,
        filename: f.filename,
        size: f.size,
        preview: URL.createObjectURL(files.find(file => file.name.includes(f.filename.split('_').pop())))
      }));

      setUploadedImages(prev => ({
        ...prev,
        [fieldName]: [...currentImages, ...newImages]
      }));

      // Actualizar formData con las rutas
      setFormData(prev => ({
        ...prev,
        fotografias: {
          ...(prev.fotografias || {}),
          [fieldName]: [...(prev.fotografias?.[fieldName] || []), ...result.files.map(f => f.path)]
        }
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error al subir imágenes: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (fieldName, index) => {
    const current = uploadedImages[fieldName] || [];
    const updated = current.filter((_, i) => i !== index);
    setUploadedImages(prev => ({ ...prev, [fieldName]: updated }));
    
    setFormData(prev => ({
      ...prev,
      fotografias: {
        ...(prev.fotografias || {}),
        [fieldName]: updated.map(img => img.path)
      }
    }));
  };

  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setMarkerPosition({ lat, lng });
    updateFormData('latitud', lat.toString());
    updateFormData('longitud', lng.toString());
    
    // Obtener dirección usando Geocoding
    updateFormData('direccion', 'Obteniendo dirección...');
    fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyC-g_SwMSxKdoeYDhbXPdgC6VFBSnf3yJo&language=es`)
      .then(res => res.json())
      .then(data => {
        console.log('Geocoding response:', data);
        if (data.status === 'REQUEST_DENIED') {
          updateFormData('direccion', '');
          alert('La API de Geocoding no está habilitada. Por favor, ingresa la dirección manualmente o habilita la Geocoding API en Google Cloud Console.');
        } else if (data.results && data.results[0]) {
          const address = data.results[0].formatted_address;
          console.log('Dirección obtenida:', address);
          updateFormData('direccion', address);
        } else {
          updateFormData('direccion', '');
          console.error('No se encontró dirección');
        }
      })
      .catch(err => {
        console.error('Error obteniendo dirección:', err);
        updateFormData('direccion', '');
      });
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMarkerPosition({ lat, lng });
          updateFormData('latitud', lat.toString());
          updateFormData('longitud', lng.toString());
          
          // Obtener dirección usando Geocoding
          updateFormData('direccion', 'Obteniendo dirección...');
          fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyC-g_SwMSxKdoeYDhbXPdgC6VFBSnf3yJo&language=es`)
            .then(res => res.json())
            .then(data => {
              console.log('Geocoding response:', data);
              if (data.status === 'REQUEST_DENIED') {
                updateFormData('direccion', '');
                alert('La API de Geocoding no está habilitada. Por favor, ingresa la dirección manualmente o habilita la Geocoding API en Google Cloud Console.');
              } else if (data.results && data.results[0]) {
                const address = data.results[0].formatted_address;
                console.log('Dirección obtenida:', address);
                updateFormData('direccion', address);
              } else {
                updateFormData('direccion', '');
                console.error('No se encontró dirección');
              }
            })
            .catch(err => {
              console.error('Error obteniendo dirección:', err);
              updateFormData('direccion', '');
            });
        },
        (error) => {
          alert('Error al obtener ubicación: ' + error.message);
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalización');
    }
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, 6));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      console.log('📤 Enviando reporte con datos:', formData);
      console.log('📸 Fotografías a enviar:', formData.fotografias);
      
      // Verificar si hay conexión a internet
      if (!navigator.onLine) {
        console.log('📵 Sin conexión - Guardando en caché local...');
        
        // Guardar en IndexedDB para sincronización posterior
        const { addPendingForm } = useFormStore.getState();
        await addPendingForm(formData);
        
        alert('✅ Reporte guardado offline\n\nSe sincronizará automáticamente cuando regreses a la red WiFi');
        navigate('/dashboard');
        return;
      }

      // Si hay conexión, enviar al servidor
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
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Reporte creado exitosamente');
        navigate('/dashboard');
      } else {
        alert('Error: ' + (data.error || 'No se pudo crear el reporte'));
      }
    } catch (error) {
      console.error('Error al crear reporte:', error);
      
      // Si falla la petición, también guardar offline
      console.log('📵 Error de conexión - Guardando en caché local...');
      const { addPendingForm } = useFormStore.getState();
      await addPendingForm(formData);
      
      alert('✅ Reporte guardado offline\n\nSe sincronizará automáticamente cuando regreses a la red WiFi');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:block w-64 bg-white shadow-lg">
        <div className="p-6">
          <img src="/IMAGES/logocfeNegro.png" alt="CFE" className="h-12 mb-8" />
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

      {/* Menú móvil */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ zIndex: 60 }}
      >
        <div className="p-6">
          <div className="flex justify-center mb-8">
            <img src="/IMAGES/logocfeNegro.png" alt="CFE" className="h-12" />
          </div>
          <nav className="space-y-2">
            {sidebarItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.action && item.action();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={item.icon} className="text-xl" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {menuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 mt-20 lg:mt-0 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#00A859] mb-2">Nuevo Reporte</h1>
            <p className="text-gray-600">Ingrese los datos necesarios para crear un nuevo reporte</p>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-lg shadow-md p-6 lg:p-8">
            
            {/* Step 1: Información Básica */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Tipo de mantenimiento:</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.tipoMantenimiento || ''}
                    onChange={(e) => updateFormData('tipoMantenimiento', e.target.value)}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="preventivo">Preventivo</option>
                    <option value="correctivo">Correctivo</option>
                    <option value="predictivo">Predictivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Modelo UTR:</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.modeloUTR || ''}
                    onChange={(e) => updateFormData('modeloUTR', e.target.value)}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="UTR-100">UTR-100</option>
                    <option value="UTR-200">UTR-200</option>
                    <option value="UTR-300">UTR-300</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Fecha de mantenimiento:</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.fechaMantenimiento || ''}
                    onChange={(e) => updateFormData('fechaMantenimiento', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Hora de inicio:</label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.horaInicio || ''}
                    onChange={(e) => updateFormData('horaInicio', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Hora de Término:</label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.horaTermino || ''}
                    onChange={(e) => updateFormData('horaTermino', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Responsable:</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.responsable || ''}
                    onChange={(e) => updateFormData('responsable', e.target.value)}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="Juan Pérez">Juan Pérez</option>
                    <option value="María González">María González</option>
                    <option value="Carlos López">Carlos López</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Licencia:</label>
                  <input
                    type="text"
                    placeholder="Licencia"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.licencia || ''}
                    onChange={(e) => updateFormData('licencia', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Registro:</label>
                  <input
                    type="text"
                    placeholder="Registro"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.registro || ''}
                    onChange={(e) => updateFormData('registro', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Restaurador:</label>
                  <input
                    type="text"
                    placeholder="Restaurador"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.restaurador || ''}
                    onChange={(e) => updateFormData('restaurador', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Circuito:</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.circuito || ''}
                    onChange={(e) => updateFormData('circuito', e.target.value)}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="Circuito A">Circuito A</option>
                    <option value="Circuito B">Circuito B</option>
                    <option value="Circuito C">Circuito C</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Área:</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.area || ''}
                    onChange={(e) => updateFormData('area', e.target.value)}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="Norte">Norte</option>
                    <option value="Sur">Sur</option>
                    <option value="Este">Este</option>
                    <option value="Oeste">Oeste</option>
                  </select>
                </div>

                {/* Mapa de ubicación */}
                <div>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setMapType('roadmap')}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        mapType === 'roadmap' ? 'bg-[#00A859] text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Mapa
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapType('satellite')}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        mapType === 'satellite' ? 'bg-[#00A859] text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Satélite
                    </button>
                  </div>
                  <GoogleMap
                    mapContainerClassName="w-full h-64 rounded-lg"
                    center={markerPosition}
                    zoom={15}
                    mapTypeId={mapType}
                    onClick={handleMapClick}
                  >
                    <Marker position={markerPosition} />
                  </GoogleMap>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Latitud:</label>
                  <input
                    type="text"
                    placeholder="20.0876295"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.latitud || markerPosition.lat}
                    onChange={(e) => {
                      updateFormData('latitud', e.target.value);
                      const lat = parseFloat(e.target.value);
                      if (!isNaN(lat)) {
                        setMarkerPosition(prev => ({ ...prev, lat }));
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Longitud:</label>
                  <input
                    type="text"
                    placeholder="-98.7674036"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.longitud || markerPosition.lng}
                    onChange={(e) => {
                      updateFormData('longitud', e.target.value);
                      const lng = parseFloat(e.target.value);
                      if (!isNaN(lng)) {
                        setMarkerPosition(prev => ({ ...prev, lng }));
                      }
                    }}
                  />
                </div>

                <button
                  type="button"
                  className="w-full py-3 bg-[#00A859] text-white rounded-lg font-medium hover:bg-[#008f4d] transition-colors"
                  onClick={getCurrentLocation}
                >
                  Obtener Ubicación
                </button>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Dirección:</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.direccion || ''}
                    onChange={(e) => updateFormData('direccion', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Radio/Gabinete */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Radio / Gabinete:</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.radioGabinete || ''}
                    onChange={(e) => updateFormData('radioGabinete', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Potencia de salida (W):</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.potenciaSalida || ''}
                    onChange={(e) => updateFormData('potenciaSalida', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">RSSI (dBm):</label>
                  <input
                    type="range"
                    min="-120"
                    max="-50"
                    className="w-full"
                    value={formData.rssi || -120}
                    onChange={(e) => updateFormData('rssi', e.target.value)}
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>-120</span>
                    <span className="font-medium">{formData.rssi || -120}</span>
                    <span>-50</span>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Umbral de recepción:</label>
                  <input
                    type="range"
                    min="-50"
                    max="0"
                    className="w-full"
                    value={formData.umbralRecepcion || -50}
                    onChange={(e) => updateFormData('umbralRecepcion', e.target.value)}
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>-50</span>
                    <span className="font-medium">{formData.umbralRecepcion || -50}</span>
                    <span>0</span>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Frecuencia Mhz:</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.frecuenciaMhz || ''}
                    onChange={(e) => updateFormData('frecuenciaMhz', e.target.value)}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="433">433 MHz</option>
                    <option value="868">868 MHz</option>
                    <option value="915">915 MHz</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Rx:</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.rx || ''}
                    onChange={(e) => updateFormData('rx', e.target.value)}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="RX1">RX1</option>
                    <option value="RX2">RX2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Tx:</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.tx || ''}
                    onChange={(e) => updateFormData('tx', e.target.value)}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="TX1">TX1</option>
                    <option value="TX2">TX2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Cable pigtail:</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.cablePigtail || ''}
                    onChange={(e) => updateFormData('cablePigtail', e.target.value)}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="N-Macho">N-Macho</option>
                    <option value="N-Hembra">N-Hembra</option>
                    <option value="SMA">SMA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Supresor:</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.supresor || ''}
                    onChange={(e) => updateFormData('supresor', e.target.value)}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="Si">Sí</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Cable de L.T.:</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.cableLT || ''}
                    onChange={(e) => updateFormData('cableLT', e.target.value)}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="LMR-400">LMR-400</option>
                    <option value="LMR-600">LMR-600</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Altura antena (m):</label>
                  <input
                    type="number"
                    placeholder="Altura antena"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.alturaAntena || ''}
                    onChange={(e) => updateFormData('alturaAntena', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Repetidor de enlace:</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.repetidorEnlace || ''}
                    onChange={(e) => updateFormData('repetidorEnlace', e.target.value)}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="Si">Sí</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Canal UCM:</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.canalUCM || ''}
                    onChange={(e) => updateFormData('canalUCM', e.target.value)}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="Canal 1">Canal 1</option>
                    <option value="Canal 2">Canal 2</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Actividades Realizadas */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">Seleccione las actividades realizadas:</p>
                {[
                  'Fotografías del Mantenimiento',
                  'Mediciones de RF',
                  'Mediciones de fuente de CD',
                  'Medición de batería',
                  'Limpieza de radio, conectores y supresor',
                  'Ajuste de tornillería',
                  'Cambio de antena',
                  'Impermeabilización de conectores',
                  'Redireccionamiento de entrada',
                  'Cambio de L.T.',
                  'Cambio de supresor',
                  'Cambio de radio',
                  'Cambio de pigtail',
                  'Cambio de Conectores'
                ].map((actividad, index) => (
                  <label key={index} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-[#00A859] border-gray-300 rounded focus:ring-[#00A859]"
                      checked={formData.actividades?.includes(actividad) || false}
                      onChange={(e) => {
                        const current = formData.actividades || [];
                        if (e.target.checked) {
                          updateFormData('actividades', [...current, actividad]);
                        } else {
                          updateFormData('actividades', current.filter(a => a !== actividad));
                        }
                      }}
                    />
                    <span className="text-gray-700">{actividad}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Step 4: Mediciones Técnicas */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Potencia de radio W:</label>
                  <input
                    type="number"
                    placeholder="Potencia Radio"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.potenciaRadio || ''}
                    onChange={(e) => updateFormData('potenciaRadio', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Potencia Incidente:</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.potenciaIncidente || ''}
                    onChange={(e) => updateFormData('potenciaIncidente', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Potencia Reflejada:</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.potenciaReflejada || ''}
                    onChange={(e) => updateFormData('potenciaReflejada', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">VSWR:</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.vswr || ''}
                    onChange={(e) => updateFormData('vswr', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Voltaje acometida Vca:</label>
                  <input
                    type="number"
                    placeholder="Voltaje Acometida"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.voltajeAcometida || ''}
                    onChange={(e) => updateFormData('voltajeAcometida', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Resistencia de Tierra:</label>
                  <input
                    type="number"
                    placeholder="Resistencia Tierra"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.resistenciaTierra || ''}
                    onChange={(e) => updateFormData('resistenciaTierra', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Voltaje fuente Vcd:</label>
                  <input
                    type="number"
                    placeholder="Voltaje Fuente Vcd"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.voltajeFuente || ''}
                    onChange={(e) => updateFormData('voltajeFuente', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Resistencia de batería:</label>
                  <input
                    type="number"
                    placeholder="Resistencia Batería"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.resistenciaBateria || ''}
                    onChange={(e) => updateFormData('resistenciaBateria', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Porcentaje de vida de la batería:</label>
                  <input
                    type="number"
                    placeholder="Porcentaje de vida de batería"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.porcentajeBateria || ''}
                    onChange={(e) => updateFormData('porcentajeBateria', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Ángulo de Azimut:</label>
                  <input
                    type="number"
                    placeholder="Ángulo de azimut"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.anguloAzimut || ''}
                    onChange={(e) => updateFormData('anguloAzimut', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Materiales y Observaciones */}
            {currentStep === 5 && (
              <div className="space-y-6">
                {[
                  'Placa con nomenclatura',
                  'Sellado de gabinete',
                  'Protector antifauna',
                  'Cuchillas de Bypass',
                  'Cuchillas laterales',
                  'Bajante de tierra',
                  'Terminales PAT',
                  'Apartarrayos',
                  'Cable RF sujetado'
                ].map((material, index) => (
                  <label key={index} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-[#00A859] border-gray-300 rounded focus:ring-[#00A859]"
                      checked={formData.materiales?.includes(material) || false}
                      onChange={(e) => {
                        const current = formData.materiales || [];
                        if (e.target.checked) {
                          updateFormData('materiales', [...current, material]);
                        } else {
                          updateFormData('materiales', current.filter(m => m !== material));
                        }
                      }}
                    />
                    <span className="text-gray-700">{material}</span>
                  </label>
                ))}

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Calibre bajante:</label>
                  <input
                    type="text"
                    placeholder="Calibre Bajante"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.calibreBajante || ''}
                    onChange={(e) => updateFormData('calibreBajante', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Observaciones:</label>
                  <textarea
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.observaciones || ''}
                    onChange={(e) => updateFormData('observaciones', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 6: Fotografías */}
            {currentStep === 6 && (
              <div className="space-y-6">
                {[
                  { label: 'Estructura Completa', name: 'estructuraCompleta' },
                  { label: 'Gabinete', name: 'gabinete' },
                  { label: 'Radio', name: 'radio' },
                  { label: 'Supresor', name: 'supresor' },
                  { label: 'Restaurador', name: 'restaurador' },
                  { label: 'Terminal de tierra', name: 'terminalTierra' },
                  { label: 'Bajante de tierra', name: 'bajanteTierra' },
                  { label: 'Placa', name: 'placa' },
                  { label: 'Imagen adicional', name: 'imagenAdicional' }
                ].map((foto, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <label className="block text-gray-700 font-medium mb-3">{foto.label}:</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          id={`file-${foto.name}`}
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, foto.name)}
                          disabled={uploading}
                        />
                        <label
                          htmlFor={`file-${foto.name}`}
                          className={`px-6 py-2 bg-[#00A859] text-white rounded-lg cursor-pointer transition-colors ${
                            uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#008f4d]'
                          }`}
                        >
                          {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
                        </label>
                        <span className="text-gray-500">
                          {uploadedImages[foto.name]?.length > 0
                            ? `${uploadedImages[foto.name].length} archivo(s) seleccionado(s)`
                            : 'Sin archivos seleccionados'}
                        </span>
                      </div>
                      
                      {/* Preview de imágenes */}
                      {uploadedImages[foto.name]?.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                          {uploadedImages[foto.name].map((img, imgIndex) => (
                            <div key={imgIndex} className="relative group">
                              <img
                                src={img.preview}
                                alt={`Preview ${imgIndex + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(foto.name, imgIndex)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {(img.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Código de Radio:</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                    value={formData.codigoRadio || ''}
                    onChange={(e) => updateFormData('codigoRadio', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Botones de navegación */}
            <div className="flex justify-between pt-8 mt-8 border-t border-gray-200">
              <button
                onClick={handlePrev}
                disabled={currentStep === 1}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  currentStep === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                Anterior
              </button>

              {currentStep < 6 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-[#00A859] text-white rounded-lg hover:bg-[#008f4d] transition-colors"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-[#00A859] text-white rounded-lg hover:bg-[#008f4d] transition-colors"
                >
                  Crear Reporte
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
