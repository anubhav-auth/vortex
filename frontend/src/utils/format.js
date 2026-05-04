// Small formatting helpers shared across pages.

export const formatRelative = (iso) => {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60)   return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60)   return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24)   return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
};

export const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export const initials = (name) => {
  if (!name) return '··';
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
};

export const titleCase = (s) =>
  (s ?? '').replace(/_/g, ' ').replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());

export const roundLabel = (round) => ({
  ROUND_1: 'Round 1',
  ROUND_2: 'Round 2',
  ROUND_3: 'Round 3',
}[round] ?? round);

export const issueLabel = (code) => ({
  MIN_TEAM_SIZE_NOT_MET:      'Add more members',
  MAX_TEAM_SIZE_EXCEEDED:     'Too many members',
  MIN_FEMALE_MEMBERS_NOT_MET: 'Needs a female member',
  MIN_DOMAIN_EXPERTS_NOT_MET: 'Needs a domain expert',
}[code] ?? code);
