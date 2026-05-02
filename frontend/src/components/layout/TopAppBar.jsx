import { NavLink, Link, useLocation } from 'react-router-dom';
import { Wind, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { cn } from '../../utils/cn.js';

// Sticky top nav. Same visual contract as v1 — Wind logo in cyan, mono
// uppercase links, warm amber for the admin shortcut.

const NavItem = ({ to, children, tone }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      'rounded-[4px] px-3 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.05em] transition-colors',
      tone === 'warn' ? 'text-status-warn' : 'text-text-secondary',
      'hover:bg-white/5 hover:text-text-primary',
      isActive && 'bg-white/5 text-text-primary',
    )}
  >
    {children}
  </NavLink>
);

export const TopAppBar = () => {
  const { user, isAuth, logout } = useAuth();
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null; // admin uses its own shell

  return (
    <header className="sticky top-0 z-50 border-b border-[#1e293b] bg-bg-void/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-6">
        <Link to="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <Wind size={22} className="text-accent-cyan" strokeWidth={2.5} />
          <span className="font-sans text-[15px] font-bold tracking-[0.2em] text-text-primary">VORTEX</span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavItem to="/leaderboard">Leaderboard</NavItem>
          <NavItem to="/problem-statements">Problems</NavItem>
          <NavItem to="/awards">Awards</NavItem>

          {isAuth ? (
            <>
              <NavItem to="/dashboard">Dashboard</NavItem>
              {user.role === 'STUDENT'  && <NavItem to="/teams">Teams</NavItem>}
              {user.role === 'JURY'     && <NavItem to="/jury">Evaluations</NavItem>}
              {user.role === 'ADMIN'    && <NavItem to="/admin" tone="warn">Admin</NavItem>}
              <button
                onClick={logout}
                className="ml-2 inline-flex items-center gap-2 rounded-[4px] border border-border-dim px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.05em] text-text-secondary hover:border-[#475569] hover:bg-[#334155] hover:text-text-primary"
              >
                <LogOut size={12} />
                Logout
              </button>
            </>
          ) : (
            <>
              <NavItem to="/login">Login</NavItem>
              <Link
                to="/register"
                className="ml-1 rounded-[4px] bg-accent-cyan px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.05em] text-bg-void hover:brightness-110"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
