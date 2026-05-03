import { useState } from 'react';
import { Database, Upload, Trash2, Search, Plus } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { confirm } from '../../components/ui/Confirm.jsx';

// CSV format: registrationNo,fullName,email,institutionId
const sampleCSV = `registrationNo,fullName,email,institutionId
2026-VRTX-200,Jane Doe,jane@uni.edu,<institutionId>
`;

export const AdminRegistryPage = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data, loading, refetch } = useApi(
    () => api.get('/api/admin/registry', { query: { search } }), [search],
  );
  const { data: instData } = useApi(() => api.get('/api/taxonomy/institutions'), []);

  const remove = async (entry) => {
    const ok = await confirm({
      title: `Remove ${entry.fullName}?`,
      message: 'They will no longer be auto-matched against new registrations.',
      tone: 'crit', confirmLabel: 'Remove',
    });
    if (!ok) return;
    try {
      await api.delete(`/api/admin/registry/${entry.id}`);
      toast.success('Removed.');
      refetch();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <>
      <PageHeader
        kicker="Registry"
        title="College registry"
        description="Source of truth for verifying student registrations. Bulk-upload via CSV; entries can also be removed individually."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input className="input-glass !pl-10" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button className="glow-button inline-flex items-center gap-2" onClick={() => setUploadOpen(true)}>
              <Upload size={12} /> Bulk upload
            </button>
          </div>
        }
      />

      {loading && <CardSkeleton rows={4} />}
      {!loading && data?.entries.length === 0 && (
        <Empty
          icon={Database}
          title="Registry is empty"
          description="Use Bulk upload to add entries. Each row will be matched against student registrations."
          action={<button className="glow-button inline-flex items-center gap-2" onClick={() => setUploadOpen(true)}><Plus size={12}/> Add entries</button>}
        />
      )}

      {data && data.entries.length > 0 && (
        <div className="overflow-hidden rounded-[4px] border border-border-dim bg-bg-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-dim text-left">
                <Th>Reg #</Th><Th>Name</Th><Th>Email</Th><Th>Institution</Th><Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((e) => (
                <tr key={e.id} className="border-b border-border-dim/60 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-[12px] text-text-primary">{e.registrationNo}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-text-primary">{e.fullName}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">{e.email}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">{e.institution?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button className="danger-button text-[10px]" onClick={() => remove(e)}><Trash2 size={10}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        institutions={instData?.institutions ?? []}
        onClose={() => setUploadOpen(false)}
        onDone={refetch}
      />
    </>
  );
};

const Th = ({ children, align }) => (
  <th className={`px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim ${align === 'right' ? 'text-right' : ''}`}>{children}</th>
);

// Parse a small CSV. We trust the first row as header. Quotes/commas-inside
// fields aren't supported — registry data is plain.
const parseCSV = (text) => {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');
  const cols = lines[0].split(',').map((c) => c.trim());
  return lines.slice(1).map((line, idx) => {
    const cells = line.split(',').map((c) => c.trim());
    const row = Object.fromEntries(cols.map((c, i) => [c, cells[i] ?? '']));
    if (!row.registrationNo) throw new Error(`Row ${idx + 2}: missing registrationNo`);
    return row;
  });
};

const UploadModal = ({ open, onClose, onDone, institutions }) => {
  const toast = useToast();
  const [text, setText] = useState(sampleCSV);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const rows = parseCSV(text);
      const { count } = await api.post('/api/admin/registry/bulk', { rows });
      toast.success(`Synced ${count} registry entries.`);
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Bulk upload registry" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-[4px] border border-border-dim bg-bg-void p-3 font-mono text-[11px] text-text-secondary">
          <div className="mb-1 font-bold uppercase tracking-[0.15em] text-text-dim">Available institutions</div>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {institutions.map((i) => (
              <div key={i.id} className="flex justify-between gap-2">
                <span className="truncate text-text-secondary">{i.name}</span>
                <span className="text-accent-cyan">{i.id}</span>
              </div>
            ))}
          </div>
        </div>
        <FormField label="CSV" hint="Header row required: registrationNo,fullName,email,institutionId">
          <textarea
            className="input-glass min-h-[260px] font-mono"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </FormField>
        <div className="flex justify-end gap-2">
          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={busy} className="glow-button inline-flex items-center gap-2">
            {busy ? <Spinner size={14}/> : <Upload size={14}/>}
            {busy ? 'Uploading…' : 'Sync'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
