import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

export const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role } = useAuthStore();

  console.log('PrivateRoute - isAuthenticated:', isAuthenticated, 'role:', role, 'allowedRoles:', allowedRoles);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;
