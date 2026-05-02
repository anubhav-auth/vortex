import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Users, FileText, Gavel, Activity, Shield } from 'lucide-react';
import { ScrambleText } from '../../components/ui/ScrambleText.jsx';
import { NeonBorderCard } from '../../components/ui/NeonBorderCard.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

const TILES = [
  { to: '/register',         label: 'Registration',     desc: 'Submit your application — verification by organizers.', icon: Users,    accent: 'text-accent-cyan' },
  { to: '/login',            label: 'Sign In',          desc: 'Returning participants, juries and organizers.',         icon: Shield,   accent: 'text-status-live' },
  { to: '/problem-statements', label: 'Problem Statements', desc: 'The challenges available across every domain.',     icon: FileText, accent: 'text-status-warn' },
  { to: '/leaderboard',      label: 'Leaderboard',      desc: 'Live ranking once scores are released.',                 icon: Trophy,   accent: 'text-accent-cyan' },
  { to: '/awards',           label: 'Awards',           desc: 'Grand prize, domain champions and special awards.',      icon: Gavel,    accent: 'text-status-live' },
];

export const HomePage = () => {
  const { isAuth, user } = useAuth();
  return (
    <section className="mx-auto flex max-w-[1200px] flex-col items-center px-6 py-20">
      <div className="kicker mb-6">
        <span className="h-1.5 w-1.5 rounded-full bg-status-live" style={{ animation: 'pulseDot 2s ease-in-out infinite' }} />
        Mission Control · Online
      </div>

      <h1 className="text-center font-sans text-[68px] font-extrabold leading-none md:text-[96px]">
        <ScrambleText text="VORTEX" duration={0.6} className="gradient-text" />
      </h1>

      <p className="mt-6 max-w-2xl text-center font-mono text-[14px] leading-relaxed text-text-secondary">
        A focused hackathon platform: register, form a squad around a problem statement,
        get evaluated across three rounds. No noise. No ceremony.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {isAuth ? (
          <Link
            to={user.role === 'ADMIN' ? '/admin' : user.role === 'JURY' ? '/jury' : '/dashboard'}
            className="glow-button inline-flex items-center gap-2"
          >
            Continue to dashboard <ArrowRight size={14} />
          </Link>
        ) : (
          <>
            <Link to="/register" className="glow-button inline-flex items-center gap-2">
              Register now <ArrowRight size={14} />
            </Link>
            <Link to="/login" className="ghost-button">Sign in</Link>
          </>
        )}
      </div>

      <div className="mt-6 flex items-center gap-8 font-mono text-[11px] uppercase tracking-[0.2em] text-text-dim">
        <span className="flex items-center gap-2">
          <Activity size={12} className="text-status-live" />
          System Operational
        </span>
        <span className="hidden md:inline">v2.0 · 2026</span>
      </div>

      <div className="mt-20 grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => (
          <NeonBorderCard key={t.to} className="h-full">
            <Link to={t.to} className="flex h-full flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <t.icon size={22} className={t.accent} />
                <ArrowRight size={16} className="text-text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-text-primary" />
              </div>
              <div className="space-y-1">
                <div className={`font-sans text-[16px] font-bold uppercase tracking-[0.05em] ${t.accent}`}>{t.label}</div>
                <p className="font-mono text-[12px] leading-relaxed text-text-secondary">{t.desc}</p>
              </div>
            </Link>
          </NeonBorderCard>
        ))}
      </div>

      <div className="mt-20 h-px w-32 bg-gradient-to-r from-transparent via-border-dim to-transparent" />
      <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-text-dim">
        Built for builders · Vortex
      </div>
    </section>
  );
};
