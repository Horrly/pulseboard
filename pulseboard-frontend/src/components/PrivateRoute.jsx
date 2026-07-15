import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; // Spinner could go here; null avoids a flash
  return user ? children : <Navigate to="/login" replace />;
}
