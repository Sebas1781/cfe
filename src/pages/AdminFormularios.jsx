import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faUser, 
  faClipboardList, 
  faDoorOpen,
  faPlus,
  faEdit,
  faTrash,
  faSave,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { apiClient } from '../config/api';

export default function AdminFormularios() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [opciones, setOpciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(null);
  const [nuevaOpcion, setNuevaOpcion] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [agregandoMultiples, setAgregandoMultiples] = useState(false);
  const [opcionesMultiples, setOpcionesMultiples] = useState('');

  const sidebarItems = [
    { icon: faHome, label: 'Dashboard', action: () => navigate('/dashboard') },
    { icon: faUser, label: 'Perfil', action: () => navigate('/perfil') },
    { icon: faClipboardList, label: 'Reportes', action: () => navigate('/reportes') },
    { icon: faDoorOpen, label: 'Cerrar Sesión', action: logout }
  ];

  // Categorías disponibles en el formulario
  const categoriasDisponibles = [
    { id: 'tipo_mantenimiento', nombre: 'Tipo de Mantenimiento' },
    { id: 'modelo_utr', nombre: 'Modelo UTR' },
    { id: 'restaurador', nombre: 'Restaurador' },
    { id: 'circuito', nombre: 'Circuito' },
    { id: 'area', nombre: 'Área' },
    { id: 'frecuencia_mhz', nombre: 'Frecuencia MHz' },
    { id: 'rx', nombre: 'RX' },
    { id: 'tx', nombre: 'TX' },
    { id: 'cable_pigtail', nombre: 'Cable Pigtail' },
    { id: 'supresor', nombre: 'Supresor' },
    { id: 'cable_lt', nombre: 'Cable de L.T.' },
    { id: 'repetidor_enlace', nombre: 'Repetidor de Enlace' },
    { id: 'canal_ucm', nombre: 'Canal UCM' },
    { id: 'modelo_gabinete', nombre: 'Modelos de Gabinete' },
    { id: 'tipo_radio', nombre: 'Tipos de Radio' },
    { id: 'tipo_conector', nombre: 'Tipos de Conector' },
    { id: 'tipo_cable', nombre: 'Tipos de Cable' },
    { id: 'tipo_antena', nombre: 'Tipos de Antena' },
    { id: 'antena', nombre: 'Antena' },
    { id: 'incidencias', nombre: 'Incidencias Comunes' }
  ];

  useEffect(() => {
    setCategorias(categoriasDisponibles);
  }, []);

  useEffect(() => {
    if (categoriaSeleccionada) {
      cargarOpciones();
    }
  }, [categoriaSeleccionada]);

  const cargarOpciones = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/form-options/${categoriaSeleccionada}`);
      setOpciones(response.options || []);
    } catch (error) {
      console.error('Error al cargar opciones:', error);
      setOpciones([]);
    } finally {
      setLoading(false);
    }
  };

  const agregarOpcion = async () => {
    if (!nuevaOpcion.trim()) return;

    try {
      await apiClient.post('/form-options', {
        categoria: categoriaSeleccionada,
        valor: nuevaOpcion.trim()
      });
      setNuevaOpcion('');
      setAgregando(false);
      cargarOpciones();
    } catch (error) {
      console.error('Error al agregar opción:', error);
      alert('Error al agregar opción');
    }
  };

  const agregarOpcionesMultiples = async () => {
    if (!opcionesMultiples.trim()) return;

    // Separar por saltos de línea o comas
    const opciones = opcionesMultiples
      .split(/[\n,]/)
      .map(op => op.trim())
      .filter(op => op.length > 0);

    if (opciones.length === 0) return;

    try {
      let agregadas = 0;
      let errores = 0;

      for (const valor of opciones) {
        try {
          await apiClient.post('/form-options', {
            categoria: categoriaSeleccionada,
            valor: valor
          });
          agregadas++;
        } catch (error) {
          console.error(`Error al agregar ${valor}:`, error);
          errores++;
        }
      }

      setOpcionesMultiples('');
      setAgregandoMultiples(false);
      cargarOpciones();
      
      if (errores > 0) {
        alert(`Se agregaron ${agregadas} opciones. ${errores} fallaron (pueden ser duplicados).`);
      } else {
        alert(`Se agregaron ${agregadas} opciones exitosamente.`);
      }
    } catch (error) {
      console.error('Error al agregar opciones:', error);
      alert('Error al agregar opciones');
    }
  };

  const actualizarOpcion = async (id, nuevoValor) => {
    try {
      await apiClient.put(`/form-options/${id}`, {
        valor: nuevoValor
      });
      setEditando(null);
      cargarOpciones();
    } catch (error) {
      console.error('Error al actualizar opción:', error);
      alert('Error al actualizar opción');
    }
  };

  const eliminarOpcion = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta opción?')) return;

    try {
      await apiClient.delete(`/form-options/${id}`);
      cargarOpciones();
    } catch (error) {
      console.error('Error al eliminar opción:', error);
      alert('Error al eliminar opción');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
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

      {/* Mobile Sidebar Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-transparent"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Menu */}
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
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8 pt-20 lg:pt-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Administrador de Formularios
          </h1>

          {/* Selector de Categoría */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona una categoría
            </label>
            <select
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">-- Selecciona una categoría --</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de Opciones */}
          {categoriaSeleccionada && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Opciones de {categorias.find(c => c.id === categoriaSeleccionada)?.nombre}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAgregando(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Agregar Opción
                  </button>
                  <button
                    onClick={() => setAgregandoMultiples(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Agregar Múltiples
                  </button>
                </div>
              </div>

              {/* Formulario para agregar una opción */}
              {agregando && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border-2 border-green-500">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nuevaOpcion}
                      onChange={(e) => setNuevaOpcion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && agregarOpcion()}
                      placeholder="Escribe el nuevo valor..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      onClick={agregarOpcion}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faSave} />
                    </button>
                    <button
                      onClick={() => {
                        setAgregando(false);
                        setNuevaOpcion('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                </div>
              )}

              {/* Formulario para agregar múltiples opciones */}
              {agregandoMultiples && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-500">
                  <p className="text-sm text-gray-700 mb-2">
                    Escribe cada opción en una línea nueva o separadas por comas:
                  </p>
                  <textarea
                    value={opcionesMultiples}
                    onChange={(e) => setOpcionesMultiples(e.target.value)}
                    placeholder="Opción 1&#10;Opción 2&#10;Opción 3&#10;O: Opción 1, Opción 2, Opción 3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="5"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={agregarOpcionesMultiples}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faSave} /> Guardar Todas
                    </button>
                    <button
                      onClick={() => {
                        setAgregandoMultiples(false);
                        setOpcionesMultiples('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      <FontAwesomeIcon icon={faTimes} /> Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de opciones */}
              {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              ) : opciones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay opciones registradas. ¡Agrega la primera!
                </div>
              ) : (
                <div className="space-y-2">
                  {opciones.map((opcion) => (
                    <div
                      key={opcion.id}
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {editando === opcion.id ? (
                        <>
                          <input
                            type="text"
                            defaultValue={opcion.valor}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                actualizarOpcion(opcion.id, e.target.value);
                              }
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            autoFocus
                            id={`edit-${opcion.id}`}
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById(`edit-${opcion.id}`);
                              actualizarOpcion(opcion.id, input.value);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <FontAwesomeIcon icon={faSave} />
                          </button>
                          <button
                            onClick={() => setEditando(null)}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-gray-800">{opcion.valor}</span>
                          <button
                            onClick={() => setEditando(opcion.id)}
                            className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => eliminarOpcion(opcion.id)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
