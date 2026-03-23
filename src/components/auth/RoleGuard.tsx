import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

interface RoleGuardProps {
  allowedRoles: Array<'CUSTOMER' | 'ADMIN' | 'EMPLOYEE'>;
}

export const RoleGuard = ({ allowedRoles }: RoleGuardProps) => {
  const { user } = useAuthStore();

  // If we don't have a user, or their role isn't in the allowed list, kick them out
  if (!user || !allowedRoles.includes(user.role)) {
    // Redirect to a safe default page based on their actual role, or home
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user?.role === 'EMPLOYEE') return <Navigate to="/ops/pickup" replace />;
    return <Navigate to="/" replace />;
  }

  // If authorized, render the child routes
  return <Outlet />;
};