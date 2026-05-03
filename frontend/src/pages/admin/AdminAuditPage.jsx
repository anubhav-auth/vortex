import { useState } from 'react';
import { History, Filter } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { formatDate } from '../../utils/format.js';

const ACTIONS = [
  '', 'USER_VERIFIED', 'USER_REJECTED', 'USER_REVOKED', 'TEAM_CREATED',
  'TEAM_FINALIZED', 'TEAM_FORCE_MODIFIED', 'ROUND_STATE_CHANGED',
  'RULES_UPDATED', 'BROADCAST_SENT', 'SCORE_SUBMITTED', 'REGISTRY_SYNCED',
];

const ACTION_TONE = {
  USER_VERIFIED: 'live', USER_REJECTED: 'crit', USER_REVOKED: 'crit',
  TEAM_CREATED: 'cyan', TEAM_FINALIZED: 'live', TEAM_FORCE_MODIFIED: 'warn',
  ROUND_STATE_CHANGED: 'warn', RULES_UPDATED: 'warn',
  BROADCAST_SENT: 'cyan', SCORE_SUBMITTED: 'cyan', REGISTRY_SYNCED: 'cyan',
};

export const AdminAuditPage = () => {
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const { data, loading } = useApi(
    () => api.get('/api/admin/audit-logs', { query: { action: action || undefined, entityType: entityType || undefined, limit: 200 } }),
    [action, entityType],
  );

  return (
    <>
      <PageHeader
        kicker="History"
        title="Audit log"
        description="Every privileged action that touched the system. Filterable by action and entity type."
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <select className="select-glass !w-auto pl-9 pr-8" value={action} onChange={(e) => setAction(e.target.value)}>
                {ACTIONS.map((a) => <option key={a || 'all'} value={a}>{a || 'All actions'}</option>)}
              </select>
            </div>
            <input className="input-glass !w-auto" placeholder="Entity type (e.g. Team)" value={entityType} onChange={(e) => setEntityType(e.target.value)} />
          </div>
        }
      />

      {loading && <CardSkeleton rows={5} />}
      {!loading && data?.entries.length === 0 && (
        <Empty icon={History} title="No matching audit entries" />
      )}

      {data && data.entries.length > 0 && (
        <div className="overflow-hidden rounded-[4px] border border-border-dim bg-bg-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-dim text-left">
                <Th>When</Th><Th>Action</Th><Th>Entity</Th><Th>Actor</Th><Th>Details</Th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((e) => (
                <tr key={e.id} className="border-b border-border-dim/60 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-[11px] text-text-secondary whitespace-nowrap">{formatDate(e.createdAt)}</td>
                  <td className="px-4 py-3"><Badge tone={ACTION_TONE[e.action] ?? 'dim'}>{e.action}</Badge></td>
                  <td className="px-4 py-3 font-mono text-[11px] text-text-secondary">{e.entityType}{e.entityId ? `:${e.entityId.slice(0,8)}` : ''}</td>
                  <td className="px-4 py-3 font-mono text-[11px]">
                    {e.actor ? <>{e.actor.fullName} <span className="text-text-dim">({e.actor.role})</span></> : <span className="text-text-dim">system</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-text-secondary">
                    {e.details ? <pre className="max-w-md overflow-hidden text-ellipsis whitespace-pre-wrap text-[10px]">{JSON.stringify(e.details, null, 0)}</pre> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

const Th = ({ children }) => (
  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim">{children}</th>
);
