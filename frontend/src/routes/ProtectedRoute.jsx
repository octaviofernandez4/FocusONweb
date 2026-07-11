import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Nos fijamos si el usuario tiene el pase VIP en el bolsillo
  const token = localStorage.getItem('token');

  // Si no hay token, lo pateamos de vuelta al login sin escalas
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si tiene el token, lo dejamos pasar a la ruta que quería ir (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;