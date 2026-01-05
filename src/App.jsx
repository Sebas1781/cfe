import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import PrivateRoute from './components/PrivateRoute';
import NetworkStatus from './components/NetworkStatus';
import GoogleMapsLoader from './components/GoogleMapsLoader';
import Login from './pages/Login';
import FormularioTrabajador from './pages/FormularioTrabajador';
import AdminDashboard from './pages/AdminDashboard';
import NuevoReporte from './pages/NuevoReporte';
import EditarReporte from './pages/EditarReporte';
import ListaReportes from './pages/ListaReportes';
import AdminUsuarios from './pages/AdminUsuarios';
import AdminFormularios from './pages/AdminFormularios';
import Perfil from './pages/Perfil';
import MapaRestauradores from './pages/MapaRestauradores';
import NuevoRestaurador from './pages/NuevoRestaurador';
import ScannerQR from './pages/ScannerQR';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <GoogleMapsLoader>
      <BrowserRouter>
        {/* Componente de sincronización automática - visible solo cuando hay datos pendientes */}
        <NetworkStatus />
      
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Dashboard - admin y trabajador */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* Nuevo reporte - admin y trabajador */}
        <Route
          path="/nuevo-reporte"
          element={
            <PrivateRoute>
              <NuevoReporte />
            </PrivateRoute>
          }
        />

        {/* Editar reporte - admin y trabajador */}
        <Route
          path="/editar-reporte/:id"
          element={
            <PrivateRoute>
              <EditarReporte />
            </PrivateRoute>
          }
        />

        {/* Lista de reportes - admin y trabajador */}
        <Route
          path="/reportes"
          element={
            <PrivateRoute>
              <ListaReportes />
            </PrivateRoute>
          }
        />

        {/* Perfil - admin y trabajador */}
        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <Perfil />
            </PrivateRoute>
          }
        />

        {/* Administrador de usuarios - solo admin */}
        <Route
          path="/usuarios"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminUsuarios />
            </PrivateRoute>
          }
        />

        {/* Administrador de formularios - solo admin */}
        <Route
          path="/formularios"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminFormularios />
            </PrivateRoute>
          }
        />

        {/* Mapa de Restauradores - admin y trabajador */}
        <Route
          path="/restauradores"
          element={
            <PrivateRoute>
              <MapaRestauradores />
            </PrivateRoute>
          }
        />

        {/* Nuevo Restaurador - admin */}
        <Route
          path="/nuevo-restaurador"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <NuevoRestaurador />
            </PrivateRoute>
          }
        />

        {/* Scanner QR - admin y trabajador */}
        <Route
          path="/scanner-qr"
          element={
            <PrivateRoute>
              <ScannerQR />
            </PrivateRoute>
          }
        />
        
        {/* Ruta admin - solo admin */}
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
        />
        
        <Route
          path="/unauthorized"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
                <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
    </GoogleMapsLoader>
  );
}

export default App;

