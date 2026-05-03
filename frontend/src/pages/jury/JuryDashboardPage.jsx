import { useMemo, useState } from 'react';
import { Gavel, ClipboardCheck, Lock, Search, Send } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { roundLabel } from '../../utils/format.js';

const ROUNDS = ['ROUND_1', 'ROUND_2', 'ROUND_3'];

const ROUND_FIELD = {
  ROUND_1: 'round1State',
  ROUND_2: 'round2State',
  ROUND_3: 'round3State',
};

// ── 5-metric score form ──────────────────────────────────────────────────
const METRICS = [
  { key: 'innovation',   label: 'Innovation & Novelty' },
  { key: 'complexity',   label: 'Technical Complexity' },
  { key: 'presentation', label: 'Presentation & UI/UX' },
  { key: 'impact',       label: 'Impact & Utility' },
  { key: 'feasibility',  label: 'Feasibility & Scalability' },
];

const ScoreSlider = ({ label, value, onChange }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.15em] text-text-secondary">
      <span>{label}</span>
      <span className="text-accent-cyan">{value} / 10</span>
    </div>
    <input
      type="range"
      min={0} max={10} step={1}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1 w-full cursor-pointer appearance-none rounded bg-bg-void accent-accent-cyan"
    />
  </div>
);

const EvaluationModal = ({ open, onClose, assignment, roundUnlocked, existing, onSaved }) => {
  const toast = useToast();
  const [scores, setScores] = useState(() => ({
    innovation:   existing?.innovation   ?? 5,
    complexity:   existing?.complexity   ?? 5,
    presentation: existing?.presentation ?? 5,
    impact:       existing?.impact       ?? 5,
    feasibility:  existing?.feasibility  ?? 5,
  }));
  const [feedback, setFeedback] = useState(existing?.feedback ?? '');
  const [busy, setBusy] = useState(false);

  const total = METRICS.reduce((s, m) => s + (scores[m.key] ?? 0), 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!roundUnlocked) {
      toast.warn('Round is not currently open for scoring.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/jury/evaluations', {
        teamId: assignment.team.id,
        round:  assignment.round,
        scores,
        feedback: feedback.trim() || undefined,
      });
      toast.success('Evaluation saved.');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally { setBusy(false); }
  };

  if (!assignment) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`${roundLabel(assignment.round)} · ${assignment.team.name}`}
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-[4px] border border-border-dim bg-bg-void p-4">
          <div className="kicker mb-1">{assignment.team.domain?.name}</div>
          <div className="font-sans text-[14px] text-text-primary">
            {assignment.team.problemStatement?.title ?? 'No problem statement assigned'}
          </div>
        </div>

        {!roundUnlocked && (
          <div className="flex items-center gap-3 rounded-[4px] border border-status-warn/40 bg-status-warn/5 px-4 py-3 font-mono text-[12px] text-status-warn">
            <Lock size={14} /> This round is currently locked. Submissions disabled.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {METRICS.map((m) => (
            <ScoreSlider
              key={m.key}
              label={m.label}
              value={scores[m.key]}
              onChange={(v) => setScores((p) => ({ ...p, [m.key]: v }))}
            />
          ))}
        </div>

        <FormField label="Feedback" hint="Optional. Up to 2000 characters.">
          <textarea
            className="input-glass min-h-[110px]"
            maxLength={2000}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What worked, what could improve."
          />
        </FormField>

        <div className="flex items-center justify-between border-t border-border-dim pt-4">
          <div className="font-mono text-[13px]">
            Total: <span className="text-accent-cyan">{total}</span> <span className="text-text-dim">/ 50</span>
          </div>
          <div className="flex gap-2">
            <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={busy || !roundUnlocked} className="glow-button inline-flex items-center gap-2">
              {busy ? <Spinner size={14} /> : <Send size={14} />}
              {existing ? 'Update score' : 'Submit score'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────
export const JuryDashboardPage = () => {
  const [round, setRound] = useState('ROUND_1');
  const [filter, setFilter] = useState('');
  const [active, setActive] = useState(null); // active assignment for modal

  const assignments = useApi(() => api.get('/api/jury/assignments', { query: { round } }), [round]);
  const evaluations = useApi(() => api.get('/api/jury/evaluations', { query: { round } }), [round]);
  // We need round state to gate submissions. Jury can't read /admin/rounds —
  // the API will 409 inside the txn anyway. We rely on the toast in that case.
  // For visual gating we attempt /api/admin/rounds and fall through silently.
  const rounds = useApi(async () => {
    try { return await api.get('/api/admin/rounds'); }
    catch { return null; }
  }, []);
  const roundUnlocked = rounds.data?.control?.[ROUND_FIELD[round]] === 'UNLOCKED';

  const evaluationsByTeam = useMemo(() => {
    const map = new Map();
    for (const e of evaluations.data?.evaluations ?? []) {
      map.set(`${e.team.id}:${e.round}`, e);
    }
    return map;
  }, [evaluations.data]);

  const visible = useMemo(() => {
    const list = assignments.data?.assignments ?? [];
    if (!filter) return list;
    const q = filter.toLowerCase();
    return list.filter((a) => a.team.name.toLowerCase().includes(q));
  }, [assignments.data, filter]);

  const tabs = ROUNDS.map((r) => {
    const count = (assignments.data?.assignments ?? []).filter((a) => a.round === r).length;
    return { value: r, label: roundLabel(r), badge: count || undefined, icon: ClipboardCheck };
  });

  const refresh = () => { assignments.refetch(); evaluations.refetch(); };

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        kicker="Jury Console"
        title="Evaluations"
        description="Submit scores for the teams you've been assigned. One submission per team per round."
        actions={
          <div className="relative w-72">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input className="input-glass pl-9" placeholder="Filter by team name…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
        }
      />

      <Tabs className="mb-4" value={round} onChange={setRound} items={tabs} />

      <div className="mb-4 flex items-center gap-2">
        <Badge tone={roundUnlocked ? 'live' : 'warn'} dot>
          {roundUnlocked ? 'Round open' : 'Round locked'}
        </Badge>
        <span className="font-mono text-[11px] text-text-dim">
          {visible.length} assignment{visible.length !== 1 && 's'} in {roundLabel(round).toLowerCase()}
        </span>
      </div>

      {assignments.loading && <CardSkeleton rows={3} />}
      {!assignments.loading && visible.length === 0 && (
        <Empty
          icon={Gavel}
          title="No assignments"
          description={`You don't have any teams to evaluate in ${roundLabel(round).toLowerCase()}. Contact organizers if this looks wrong.`}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((a) => {
          const submitted = evaluationsByTeam.get(`${a.team.id}:${a.round}`);
          return (
            <article key={a.id} className="glass-card flat space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="kicker mb-1">{a.team.domain?.name}</div>
                  <div className="font-sans text-[15px] font-bold text-text-primary">{a.team.name}</div>
                  <div className="font-mono text-[12px] text-text-secondary">
                    {a.team.problemStatement?.title ?? 'No PS assigned'}
                  </div>
                </div>
                {submitted ? (
                  <Badge tone="live" dot>Scored · {submitted.total}/50</Badge>
                ) : (
                  <Badge tone="warn" dot>Pending</Badge>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  className={submitted ? 'ghost-button' : 'glow-button'}
                  onClick={() => setActive(a)}
                >
                  {submitted ? 'Edit score' : 'Score now'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <EvaluationModal
        open={!!active}
        assignment={active}
        existing={active ? evaluationsByTeam.get(`${active.team.id}:${active.round}`) : null}
        roundUnlocked={roundUnlocked}
        onClose={() => setActive(null)}
        onSaved={refresh}
      />
    </section>
  );
};
