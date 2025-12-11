import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext'; // Sesuaikan path ini

const ProtectedRoute = () => {
  const { token } = useAuth();

  // Jika token tidak ada, lempar ke /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Jika token ada, render halaman anak (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;