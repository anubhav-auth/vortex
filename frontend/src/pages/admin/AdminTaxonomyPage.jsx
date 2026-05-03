import { useState } from 'react';
import { Plus, Trash2, Edit3, ListChecks } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { confirm } from '../../components/ui/Confirm.jsx';

// Three sub-modules sharing the same shape: list + create + delete.
// PS adds an edit modal because it has a body field (description) and FK.

const NamedManager = ({ kind, list, refetch }) => {
  const toast = useToast();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/api/admin/taxonomy/${kind}`, { name: name.trim() });
      toast.success(`${name} added.`);
      setName('');
      refetch();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const remove = async (item) => {
    const ok = await confirm({
      title: `Delete ${item.name}?`,
      message: 'Will fail if in use by users, problem statements or teams.',
      tone: 'crit', confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await api.delete(`/api/admin/taxonomy/${kind}/${item.id}`);
      toast.success('Deleted.');
      refetch();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
      <form onSubmit={create} className="glass-card flat space-y-4">
        <h3 className="section-label">Add new</h3>
        <FormField label="Name" required>
          <input className="input-glass" required value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <button type="submit" disabled={busy} className="glow-button inline-flex w-full items-center justify-center gap-2">
          {busy ? <Spinner size={14}/> : <Plus size={14}/>}
          {busy ? 'Saving…' : 'Add'}
        </button>
      </form>

      <div className="space-y-2">
        {list.length === 0 && <Empty icon={ListChecks} title="Nothing here yet" />}
        {list.map((item) => (
          <div key={item.id} className="glass-card flat flex items-center justify-between gap-3">
            <div>
              <div className="font-sans text-[14px] font-bold text-text-primary">{item.name}</div>
              {item._count && (
                <div className="font-mono text-[11px] text-text-dim">
                  {item._count.problemStatements != null && `${item._count.problemStatements} PS`}
                  {item._count.teams           != null && ` · ${item._count.teams} teams`}
                </div>
              )}
            </div>
            <button className="danger-button text-[10px]" onClick={() => remove(item)}><Trash2 size={10}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProblemStatementsManager = () => {
  const toast = useToast();
  const list  = useApi(() => api.get('/api/taxonomy/problem-statements'), []);
  const dom   = useApi(() => api.get('/api/taxonomy/domains'), []);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const remove = async (ps) => {
    const ok = await confirm({
      title: `Delete "${ps.title}"?`,
      message: 'Will fail if any team has selected it.',
      tone: 'crit', confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await api.delete(`/api/admin/taxonomy/problem-statements/${ps.id}`);
      toast.success('Deleted.');
      list.refetch();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="glow-button inline-flex items-center gap-2" onClick={() => setCreating(true)}>
          <Plus size={12}/> New problem statement
        </button>
      </div>

      {list.loading && <CardSkeleton rows={3} />}
      {!list.loading && list.data?.problemStatements.length === 0 && (
        <Empty icon={ListChecks} title="No problem statements" description="Create the first one — students need at least one to form teams." />
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {list.data?.problemStatements.map((ps) => (
          <article key={ps.id} className="glass-card flat space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-sans text-[14px] font-bold text-text-primary">{ps.title}</div>
                <div className="font-mono text-[11px] text-accent-cyan">{ps.domain?.name}</div>
              </div>
              <div className="flex gap-1">
                <button className="ghost-button text-[10px]" onClick={() => setEditing(ps)}><Edit3 size={10}/></button>
                <button className="danger-button text-[10px]" onClick={() => remove(ps)}><Trash2 size={10}/></button>
              </div>
            </div>
            {ps.description && (
              <p className="font-mono text-[12px] leading-relaxed text-text-secondary">{ps.description}</p>
            )}
          </article>
        ))}
      </div>

      <PSEditor
        open={creating || !!editing}
        target={editing}
        domains={dom.data?.domains ?? []}
        onClose={() => { setEditing(null); setCreating(false); }}
        onDone={() => { list.refetch(); }}
      />
    </div>
  );
};

const PSEditor = ({ open, target, domains, onClose, onDone }) => {
  const toast = useToast();
  const isEdit = !!target;
  const [title, setTitle] = useState(target?.title ?? '');
  const [description, setDescription] = useState(target?.description ?? '');
  const [domainId, setDomainId] = useState(target?.domain?.id ?? '');
  const [busy, setBusy] = useState(false);

  // Reset on target change.
  useState(() => {
    setTitle(target?.title ?? '');
    setDescription(target?.description ?? '');
    setDomainId(target?.domain?.id ?? '');
  }, [target?.id]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        domainId,
      };
      if (isEdit) {
        await api.put(`/api/admin/taxonomy/problem-statements/${target.id}`, body);
        toast.success('Updated.');
      } else {
        await api.post('/api/admin/taxonomy/problem-statements', body);
        toast.success('Created.');
      }
      onDone();
      onClose();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  if (!open) return null;
  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit problem statement' : 'New problem statement'} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Title" required>
          <input className="input-glass" required minLength={2} maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormField>
        <FormField label="Domain" required>
          <select className="select-glass" required value={domainId} onChange={(e) => setDomainId(e.target.value)}>
            <option value="">Select…</option>
            {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </FormField>
        <FormField label="Description" hint="Up to 4000 characters.">
          <textarea className="input-glass min-h-[160px]" maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2">
          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={busy} className="glow-button inline-flex items-center gap-2">
            {busy ? <Spinner size={14}/> : null}
            {busy ? 'Saving…' : (isEdit ? 'Save changes' : 'Create')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const AdminTaxonomyPage = () => {
  const [tab, setTab] = useState('institutions');
  const inst = useApi(() => api.get('/api/taxonomy/institutions'), []);
  const dom  = useApi(() => api.get('/api/taxonomy/domains'), []);

  return (
    <>
      <PageHeader
        kicker="Taxonomy"
        title="Resources"
        description="Manage the lookup data referenced everywhere — institutions, domains, problem statements."
      />

      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'institutions',      label: 'Institutions', badge: inst.data?.institutions?.length },
          { value: 'domains',           label: 'Domains',      badge: dom.data?.domains?.length },
          { value: 'problemStatements', label: 'Problem Statements' },
        ]}
      />

      <div className="fade-in">
        {tab === 'institutions'      && (inst.loading ? <CardSkeleton rows={3}/> : <NamedManager kind="institutions" list={inst.data?.institutions ?? []} refetch={inst.refetch}/>)}
        {tab === 'domains'           && (dom.loading  ? <CardSkeleton rows={3}/> : <NamedManager kind="domains"      list={dom.data?.domains      ?? []} refetch={dom.refetch}/>)}
        {tab === 'problemStatements' && <ProblemStatementsManager />}
      </div>
    </>
  );
};
