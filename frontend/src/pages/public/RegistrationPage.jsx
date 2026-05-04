import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle2, IdCard, User, Mail, Phone, 
  School, Box, Globe, Linkedin, Github, MessageSquare 
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Spinner, FullSpinner } from '../../components/ui/Spinner.jsx';
import { ScrambleText } from '../../components/ui/ScrambleText.jsx';
import { Badge } from '../../components/ui/Badge.jsx';

const EMPTY = {
  fullName: '', email: '', registrationNo: '',
  institutionId: '', domainId: '',
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
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === '' ? undefined : v]),
      );
      const res = await api.post('/api/registration', payload);
      setDone(res);
      toast.success('Registration submitted. Awaiting organizer verification.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR') {
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
        <div className="flex h-20 w-20 items-center justify-center border border-white/20 bg-white/5 mb-8">
          <CheckCircle2 size={40} className="text-white" />
        </div>
        <h1 className="font-sans text-[32px] font-black uppercase tracking-tight text-white text-center">Registration Queued</h1>
        <p className="mt-4 max-w-md text-center font-mono text-[13px] leading-relaxed text-white/40">
          We've received your application. Organizers are reviewing your credentials. 
          You'll receive an encrypted password once verification is complete.
        </p>

        <div className="mt-8">
          <Badge tone={matched ? 'live' : 'warn'}>
            {matched ? 'Registry Verified' : 'Manual Review Pending'}
          </Badge>
        </div>

        <Link to="/" className="glow-button mt-12 flex items-center gap-3 px-10">
          <span>Return to control</span>
          <ArrowRight size={18} />
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12 md:py-20">
      <div className="flex flex-col items-center text-center">
        <div className="kicker mb-4 border border-white/20 px-3 py-1 text-white/60">
          <span className="h-1.5 w-1.5 bg-white" />
          New Operative
        </div>
        <h1 className="font-sans text-[42px] font-black sm:text-[56px] text-white">
          <ScrambleText text="REGISTRATION" duration={0.45} />
        </h1>
        <p className="mt-6 max-w-xl font-mono text-[13px] leading-relaxed text-white/40">
          Initialize your profile for the Vortex network. Instant verification is active for 
          operatives matching the institutional registry.
        </p>
      </div>

      <form onSubmit={submit} className="glass-card mt-16 space-y-10 p-8 md:p-12 border-white/10 bg-black">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <FormField label="Full Name" required error={errors.fullName}>
            <div className="group relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" />
              <input className="input-glass !pl-14 h-12 border-white/10 focus:border-white transition-all bg-black" required minLength={2} maxLength={120} value={form.fullName} onChange={set('fullName')} placeholder="John Doe" />
            </div>
          </FormField>

          <FormField label="Email Address" required error={errors.email}>
            <div className="group relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" />
              <input type="email" className="input-glass !pl-14 h-12 border-white/10 focus:border-white transition-all bg-black" required value={form.email} onChange={set('email')} placeholder="john@university.edu" />
            </div>
          </FormField>

          <FormField label="Registration No." required error={errors.registrationNo} hint="As issued by your institution.">
            <div className="group relative">
              <IdCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" />
              <input className="input-glass !pl-14 h-12 border-white/10 focus:border-white transition-all bg-black" required maxLength={50} value={form.registrationNo} onChange={set('registrationNo')} placeholder="2024PS12345" />
            </div>
          </FormField>

          <FormField label="Phone Number" error={errors.phone}>
            <div className="group relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" />
              <input className="input-glass !pl-14 h-12 border-white/10 focus:border-white transition-all bg-black" maxLength={20} value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
            </div>
          </FormField>

          <FormField label="Institution" required error={errors.institutionId}>
            <div className="group relative">
              <School size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" />
              {instLoading ? (
                <div className="input-glass !pl-14 flex h-12 items-center gap-2 text-white/40"><Spinner size={12} /> Loading…</div>
              ) : (
                <select className="select-glass !pl-14 h-12 border-white/10 focus:border-white transition-all bg-black" required value={form.institutionId} onChange={set('institutionId')}>
                  <option value="">Select institution…</option>
                  {instData?.institutions.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              )}
            </div>
          </FormField>

          <FormField label="Preferred Domain" required error={errors.domainId}>
            <div className="group relative">
              <Box size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" />
              {domLoading ? (
                <div className="input-glass !pl-14 flex h-12 items-center gap-2 text-white/40"><Spinner size={12} /> Loading…</div>
              ) : (
                <select className="select-glass !pl-14 h-12 border-white/10 focus:border-white transition-all bg-black" required value={form.domainId} onChange={set('domainId')}>
                  <option value="">Select domain…</option>
                  {domData?.domains.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              )}
            </div>
          </FormField>

          <FormField label="Gender" required error={errors.gender}>
            <div className="group relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" />
              <select className="select-glass !pl-14 h-12 border-white/10 focus:border-white transition-all bg-black" required value={form.gender} onChange={set('gender')}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other / prefer not to say</option>
              </select>
            </div>
          </FormField>

          <FormField label="Discord ID" error={errors.discordId}>
            <div className="group relative">
              <MessageSquare size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" />
              <input className="input-glass !pl-14 h-12 border-white/10 focus:border-white transition-all bg-black" maxLength={60} value={form.discordId} onChange={set('discordId')} placeholder="john_doe" />
            </div>
          </FormField>

          <FormField label="LinkedIn Profile" error={errors.linkedinUrl}>
            <div className="group relative">
              <Linkedin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" />
              <input type="url" className="input-glass !pl-14 h-12 border-white/10 focus:border-white transition-all bg-black" value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/in/…" />
            </div>
          </FormField>

          <FormField label="GitHub Profile" error={errors.githubUrl}>
            <div className="group relative">
              <Github size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" />
              <input type="url" className="input-glass !pl-14 h-12 border-white/10 focus:border-white transition-all bg-black" value={form.githubUrl} onChange={set('githubUrl')} placeholder="https://github.com/…" />
            </div>
          </FormField>
        </div>

        <FormField label="Short Bio / Experience" hint="Up to 1000 characters." error={errors.bio}>
          <div className="group relative">
            <Globe size={18} className="absolute left-4 top-6 text-white/20 group-focus-within:text-white transition-colors" />
            <textarea
              className="input-glass !pl-14 min-h-[140px] py-4 border-white/10 focus:border-white transition-all bg-black"
              maxLength={1000}
              value={form.bio}
              onChange={set('bio')}
              placeholder="Tell us what you build and what you're into."
            />
          </div>
        </FormField>

        <div className="flex flex-col items-center justify-between gap-8 border-t border-white/5 pt-10 sm:flex-row">
          <p className="max-w-sm font-mono text-[11px] leading-relaxed text-white/20 uppercase tracking-wider">
            By registering, you agree to the Vortex event rules, code of conduct, and terms of intelligence usage.
          </p>
          <button type="submit" disabled={busy} className="glow-button flex h-14 min-w-[280px] items-center justify-center gap-4 font-sans font-black tracking-[0.2em] uppercase text-[15px]">
            {busy ? <Spinner size={20} /> : (
              <>
                <span>Initialize Profile</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};

