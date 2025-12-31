import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faUser, 
  faClipboardList, 
  faDoorOpen,
  faFileAlt,
  faUsers,
  faKey
} from '@fortawesome/free-solid-svg-icons';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout, role } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const sidebarItems = [
    { icon: faHome, label: 'Dashboard', active: true },
    { icon: faUser, label: 'Perfil' },
    { icon: faClipboardList, label: 'Reportes' },
    { icon: faDoorOpen, label: 'Cerrar Sesión', action: logout }
  ];

  // Todas las opciones disponibles
  const allButtons = [
    { 
      icon: faFileAlt,
      label: 'Generar nuevo reporte',
      action: () => navigate('/nuevo-reporte'),
      roles: ['admin', 'trabajador']
    },
    { 
      icon: faClipboardList,
      label: 'Administrador de reportes',
      action: () => navigate('/reportes'),
      roles: ['admin', 'trabajador']
    },
    { 
      icon: faUsers,
      label: 'Administrador de usuarios',
      action: () => navigate('/usuarios'),
      roles: ['admin']
    },
    { 
      icon: faUser,
      label: 'Mi perfil',
      roles: ['admin', 'trabajador']
    },
    { 
      icon: faKey,
      label: 'Cambiar contraseña',
      roles: ['admin', 'trabajador']
    }
  ];

  // Filtrar botones según el rol del usuario
  const actionButtons = allButtons.filter(button => button.roles.includes(role));

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:block w-64 bg-white shadow-lg">
        <div className="p-6">
          <img src="/IMAGES/logocfeNegro.png" alt="CFE" className="h-12 mb-8" />
          <nav className="space-y-2">
            {sidebarItems.map((item, index) => (
              item.action ? (
                <button
                  key={index}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={item.icon} className="text-xl" />
                  <span>{item.label}</span>
                </button>
              ) : (
                <button
                  key={index}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    item.active
                      ? 'bg-[#00A859] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="text-xl" />
                  <span>{item.label}</span>
                </button>
              )
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile Header con menú hamburguesa */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="flex items-center justify-between p-4">
          <div className="w-6"></div> {/* Spacer para centrar */}
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

      {/* Menú móvil deslizable */}
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
              item.action ? (
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
              ) : (
                <button
                  key={index}
                  onClick={() => setMenuOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    item.active
                      ? 'bg-[#00A859] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="text-xl" />
                  <span>{item.label}</span>
                </button>
              )
            ))}
          </nav>
        </div>
      </div>

      {/* Overlay transparente para cerrar menú */}
      {menuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 mt-20 lg:mt-0">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Título con línea verde */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">Menú Principal</h1>
            <div className="w-full h-1 bg-[#00A859]"></div>
          </div>

          {/* Grid de botones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {actionButtons.map((button, index) => (
              <button
                key={index}
                onClick={button.action}
                className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center gap-4 group"
              >
                <div className="w-20 h-20 bg-[#00A859] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FontAwesomeIcon icon={button.icon} className="text-white text-3xl" />
                </div>
                <span className="text-gray-700 font-medium text-center text-sm">
                  {button.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
