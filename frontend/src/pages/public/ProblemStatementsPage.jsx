import { useMemo, useState } from 'react';
import { FileText, Filter } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';

export const ProblemStatementsPage = () => {
  const [domainFilter, setDomainFilter] = useState('');
  const { data: domData } = useApi(() => api.get('/api/taxonomy/domains'), []);
  const { data, loading, error } = useApi(
    () => api.get('/api/taxonomy/problem-statements', { query: { domainId: domainFilter } }),
    [domainFilter],
  );

  const grouped = useMemo(() => {
    if (!data?.problemStatements) return [];
    const map = new Map();
    for (const ps of data.problemStatements) {
      const key = ps.domain?.id ?? 'unknown';
      if (!map.has(key)) map.set(key, { domain: ps.domain, items: [] });
      map.get(key).items.push(ps);
    }
    return Array.from(map.values());
  }, [data]);

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <PageHeader
        kicker="Challenge Catalogue"
        title="Problem Statements"
        description="Each team selects one problem statement at team-formation time."
        actions={
          <div className="relative">
            <Filter size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
            <select
              className="select-glass !w-auto !pl-12 pr-8"
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
            >
              <option value="">All domains</option>
              {domData?.domains.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        }
      />

      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({length:4}).map((_,i)=> <CardSkeleton key={i} rows={3}/>)}
        </div>
      )}
      {error && <Empty icon={FileText} title="Couldn't load" description={error.message} />}

      {data?.problemStatements?.length === 0 && (
        <Empty icon={FileText} title="No problem statements" description="Organizers will publish them shortly." />
      )}

      <div className="space-y-8">
        {grouped.map(({ domain, items }) => (
          <div key={domain?.id ?? 'unknown'}>
            <div className="mb-3 flex items-center gap-3">
              <Badge tone="cyan">{domain?.name ?? 'Unassigned'}</Badge>
              <span className="font-mono text-[11px] text-text-dim">{items.length} statement{items.length !== 1 && 's'}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((ps) => (
                <article key={ps.id} className="glass-card flat space-y-2">
                  <div className="font-sans text-[15px] font-bold leading-tight text-text-primary">{ps.title}</div>
                  {ps.description && (
                    <p className="font-mono text-[12px] leading-relaxed text-text-secondary">{ps.description}</p>
                  )}
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
