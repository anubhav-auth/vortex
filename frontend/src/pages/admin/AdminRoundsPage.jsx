import { Lock, Unlock, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { confirm } from '../../components/ui/Confirm.jsx';

const ROUND_FIELD = { ROUND_1: 'round1State', ROUND_2: 'round2State', ROUND_3: 'round3State' };
const STATES = ['LOCKED', 'UNLOCKED', 'CLOSED'];

export const AdminRoundsPage = () => {
  const toast = useToast();
  const { data, loading, refetch } = useApi(() => api.get('/api/admin/rounds'), []);

  const setState = async (round, state) => {
    if (state === 'CLOSED') {
      const ok = await confirm({
        title: 'Close this round?',
        message: 'Closing freezes scoring. Re-opening is possible but signals to the FE that scoring is final.',
        confirmLabel: 'Close round',
      });
      if (!ok) return;
    }
    try {
      await api.patch('/api/admin/rounds', { round, state });
      toast.success(`${round.replace('_',' ')} → ${state}`);
      refetch();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <>
      <PageHeader
        kicker="Round Control"
        title="Master toggles"
        description="Open or close rounds for jury scoring. Only UNLOCKED rounds accept evaluation submissions."
      />

      <div className="mb-6 flex items-center gap-3 rounded-none border border-white/20 bg-white/5 px-4 py-3 font-mono text-[12px] text-white/60">
        <AlertTriangle size={14} className="shrink-0 text-white/40" />
        Only one round should typically be open at a time. The system doesn't enforce this — it's a coordination decision.
      </div>

      {loading && <CardSkeleton rows={3} />}

      {data && (
        <div className="grid gap-4 md:grid-cols-3">
          {['ROUND_1','ROUND_2','ROUND_3'].map((r) => {
            const state = data.control[ROUND_FIELD[r]];
            const Icon = state === 'UNLOCKED' ? Unlock : Lock;
            const tone = state === 'UNLOCKED' ? 'live' : state === 'CLOSED' ? 'warn' : 'dim';
            return (
              <article key={r} className="glass-card flat space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={18} className="text-text-secondary" />
                    <h3 className="font-sans text-[16px] font-bold">{r.replace('_',' ')}</h3>
                  </div>
                  <Badge tone={tone} dot>{state}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STATES.map((s) => (
                    <button
                      key={s}
                      onClick={() => state !== s && setState(r, s)}
                      className={`rounded-none border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-all ${
                        state === s
                          ? 'border-white bg-white/10 text-white'
                          : 'border-white/10 text-white/40 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
};
