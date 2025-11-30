import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import PrivateRoute from './components/PrivateRoute';
import NetworkStatus from './components/NetworkStatus';
import Login from './pages/Login';
import FormularioTrabajador from './pages/FormularioTrabajador';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      {/* Componente de sincronización automática - visible solo cuando hay datos pendientes */}
      <NetworkStatus />
      
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/formulario"
          element={
            <PrivateRoute allowedRoles={['trabajador']}>
              <FormularioTrabajador />
            </PrivateRoute>
          }
        />
        
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
          element={<Navigate to={isAuthenticated ? '/formulario' : '/login'} replace />}
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
  );
}

export default App;

