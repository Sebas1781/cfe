import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const sidebarItems = [
    { icon: '🏠', label: 'Dashboard', active: true },
    { icon: '👤', label: 'Perfil' },
    { icon: '📋', label: 'Reportes' },
    { icon: '🚪', label: 'Cerrar Sesión', action: logout }
  ];

  const actionButtons = [
    { 
      icon: (
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
        </svg>
      ),
      label: 'Generar nuevo reporte',
      action: () => navigate('/nuevo-reporte')
    },
    { 
      icon: (
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
        </svg>
      ),
      label: 'Administrador de reportes',
      action: () => navigate('/reportes')
    },
    { 
      icon: (
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
        </svg>
      ),
      label: 'Administrador de usuarios'
    },
    { 
      icon: (
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
        </svg>
      ),
      label: 'Agregar nuevo usuario'
    },
    { 
      icon: (
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
        </svg>
      ),
      label: 'Mi perfil'
    },
    { 
      icon: (
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd"/>
        </svg>
      ),
      label: 'Cambiar contraseña'
    }
  ];

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
                  <span className="text-xl">{item.icon}</span>
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
                  <span className="text-xl">{item.icon}</span>
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
                  <span className="text-xl">{item.icon}</span>
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
                  <span className="text-xl">{item.icon}</span>
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
                  {button.icon}
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
