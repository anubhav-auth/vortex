import { useEffect, useState } from 'react';
import { Save, RefreshCw, Settings } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Badge } from '../../components/ui/Badge.jsx';

export const AdminRulesPage = () => {
  const toast = useToast();
  const { data, loading, refetch } = useApi(() => api.get('/api/admin/rules'), []);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [recompute, setRecompute] = useState(null);

  useEffect(() => { if (data?.rules) setForm({ ...data.rules }); }, [data]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked
            : e.target.type === 'number'   ? Number(e.target.value)
            :                                e.target.value;
    setForm((p) => ({ ...p, [k]: v }));
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const patch = {
        minTeamSize: form.minTeamSize,
        maxTeamSize: form.maxTeamSize,
        minFemaleMembers: form.minFemaleMembers,
        minDomainExperts: form.minDomainExperts,
        registrationOpen:   form.registrationOpen,
        leaderboardVisible: form.leaderboardVisible,
        showMarks:          form.showMarks,
      };
      const res = await api.put('/api/admin/rules', patch);
      toast.success('Rules updated and teams recomputed.');
      setRecompute(res.recompute);
      refetch();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const runRecompute = async () => {
    try {
      const { summary } = await api.post('/api/admin/rules/recompute-all');
      setRecompute(summary);
      toast.success(`Recomputed ${summary.evaluated} teams.`);
    } catch (err) { toast.error(err.message); }
  };

  if (loading || !form) return (
    <>
      <PageHeader kicker="Engine" title="Hackathon rules" />
      <CardSkeleton rows={6} />
    </>
  );

  return (
    <>
      <PageHeader
        kicker="Engine"
        title="Hackathon rules"
        description="Thresholds the qualification engine evaluates after every team mutation. Changing any value triggers a full recompute."
        actions={
          <button className="ghost-button inline-flex items-center gap-2" onClick={runRecompute}>
            <RefreshCw size={12} /> Recompute all
          </button>
        }
      />

      <form onSubmit={save} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="glass-card flat space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Min team size" required>
              <input type="number" min={1} max={50} className="input-glass" value={form.minTeamSize} onChange={set('minTeamSize')} />
            </FormField>
            <FormField label="Max team size" required>
              <input type="number" min={1} max={50} className="input-glass" value={form.maxTeamSize} onChange={set('maxTeamSize')} />
            </FormField>
            <FormField label="Min female members">
              <input type="number" min={0} max={50} className="input-glass" value={form.minFemaleMembers} onChange={set('minFemaleMembers')} />
            </FormField>
            <FormField label="Min domain experts">
              <input type="number" min={0} max={50} className="input-glass" value={form.minDomainExperts} onChange={set('minDomainExperts')} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
            <Toggle label="Registration open" value={form.registrationOpen} onChange={set('registrationOpen')} />
            <Toggle label="Leaderboard visible" value={form.leaderboardVisible} onChange={set('leaderboardVisible')} />
            <Toggle label="Show marks" value={form.showMarks} onChange={set('showMarks')} />
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={busy} className="glow-button inline-flex items-center gap-2">
              {busy ? <Spinner size={14}/> : <Save size={14}/>}
              {busy ? 'Saving…' : 'Save rules'}
            </button>
          </div>
        </section>

        <aside className="glass-card flat space-y-3">
          <div className="flex items-center gap-3">
            <Settings size={16} className="text-white/40" />
            <h3 className="font-sans text-[14px] uppercase tracking-[0.15em] text-white">Last recompute</h3>
          </div>
          {recompute ? (
            <div className="space-y-2 font-mono text-[12px]">
              <Line label="Evaluated"  tone="dim"  value={recompute.evaluated} />
              <Line label="Qualified"  tone="live" value={recompute.qualified} />
              <Line label="Forming"    tone="warn" value={recompute.forming} />
              <Line label="Skipped"    tone="dim"  value={recompute.skipped} />
              {recompute.errors > 0 && <Line label="Errors" tone="crit" value={recompute.errors} />}
            </div>
          ) : (
            <p className="font-mono text-[12px] text-text-dim">Save rules or use Recompute all to refresh team statuses.</p>
          )}
        </aside>
      </form>
    </>
  );
};

const Toggle = ({ label, value, onChange }) => (
  <label className="flex cursor-pointer items-center justify-between rounded-none border border-white/10 bg-white/5 px-3 py-2.5">
    <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/60">{label}</span>
    <input type="checkbox" className="h-4 w-4 cursor-pointer accent-white" checked={value} onChange={onChange} />
  </label>
);

const Line = ({ label, value, tone }) => (
  <div className="flex items-center justify-between">
    <span className="text-text-dim">{label}</span>
    <Badge tone={tone}>{value}</Badge>
  </div>
);
