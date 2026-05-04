import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FullSpinner } from '../ui/Spinner.jsx';

// While we're checking the stored token against /me, render a spinner
// rather than flicker between the route and a redirect.

export const RequireAuth = ({ children, role }) => {
  const { isAuth, user, bootChecked } = useAuth();
  const loc = useLocation();

  if (!bootChecked) return <FullSpinner label="Verifying session…" />;
  if (!isAuth) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;

  if (role) {
    const allowed = Array.isArray(role) ? role.includes(user.role) : user.role === role;
    if (!allowed) return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// For pages like /login that should bounce already-logged-in users home.
export const RedirectIfAuth = ({ children }) => {
  const { isAuth, user, bootChecked } = useAuth();
  if (!bootChecked) return <FullSpinner label="Verifying session…" />;
  if (isAuth) {
    const home = user.role === 'ADMIN' ? '/admin'
               : user.role === 'JURY'  ? '/jury'
               :                         '/dashboard';
    return <Navigate to={home} replace />;
  }
  return children;
};
