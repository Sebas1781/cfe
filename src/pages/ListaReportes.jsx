import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    { icon: '🏠', label: 'Dashboard', action: () => navigate('/dashboard') },
    { icon: '👤', label: 'Perfil' },
    { icon: '📋', label: 'Reportes', action: () => navigate('/reportes') },
    { icon: '🚪', label: 'Cerrar Sesión', action: logout }
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
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <nav className="bg-white shadow-md px-6 py-4 flex items-center justify-between z-50 relative">
          <button
            className="lg:hidden text-2xl"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
          <img src="/IMAGES/cfe2.png" alt="CFE" className="h-10" />
          <div className="w-10"></div>
        </nav>

        {/* Mobile Menu Overlay */}
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setMenuOpen(false)}
            ></div>
            <aside className="fixed top-0 left-0 w-64 h-full bg-white shadow-lg z-60 lg:hidden transform transition-transform">
              <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                  <img src="/IMAGES/logocfeNegro.png" alt="CFE" className="h-10" />
                  <button onClick={() => setMenuOpen(false)} className="text-2xl">×</button>
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
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </aside>
          </>
        )}

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
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

            {/* Table */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Cargando reportes...</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                      {currentReportes.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                            No se encontraron reportes
                          </td>
                        </tr>
                      ) : (
                        currentReportes.map((reporte) => (
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
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
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
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
