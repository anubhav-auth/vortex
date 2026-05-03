import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  Wind, Users, ShieldCheck, Database, Settings, Lock, Megaphone,
  History, Layers, ListChecks, LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { cn } from '../../utils/cn.js';

// Admin uses its own dark sidebar shell — top app bar is hidden here.
// Mirrors v1 layout: 280px fixed sidebar, #050505 background, cyan
// active accent.

const NAV = [
  { to: '/admin',                end: true, label: 'Overview',     icon: Layers   },
  { to: '/admin/verification',              label: 'Verification', icon: ShieldCheck },
  { to: '/admin/registry',                  label: 'Registry',     icon: Database  },
  { to: '/admin/teams',                     label: 'Teams',        icon: Users     },
  { to: '/admin/rules',                     label: 'Rules',        icon: Settings  },
  { to: '/admin/rounds',                    label: 'Rounds',       icon: Lock      },
  { to: '/admin/taxonomy',                  label: 'Taxonomy',     icon: ListChecks },
  { to: '/admin/broadcast',                 label: 'Broadcast',    icon: Megaphone },
  { to: '/admin/audit',                     label: 'Audit Log',    icon: History   },
];

export const AdminShell = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-bg-void">
      <aside className="fixed inset-y-0 left-0 flex w-[260px] flex-col border-r border-[#0f172a] bg-[#050505]">
        <Link to="/" className="flex items-center gap-2 border-b border-[#0f172a] px-6 py-5 transition-opacity hover:opacity-80">
          <Wind size={20} className="text-accent-cyan" strokeWidth={2.5} />
          <span className="font-sans text-[13px] font-bold tracking-[0.25em] text-text-primary">
            VORTEX <span className="text-status-warn">·</span> ADMIN
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(
                'group flex items-center gap-3 border-l-2 border-transparent px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.15em] transition-colors',
                'text-text-secondary hover:bg-white/[0.03] hover:text-text-primary',
                isActive && 'border-accent-cyan bg-white/[0.04] text-accent-cyan',
              )}
            >
              <Icon size={14} className="shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[#0f172a] px-6 py-4">
          <div className="mb-2 truncate font-mono text-[11px] text-text-dim">
            {user?.email}
          </div>
          <button
            onClick={logout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[4px] border border-border-dim px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary hover:bg-[#1e293b] hover:text-text-primary"
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="ml-[260px] flex-1 px-10 py-10">
        <Outlet />
      </main>
    </div>
  );
};
