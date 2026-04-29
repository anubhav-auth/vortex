import { useEffect, useState } from 'react';
import MachinedCard from '../../components/common/MachinedCard';
import NavigationDrawer from '../../components/common/NavigationDrawer';
import TrackDivider from '../../components/common/TrackDivider';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const AWARD_DEFS = [
  { key: 'grandPrize',       label: 'Grand Prize',         icon: 'workspace_premium', desc: 'Overall rank #1' },
  { key: 'innovationAward',  label: 'Innovation Award',    icon: 'lightbulb',         desc: 'Highest Round 1 score' },
  { key: 'bestPresentation', label: 'Best Presentation',   icon: 'co_present',        desc: 'Highest Grand Finale score' },
];

// These awards require jury/audience input that can't be computed from scores.
const CEREMONY_AWARDS = [
  { label: 'Most Adaptive Team',  icon: 'cached',        desc: 'Jury discretion — announced at ceremony' },
  { label: "People's Choice",     icon: 'how_to_vote',   desc: 'Audience vote — announced at ceremony' },
];

function AwardCard({ icon, label, desc, entry }) {
  const teamName = entry?.team?.teamName ?? '—';
  const domain   = entry?.team?.problemStatement?.domain?.name ?? '—';

  return (
    <MachinedCard accent className="p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary p-2">
          <span className="material-symbols-outlined text-white">{icon}</span>
        </div>
        <div>
          <p className="font-label-sm text-on-surface-variant uppercase tracking-wider">{desc}</p>
          <p className="font-headline-sm text-primary uppercase font-bold">{label}</p>
        </div>
      </div>
      <TrackDivider />
      {entry ? (
        <div>
          <p className="font-headline-md text-primary uppercase font-black leading-tight">{teamName}</p>
          <p className="font-body-md text-on-surface-variant">{domain} Domain</p>
          {entry.avgR1Score  != null && <p className="font-label-sm text-secondary mt-1">Avg R1 Score: {entry.avgR1Score.toFixed(2)}</p>}
          {entry.avgGfScore  != null && <p className="font-label-sm text-secondary mt-1">Avg GF Score: {entry.avgGfScore.toFixed(2)}</p>}
          {entry.finalScore  != null && <p className="font-label-sm text-secondary mt-1">Final Score: {entry.finalScore.toFixed(2)}</p>}
        </div>
      ) : (
        <p className="font-body-md text-on-surface-variant italic">Not yet determined</p>
      )}
    </MachinedCard>
  );
}

const AwardsPage = () => {
  const [awards, setAwards]   = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch(`${API}/api/awards`)
      .then(r => r.json())
      .then(data => {
        setAwards(data.awards);
        if (data.message) setMessage(data.message);
      })
      .catch(() => setError('Could not load awards. Is the server running?'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex w-full h-full">
      <NavigationDrawer />

      <main className="flex-1 lg:ml-64 p-8 bg-surface flex justify-center">
        <div className="w-full max-w-7xl">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-secondary uppercase font-headline-sm font-bold tracking-tighter">
                <span className="material-symbols-outlined">emoji_events</span>
                PHASE 3 — RESULTS
              </div>
              <h2 className="font-headline-lg text-primary uppercase leading-tight">Awards & Honours</h2>
              <TrackDivider className="w-48 mt-4" />
            </div>
          </div>

          {/* State: loading / error / no data */}
          {loading && (
            <MachinedCard className="p-8 text-center text-on-surface-variant font-body-md">
              Loading awards…
            </MachinedCard>
          )}
          {error && (
            <MachinedCard className="p-8 text-center text-error font-body-md">{error}</MachinedCard>
          )}
          {!loading && !error && !awards && (
            <MachinedCard className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4 block">hourglass_empty</span>
              <p className="font-headline-sm text-primary uppercase">Results Pending</p>
              <p className="font-body-md text-on-surface-variant mt-2">{message || 'Leaderboard has not been calculated yet.'}</p>
            </MachinedCard>
          )}

          {/* Awards grid */}
          {!loading && !error && awards && (
            <>
              {/* Grand Prize — full width */}
              {awards.grandPrize && (
                <div className="mb-8">
                  <div className="bg-primary-container text-white p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden shadow-lg">
                    <div className="nose-cone-accent opacity-10 pointer-events-none" />
                    <span className="material-symbols-outlined text-7xl opacity-60">workspace_premium</span>
                    <div className="flex-1">
                      <p className="font-label-sm uppercase text-primary-fixed tracking-widest mb-1">Grand Prize — Rank #1</p>
                      <h3 className="font-headline-lg uppercase font-black leading-tight">
                        {awards.grandPrize.team?.teamName ?? '—'}
                      </h3>
                      <p className="font-body-lg opacity-80 mt-1">
                        {awards.grandPrize.team?.problemStatement?.domain?.name ?? '—'} Domain
                      </p>
                      {awards.grandPrize.finalScore != null && (
                        <p className="mt-4 text-4xl font-black tabular-nums">
                          {awards.grandPrize.finalScore.toFixed(2)}
                          <span className="text-base font-normal opacity-70 ml-2">pts</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Innovation + Best Presentation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {AWARD_DEFS.filter(a => a.key !== 'grandPrize').map(({ key, label, icon, desc }) => (
                  <AwardCard key={key} icon={icon} label={label} desc={desc} entry={awards[key]} />
                ))}
              </div>

              {/* Domain Excellence */}
              {awards.domainExcellence?.length > 0 && (
                <>
                  <div className="flex items-center gap-3 text-secondary uppercase font-headline-sm font-bold tracking-tighter mb-6">
                    <span className="material-symbols-outlined">military_tech</span>
                    Domain Excellence
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {awards.domainExcellence.map((entry) => {
                      const domain = entry.team?.problemStatement?.domain?.name ?? 'Unknown';
                      return (
                        <MachinedCard key={entry.teamId} className="p-5">
                          <p className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">{domain}</p>
                          <p className="font-headline-sm text-primary uppercase font-bold">
                            {entry.team?.teamName ?? '—'}
                          </p>
                          {entry.finalScore != null && (
                            <p className="font-label-sm text-secondary mt-2">
                              Score: {entry.finalScore.toFixed(2)}
                            </p>
                          )}
                        </MachinedCard>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Ceremony Awards — jury/audience input, not computable from scores */}
              <div className="flex items-center gap-3 text-secondary uppercase font-headline-sm font-bold tracking-tighter mt-10 mb-6">
                <span className="material-symbols-outlined">celebration</span>
                Special Awards
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CEREMONY_AWARDS.map(({ label, icon, desc }) => (
                  <MachinedCard key={label} className="p-6 flex items-center gap-5">
                    <div className="bg-slate-100 p-3 flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-3xl">{icon}</span>
                    </div>
                    <div>
                      <p className="font-headline-sm text-primary uppercase font-bold">{label}</p>
                      <p className="font-body-sm text-on-surface-variant mt-1">{desc}</p>
                    </div>
                  </MachinedCard>
                ))}
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
};

export default AwardsPage;
