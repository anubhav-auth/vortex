import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, IdCard } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Spinner, FullSpinner } from '../../components/ui/Spinner.jsx';
import { ScrambleText } from '../../components/ui/ScrambleText.jsx';
import { Badge } from '../../components/ui/Badge.jsx';

const EMPTY = {
  fullName: '', email: '', registrationNo: '',
  institutionId: '', domainId: '', track: '',
  phone: '', discordId: '', gender: 'MALE',
  profilePicUrl: '', linkedinUrl: '', githubUrl: '', bio: '',
};

export const RegistrationPage = () => {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  // Public taxonomy reads.
  const { data: instData,    loading: instLoading }    = useApi(() => api.get('/api/taxonomy/institutions'), []);
  const { data: domData,     loading: domLoading }     = useApi(() => api.get('/api/taxonomy/domains'), []);

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setBusy(true);
    try {
      // Strip empty optional fields so backend Zod's url() doesn't reject ''.
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === '' ? undefined : v]),
      );
      const res = await api.post('/api/registration', payload);
      setDone(res);
      toast.success('Registration submitted. Awaiting organizer verification.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR') {
        // details = { body: { field: [...messages] } }
        const fieldErrs = err.details?.body ?? err.details ?? {};
        const flat = {};
        for (const [k, v] of Object.entries(fieldErrs)) flat[k] = Array.isArray(v) ? v[0] : String(v);
        setErrors(flat);
        toast.error('Please correct the highlighted fields.');
      } else if (err.code === 'CONFLICT') {
        const f = err.details?.field ?? 'field';
        setErrors({ [f]: err.message });
        toast.error(err.message);
      } else {
        toast.error(err.message || 'Registration failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    const matched = done.registryMatch?.matched;
    return (
      <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-xl flex-col items-center justify-center px-6 py-12">
        <CheckCircle2 size={56} className="text-status-live" />
        <h1 className="mt-5 font-sans text-[28px]">Registration submitted</h1>
        <p className="mt-3 max-w-md text-center font-mono text-[13px] text-text-secondary">
          We've received your application and queued it for organizer review. You'll receive
          an email with a 6-digit password once you're approved.
        </p>

        <div className="mt-6 flex items-center gap-2">
          <Badge tone={matched ? 'live' : 'warn'} dot>
            {matched ? 'Matched in registry' : 'Manual review needed'}
          </Badge>
        </div>

        <Link to="/" className="ghost-button mt-8 inline-flex items-center gap-2">
          Back home <ArrowRight size={14} />
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <div className="kicker mb-3">New Operative</div>
      <h1 className="font-sans text-[36px]">
        <ScrambleText text="REGISTRATION" duration={0.45} />
      </h1>
      <p className="mt-3 max-w-xl font-mono text-[13px] text-text-secondary">
        Complete the form below. Your registration must match an entry in the institution
        registry; organizers may approve manually if it doesn't.
      </p>

      <form onSubmit={submit} className="glass-card mt-8 space-y-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label="Full Name" required error={errors.fullName}>
            <input className="input-glass" required minLength={2} maxLength={120} value={form.fullName} onChange={set('fullName')} />
          </FormField>

          <FormField label="Email" required error={errors.email}>
            <input type="email" className="input-glass" required value={form.email} onChange={set('email')} />
          </FormField>

          <FormField label="Registration No." required error={errors.registrationNo} hint="As issued by your institution.">
            <div className="relative">
              <IdCard size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input className="input-glass pl-9" required maxLength={50} value={form.registrationNo} onChange={set('registrationNo')} />
            </div>
          </FormField>

          <FormField label="Phone" error={errors.phone}>
            <input className="input-glass" maxLength={20} value={form.phone} onChange={set('phone')} placeholder="+91…" />
          </FormField>

          <FormField label="Institution" required error={errors.institutionId}>
            {instLoading ? (
              <div className="input-glass flex items-center gap-2 text-text-dim"><Spinner size={12} /> Loading…</div>
            ) : (
              <select className="select-glass" required value={form.institutionId} onChange={set('institutionId')}>
                <option value="">Select institution…</option>
                {instData?.institutions.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            )}
          </FormField>

          <FormField label="Domain" required error={errors.domainId}>
            {domLoading ? (
              <div className="input-glass flex items-center gap-2 text-text-dim"><Spinner size={12} /> Loading…</div>
            ) : (
              <select className="select-glass" required value={form.domainId} onChange={set('domainId')}>
                <option value="">Select domain…</option>
                {domData?.domains.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
          </FormField>

          <FormField label="Track" required error={errors.track} hint="Which track you intend to compete in.">
            <input className="input-glass" required maxLength={80} value={form.track} onChange={set('track')} />
          </FormField>

          <FormField label="Gender" required error={errors.gender}>
            <select className="select-glass" required value={form.gender} onChange={set('gender')}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other / prefer not to say</option>
            </select>
          </FormField>

          <FormField label="Discord ID" error={errors.discordId}>
            <input className="input-glass" maxLength={60} value={form.discordId} onChange={set('discordId')} placeholder="username#1234" />
          </FormField>

          <FormField label="Profile Picture URL" error={errors.profilePicUrl}>
            <input type="url" className="input-glass" value={form.profilePicUrl} onChange={set('profilePicUrl')} placeholder="https://…" />
          </FormField>

          <FormField label="LinkedIn URL" error={errors.linkedinUrl}>
            <input type="url" className="input-glass" value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/in/…" />
          </FormField>

          <FormField label="GitHub URL" error={errors.githubUrl}>
            <input type="url" className="input-glass" value={form.githubUrl} onChange={set('githubUrl')} placeholder="https://github.com/…" />
          </FormField>
        </div>

        <FormField label="Short Bio" hint="Up to 1000 characters." error={errors.bio}>
          <textarea
            className="input-glass min-h-[110px]"
            maxLength={1000}
            value={form.bio}
            onChange={set('bio')}
            placeholder="What you build, what you're into."
          />
        </FormField>

        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="font-mono text-[11px] text-text-dim">
            By registering you agree to the event rules and code of conduct.
          </p>
          <button type="submit" disabled={busy} className="glow-button inline-flex items-center gap-2">
            {busy ? <Spinner size={14} /> : <ArrowRight size={14} />}
            {busy ? 'Submitting…' : 'Submit registration'}
          </button>
        </div>
      </form>
    </section>
  );
};
