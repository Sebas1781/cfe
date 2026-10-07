import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUser, faClipboardList, faDoorOpen } from '@fortawesome/free-solid-svg-icons';
import useAuthStore from '../stores/authStore';
import { reportService } from '../services/reportService';
import { SERVER_URL } from '../config/api';

const FOTOS = [
  { label: 'Estructura Completa', name: 'estructuraCompleta' },
  { label: 'Gabinete', name: 'gabinete' },
  { label: 'Radio', name: 'radio' },
  { label: 'Supresor', name: 'supresor' },
  { label: 'Restaurador', name: 'restaurador' },
  { label: 'Terminal de tierra', name: 'terminalTierra' },
  { label: 'Bajante de tierra', name: 'bajanteTierra' },
  { label: 'Placa', name: 'placa' },
  { label: 'Imagen adicional', name: 'imagenAdicional' },
];

const parseJSON = (value, fallback) => {
  if (typeof value !== 'string') return value || fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const formatFecha = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d) ? value : d.toLocaleDateString('es-MX');
};

function Campo({ label, value }) {
  return (
    <div>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-gray-900 font-medium break-words">
        {value !== null && value !== undefined && value !== '' ? value : '—'}
      </dd>
    </div>
  );
}

function Seccion({ titulo, children }) {
  return (
    <section className="bg-white rounded-lg shadow-md overflow-hidden">
      <h2 className="bg-[#00A859] text-white font-semibold px-6 py-3">{titulo}</h2>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Grid({ campos }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
      {campos.map(([label, value]) => (
        <Campo key={label} label={label} value={value} />
      ))}
    </dl>
  );
}

export default function VerReporte() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [foto, setFoto] = useState(null);
  const [cerrando, setCerrando] = useState(false);

  const sidebarItems = [
    { icon: faHome, label: 'Dashboard', action: () => navigate('/dashboard') },
    { icon: faUser, label: 'Perfil', action: () => navigate('/perfil') },
    { icon: faClipboardList, label: 'Reportes', action: () => navigate('/reportes') },
    { icon: faDoorOpen, label: 'Cerrar Sesión', action: logout },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        setReporte(await reportService.getReportById(id));
      } catch (err) {
        console.error('Error cargando reporte:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDownloadPDF = async () => {
    try {
      await reportService.downloadReport(id);
    } catch {
      alert('PDF no disponible. Edita y guarda el reporte para regenerarlo.');
    }
  };

  const cerrarFoto = () => {
    setCerrando(true);
    setTimeout(() => {
      setFoto(null);
      setCerrando(false);
    }, 200);
  };

  useEffect(() => {
    if (!foto) return;
    const onKey = (e) => e.key === 'Escape' && cerrarFoto();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [foto]);

  const fotografias = parseJSON(reporte?.fotografias, {});
  const actividades = parseJSON(reporte?.actividades, []);
  const materiales = parseJSON(reporte?.materiales, []);
  const fotoUrl = (path) => (path.startsWith('http') ? path : `${SERVER_URL}/${path}`);
  const listaFotos = FOTOS.flatMap((f) =>
    (fotografias?.[f.name] || []).map((path) => ({ label: f.label, path }))
  );
  const tieneCoordenadas = reporte?.latitud && reporte?.longitud;

  const nav = (
    <nav className="space-y-2">
      {sidebarItems.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.action();
            setMenuOpen(false);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FontAwesomeIcon icon={item.icon} className="text-xl" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white shadow-lg sticky top-0 h-screen self-start overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-center mb-8">
            <img src="/IMAGES/logocfeNegro.png" alt="CFE" className="h-16" />
          </div>
          {nav}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="flex items-center justify-between p-4">
          <div className="w-6"></div>
          <img src="/IMAGES/logocfeNegro.png" alt="CFE" className="h-10" />
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-700 focus:outline-none">
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

      {menuOpen && <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMenuOpen(false)} />}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex justify-center mb-8">
            <img src="/IMAGES/logocfeNegro.png" alt="CFE" className="h-16" />
          </div>
          {nav}
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 p-6 pt-20 lg:pt-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          {loading && <p className="text-center text-gray-500 py-12">Cargando reporte...</p>}

          {error && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600 mb-4">No se pudo cargar el reporte.</p>
              <button
                onClick={() => navigate('/reportes')}
                className="px-6 py-2 bg-[#00A859] text-white rounded-lg hover:bg-[#008f4d] transition-colors"
              >
                Volver a reportes
              </button>
            </div>
          )}

          {reporte && (
            <>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Reporte {reporte.folio}</h1>
                  <p className="text-gray-600">
                    Creado por {reporte.user_name || '—'} el {formatFecha(reporte.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate('/reportes')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Descargar PDF
                  </button>
                  <button
                    onClick={() => navigate(`/editar-reporte/${id}`)}
                    className="px-4 py-2 bg-[#00A859] text-white rounded-lg hover:bg-[#008f4d] transition-colors"
                  >
                    Editar
                  </button>
                </div>
              </div>

              <Seccion titulo="Información básica">
                <Grid
                  campos={[
                    ['Tipo de mantenimiento', reporte.tipo_mantenimiento],
                    ['Modelo UTR', reporte.modelo_utr],
                    ['Fecha', formatFecha(reporte.fecha_mantenimiento)],
                    ['Hora de inicio', reporte.hora_inicio],
                    ['Hora de término', reporte.hora_termino],
                    ['Responsable', reporte.responsable],
                    ['Licencia', reporte.licencia],
                    ['Registro', reporte.registro],
                    ['Restaurador', reporte.restaurador],
                    ['Circuito', reporte.circuito],
                    ['Área', reporte.area],
                    ['Estado', reporte.status],
                  ]}
                />
              </Seccion>

              <Seccion titulo="Ubicación">
                <Grid
                  campos={[
                    ['Latitud', reporte.latitud],
                    ['Longitud', reporte.longitud],
                    ['Dirección', reporte.direccion],
                  ]}
                />
                {tieneCoordenadas && (
                  <a
                    href={`https://www.google.com/maps?q=${reporte.latitud},${reporte.longitud}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-4 text-[#00A859] hover:underline"
                  >
                    Ver en Google Maps
                  </a>
                )}
              </Seccion>

              <Seccion titulo="Radio / Gabinete">
                <Grid
                  campos={[
                    ['NS Radio/Gabinete', reporte.radio_gabinete],
                    ['Código de radio', reporte.codigo_radio],
                    ['Potencia de salida (W)', reporte.potencia_salida],
                    ['RSSI (dBm)', reporte.rssi],
                    ['Umbral de recepción', reporte.umbral_recepcion],
                    ['Frecuencia (MHz)', reporte.frecuencia_mhz],
                    ['Rx', reporte.rx],
                    ['Tx', reporte.tx],
                    ['Cable pigtail', reporte.cable_pigtail],
                    ['Supresor', reporte.supresor],
                    ['Cable de L.T.', reporte.cable_lt],
                    ['Altura de antena (m)', reporte.altura_antena],
                    ['Repetidor de enlace', reporte.repetidor_enlace],
                    ['Canal UCM', reporte.canal_ucm],
                  ]}
                />
              </Seccion>

              <Seccion titulo="Actividades realizadas">
                {actividades.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1 text-gray-800">
                    {actividades.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">Sin actividades registradas.</p>
                )}
              </Seccion>

              <Seccion titulo="Mediciones técnicas">
                <Grid
                  campos={[
                    ['Potencia de radio (W)', reporte.potencia_radio],
                    ['Potencia incidente (W)', reporte.potencia_incidente],
                    ['Potencia reflejada (W)', reporte.potencia_reflejada],
                    ['VSWR', reporte.vswr],
                    ['Voltaje de acometida', reporte.voltaje_acometida],
                    ['Resistencia de tierra', reporte.resistencia_tierra],
                    ['Voltaje fuente (Vcd)', reporte.voltaje_fuente],
                    ['Resistencia batería (mΩ)', reporte.resistencia_bateria],
                    ['% de vida batería', reporte.porcentaje_bateria],
                    ['Ángulo de azimut', reporte.angulo_azimut],
                  ]}
                />
              </Seccion>

              <Seccion titulo="Materiales y observaciones">
                {materiales.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1 text-gray-800 mb-4">
                    {materiales.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 mb-4">Sin materiales registrados.</p>
                )}
                <Grid campos={[['Calibre de bajante', reporte.calibre_bajante]]} />
                <div className="mt-4">
                  <dt className="text-sm text-gray-500">Observaciones</dt>
                  <dd className="text-gray-900 whitespace-pre-wrap break-words">
                    {reporte.observaciones || '—'}
                  </dd>
                </div>
              </Seccion>

              <Seccion titulo="Fotografías">
                {listaFotos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {listaFotos.map((item, i) => (
                      <figure
                        key={item.path}
                        style={{ animationDelay: `${i * 70}ms` }}
                        className="thumb-in"
                      >
                        <button
                          onClick={() => setFoto(fotoUrl(item.path))}
                          className="block w-full aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm transition-shadow duration-300 hover:shadow-lg"
                        >
                          <img
                            src={fotoUrl(item.path)}
                            alt={item.label}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                          />
                        </button>
                        <figcaption className="mt-2 text-sm font-medium text-gray-700 text-center">
                          {item.label}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Sin fotografías.</p>
                )}
              </Seccion>
            </>
          )}
        </div>
      </main>

      {foto && (
        <div
          className={`lightbox-backdrop ${cerrando ? 'closing' : ''} fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4`}
          onClick={cerrarFoto}
        >
          <button
            onClick={cerrarFoto}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white text-2xl leading-none transition-colors"
            aria-label="Cerrar"
          >
            ×
          </button>
          <img src={foto} alt="Fotografía" className="lightbox-img max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}
