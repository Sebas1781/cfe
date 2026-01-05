import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUser, faClipboardList, faDoorOpen } from '@fortawesome/free-solid-svg-icons';
import useAuthStore from '../stores/authStore';
import { reportService } from '../services/reportService';

export default function ListaReportes() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const sidebarItems = [
    { icon: faHome, label: 'Dashboard', action: () => navigate('/dashboard') },
    { icon: faUser, label: 'Perfil', action: () => navigate('/perfil') },
    { icon: faClipboardList, label: 'Reportes', action: () => navigate('/reportes') },
    { icon: faDoorOpen, label: 'Cerrar Sesión', action: logout }
  ];

  useEffect(() => {
    loadReportes();
  }, []);

  const loadReportes = async () => {
    try {
      setLoading(true);
      const response = await reportService.getReports();
      setReportes(response.reportes || []);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      alert('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (id) => {
    try {
      await reportService.downloadReport(id);
    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('PDF no disponible. Este reporte debe ser regenerado desde el formulario para tener PDF.');
    }
  };

  const handleDownloadExcel = async (id) => {
    try {
      await reportService.downloadXlsx(id);
    } catch (error) {
      alert('Error al descargar Excel');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este reporte? Esta acción no se puede deshacer.')) return;
    try {
      await reportService.deleteReport(id);
      alert('Reporte eliminado exitosamente');
      loadReportes(); // Recargar la lista
    } catch (error) {
      console.error('Error eliminando reporte:', error);
      alert('Error al eliminar el reporte');
    }
  };

  // Filtrado y búsqueda por nombre del trabajador
  const filteredReportes = reportes.filter(reporte => {
    const matchSearch = searchTerm === '' || 
                       reporte.responsable?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       reporte.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchFilter = filterBy === '' ||
                       reporte.responsable?.toLowerCase().includes(filterBy.toLowerCase());
    
    return matchSearch && matchFilter;
  });
  
  // Obtener lista única de trabajadores para el filtro
  const trabajadores = [...new Set(reportes.map(r => r.responsable || r.user_name).filter(Boolean))];

  // Paginación
  const totalPages = Math.ceil(filteredReportes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReportes = filteredReportes.slice(startIndex, startIndex + itemsPerPage);

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
      <div className="flex-1 flex flex-col">

        {/* Content */}
        <main className="flex-1 p-6 pt-20 lg:pt-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Listado de Reportes</h1>
            <p className="text-gray-600 mb-6">Esta tabla muestra todos los reportes disponibles.</p>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por nombre del trabajador..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                >
                  <option value="">Todos los trabajadores</option>
                  {trabajadores.map((trabajador, idx) => (
                    <option key={idx} value={trabajador}>{trabajador}</option>
                  ))}
                </select>
                <button 
                  onClick={() => navigate('/nuevo-reporte')}
                  className="px-6 py-2 bg-[#00A859] text-white rounded-lg hover:bg-[#008f4d] transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Table Desktop / Cards Mobile */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Cargando reportes...</p>
              </div>
            ) : currentReportes.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">No se encontraron reportes</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#00A859] text-white">
                        <tr>
                          <th className="px-6 py-4 text-left font-semibold">Nombre</th>
                          <th className="px-6 py-4 text-left font-semibold">Responsable</th>
                          <th className="px-6 py-4 text-left font-semibold">Fecha de creación</th>
                          <th className="px-6 py-4 text-left font-semibold">Última modificación</th>
                          <th className="px-6 py-4 text-left font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentReportes.map((reporte) => (
                          <tr key={reporte.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-semibold text-gray-900">{reporte.user_name || 'Sin nombre'}</div>
                                <div className="text-sm text-gray-500">{reporte.folio}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {reporte.responsable || reporte.user_name || 'Admin'}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {new Date(reporte.created_at).toLocaleDateString('es-MX')}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {new Date(reporte.updated_at || reporte.created_at).toLocaleDateString('es-MX')}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-3">
                                <button
                                  onClick={() => navigate(`/editar-reporte/${reporte.id}`)}
                                  className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
                                  title="Editar reporte"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDownloadPDF(reporte.id)}
                                  className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                                  title="Descargar PDF"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(reporte.id)}
                                  className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                                  title="Eliminar reporte"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Desktop */}
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 p-4 border-t border-gray-200">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-[#00A859] text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {currentReportes.map((reporte) => (
                    <div key={reporte.id} className="bg-white rounded-lg shadow-md p-4">
                      <div className="mb-3">
                        <div className="font-bold text-gray-900 text-lg mb-1">
                          {reporte.user_name || 'Sin nombre'}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">Folio: {reporte.folio}</div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Responsable:</span> {reporte.responsable || reporte.user_name || 'Admin'}
                        </div>
                      </div>

                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Fecha creación:</span>
                          <span className="text-gray-700 font-medium">
                            {new Date(reporte.created_at).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Última modificación:</span>
                          <span className="text-gray-700 font-medium">
                            {new Date(reporte.updated_at || reporte.created_at).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => navigate(`/editar-reporte/${reporte.id}`)}
                          className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(reporte.id)}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Descargar PDF"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(reporte.id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Pagination Mobile */}
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-[#00A859] text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
