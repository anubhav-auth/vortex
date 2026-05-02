import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { ScrambleText } from '../../components/ui/ScrambleText.jsx';

export const LoginPage = () => {
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      toast.success(`Welcome back, ${u.fullName.split(' ')[0]}.`);
      const dest = loc.state?.from
        ?? (u.role === 'ADMIN' ? '/admin' : u.role === 'JURY' ? '/jury' : '/dashboard');
      nav(dest, { replace: true });
    } catch (apiErr) {
      setErr(apiErr.message);
      if (apiErr.code === 'ACCOUNT_PENDING')
        setErr('Your account is awaiting organizer verification.');
      if (apiErr.code === 'ACCOUNT_REJECTED')
        setErr('Your registration was not approved.');
      if (apiErr.code === 'ACCOUNT_REVOKED')
        setErr('Your access has been revoked. Contact organizers.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-6 py-12">
      <div className="kicker mb-6 justify-center">Authenticate</div>
      <h1 className="text-center font-sans text-[36px] leading-none">
        <ScrambleText text="SIGN IN" duration={0.4} />
      </h1>
      <p className="mt-3 text-center font-mono text-[12px] text-text-secondary">
        Use the credentials issued after verification.
      </p>

      <form onSubmit={submit} className="glass-card mt-8 space-y-5">
        <FormField label="Email" required>
          <div className="relative">
            <Mail size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="email"
              autoComplete="email"
              required
              className="input-glass pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@institution.edu"
            />
          </div>
        </FormField>

        <FormField label="Password" required hint="6-digit code issued on verification, or your admin password.">
          <div className="relative">
            <Lock size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              className="input-glass pl-9 tracking-widest"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>
        </FormField>

        {err && (
          <div className="rounded-[4px] border border-status-crit/40 bg-status-crit/5 px-3 py-2 font-mono text-[12px] text-status-crit">
            {err}
          </div>
        )}

        <button type="submit" disabled={busy} className="glow-button inline-flex w-full items-center justify-center gap-2">
          {busy ? <Spinner size={16} /> : <LogIn size={14} />}
          {busy ? 'Verifying…' : 'Sign in'}
        </button>
      </form>
    </section>
  );
};
