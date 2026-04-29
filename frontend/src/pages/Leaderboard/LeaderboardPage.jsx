import React from 'react';
import NavigationDrawer from '../../components/common/NavigationDrawer';
import MachinedCard from '../../components/common/MachinedCard';
import TrackDivider from '../../components/common/TrackDivider';

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Loco-Motion X', domain: 'Logistics AI', efficiency: 95, score: 98.42, icon: 'robot_2' },
  { rank: 2, name: 'Vande Bharat V2', domain: 'Propulsion', efficiency: 88, score: 94.18, icon: 'bolt' },
  { rank: 3, name: 'Signal Sentry', domain: 'Safety Tech', efficiency: 82, score: 91.05, icon: 'sensors' },
  { rank: 4, name: 'Track Cloud', domain: 'Data Infra', efficiency: 76, score: 88.30, icon: 'cloud' }
];

const LeaderboardPage = () => {
  return (
    <div className="flex w-full h-full">
      <NavigationDrawer />
      
      <main className="flex-1 lg:ml-64 p-8 bg-surface flex justify-center">
        <div className="w-full max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-secondary uppercase font-headline-sm font-bold tracking-tighter">
              <span className="material-symbols-outlined">timeline</span>
              PHASE 3 EVALUATION
            </div>
            <h2 className="font-headline-lg text-primary uppercase leading-tight">Live Team Rankings</h2>
            <TrackDivider className="w-48 mt-4" />
          </div>
          
          <div className="bg-white p-4 border-l-4 border-[#00408B] shadow-[2px_2px_0_0_rgba(0,64,139,0.1)] flex items-center gap-4">
            <div className="w-3 h-3 bg-error rounded-full pulse-red"></div>
            <div>
              <p className="font-label-sm text-on-surface-variant">LIVE UPDATES</p>
              <p className="font-headline-sm text-primary tabular-nums">
                14:52:03 <span className="text-sm font-normal text-slate-400">IST</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Top Performer Card */}
          <div className="lg:col-span-1 bg-primary-container text-white p-6 relative overflow-hidden flex flex-col justify-between h-full shadow-lg">
            <div className="nose-cone-accent opacity-20"></div>
            <span className="material-symbols-outlined text-5xl opacity-30 mb-4">workspace_premium</span>
            <div>
              <p className="font-label-sm uppercase text-primary-fixed">Current Leader</p>
              <h3 className="font-headline-md uppercase mb-2">Loco-Motion X</h3>
              <p className="font-body-md opacity-80 italic">Logistics AI Domain</p>
            </div>
            <div className="mt-8 border-t border-white/20 pt-4">
              <span className="text-4xl font-black">98.42</span>
              <span className="text-sm uppercase opacity-70 ml-2">Points</span>
            </div>
          </div>

          {/* Leaderboard Table */}
          <MachinedCard className="lg:col-span-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 font-label-md text-primary uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 font-label-md text-primary uppercase tracking-wider">Team Name</th>
                    <th className="px-6 py-4 font-label-md text-primary uppercase tracking-wider">Domain</th>
                    <th className="px-6 py-4 font-label-md text-primary uppercase tracking-wider">Efficiency</th>
                    <th className="px-6 py-4 font-label-md text-primary uppercase tracking-wider text-right">Live Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_LEADERBOARD.map((team, index) => (
                    <tr key={team.name} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700'}`}>
                            0{team.rank}
                          </span>
                          {index === 0 && <span className="material-symbols-outlined text-amber-500 text-sm">star</span>}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary">{team.icon}</span>
                          </div>
                          <span className="font-headline-sm text-sm uppercase font-bold text-primary">{team.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-body-md text-slate-600">{team.domain}</td>
                      <td className="px-6 py-5">
                        <div className="w-32 bg-slate-100 h-1.5 overflow-hidden">
                          <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${team.efficiency}%` }}></div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-headline-sm text-primary font-black">{team.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </MachinedCard>
        </div>

        {/* Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MachinedCard className="p-6 flex items-center justify-between">
            <div>
              <p className="font-label-sm text-slate-500 uppercase">Average Score</p>
              <p className="font-headline-sm text-primary">82.4%</p>
            </div>
            <span className="material-symbols-outlined text-primary opacity-20 text-4xl">analytics</span>
          </MachinedCard>
          
          <MachinedCard className="p-6 flex items-center justify-between">
            <div>
              <p className="font-label-sm text-slate-500 uppercase">Active Teams</p>
              <p className="font-headline-sm text-primary">48 / 50</p>
            </div>
            <span className="material-symbols-outlined text-primary opacity-20 text-4xl">groups</span>
          </MachinedCard>
          
          <MachinedCard className="p-6 flex items-center justify-between">
            <div>
              <p className="font-label-sm text-slate-500 uppercase">Next Refresh</p>
              <p className="font-headline-sm text-primary">02:30</p>
            </div>
            <span className="material-symbols-outlined text-primary opacity-20 text-4xl">update</span>
          </MachinedCard>
        </div>
        </div>
      </main>
    </div>
  );
};

export default LeaderboardPage;
