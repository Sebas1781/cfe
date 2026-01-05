import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEnvelope, 
  faBriefcase, 
  faIdCard,
  faKey,
  faHome,
  faClipboardList,
  faDoorOpen,
  faEye,
  faEyeSlash,
  faSave,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import useAuthStore from '../stores/authStore';
import { apiClient } from '../config/api';

export default function Perfil() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const sidebarItems = [
    { icon: faHome, label: 'Dashboard', action: () => navigate('/dashboard') },
    { icon: faUser, label: 'Perfil', action: () => navigate('/perfil') },
    { icon: faClipboardList, label: 'Reportes', action: () => navigate('/reportes') },
    { icon: faDoorOpen, label: 'Cerrar Sesión', action: logout }
  ];

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (passwordData.newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const data = await apiClient.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setSuccess('Contraseña cambiada exitosamente');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => {
        setShowChangePassword(false);
        setSuccess('');
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleText = (role) => {
    return role === 'admin' ? 'Administrador' : 'Trabajador';
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
      <div className="flex-1">
        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8 pt-20 lg:pt-8">
          {/* Profile Information Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faUser} className="text-4xl text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{user?.nombre_completo}</h2>
              <p className="text-gray-500 flex items-center gap-2">
                <FontAwesomeIcon icon={faBriefcase} className="text-sm" />
                {getRoleText(user?.role)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Usuario */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <FontAwesomeIcon icon={faIdCard} className="text-xl text-gray-600" />
              <div>
                <p className="text-sm text-gray-500">Usuario</p>
                <p className="text-gray-800 font-medium">{user?.username}</p>
              </div>
            </div>

            {/* Email (if available) */}
            {user?.email && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FontAwesomeIcon icon={faEnvelope} className="text-xl text-gray-600" />
                <div>
                  <p className="text-sm text-gray-500">Correo Electrónico</p>
                  <p className="text-gray-800 font-medium">{user.email}</p>
                </div>
              </div>
            )}

            {/* Role */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <FontAwesomeIcon icon={faBriefcase} className="text-xl text-gray-600" />
              <div>
                <p className="text-sm text-gray-500">Rol</p>
                <p className="text-gray-800 font-medium">{getRoleText(user?.role)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FontAwesomeIcon icon={faKey} className="text-green-600" />
              Seguridad
            </h3>
          </div>

          {!showChangePassword ? (
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faKey} />
              Cambiar Contraseña
            </button>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    <FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {success}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faSave} />
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setError('');
                    setSuccess('');
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faTimes} />
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
