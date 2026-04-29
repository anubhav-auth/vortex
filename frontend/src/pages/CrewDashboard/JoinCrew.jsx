import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NavigationDrawer from '../../components/common/NavigationDrawer';
import MachinedCard from '../../components/common/MachinedCard';
import TrackDivider from '../../components/common/TrackDivider';

// Mock Data
const MOCK_CURRENT_USER = {
  id: 'u1',
  name: 'Arjun Sharma',
  domain: 'AI/ML'
};

const MOCK_TEAMS = [
  { 
    id: 't1', 
    name: 'Loco-Motion X', 
    domain: 'AI/ML', 
    problemStatement: 'Building an AI-driven predictive maintenance system for train bogeys using thermal imaging data.', 
    members: 3, 
    maxMembers: 4,
    needsFemale: true
  },
  { 
    id: 't2', 
    name: 'Signal Sentry', 
    domain: 'AI/ML', 
    problemStatement: 'Automated signal failure detection using edge computing and real-time computer vision.', 
    members: 2, 
    maxMembers: 4,
    needsFemale: false
  },
  { 
    id: 't3', 
    name: 'Neural Express', 
    domain: 'AI/ML', 
    problemStatement: 'Optimizing scheduling algorithms to prevent platform collision using deep reinforcement learning.', 
    members: 4, 
    maxMembers: 4,
    needsFemale: false
  }
];

const JoinCrew = () => {
  const [joinedTeamId, setJoinedTeamId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const availableTeams = MOCK_TEAMS.filter(t => t.domain === MOCK_CURRENT_USER.domain);

  const handleWithdrawRequest = () => {
    const confirmWithdraw = window.confirm("Are you sure you want to withdraw your join request?");
    if (confirmWithdraw) {
      setJoinedTeamId(null);
      alert("Request withdrawn successfully.");
    }
  };

  const handleJoinRequest = (team) => {
    if (team.members >= team.maxMembers) {
      alert("This team is already full.");
      return;
    }
    
    // CAUTION Warning as requested by user
    const confirmJoin = window.confirm(
      `CAUTION: Are you sure you want to request to join ${team.name}?\n\nOnce accepted, you cannot switch back or request to join other teams.`
    );

    if (confirmJoin) {
      setJoinedTeamId(team.id);
      alert(`Request sent to ${team.name}!`);
    }
  };

  return (
    <div className="flex w-full h-full">
      <NavigationDrawer />
      
      <main className="flex-1 lg:ml-64 p-8 bg-surface flex justify-center">
        <div className="w-full max-w-7xl">
          {/* Sub-Navigation Tabs */}
          <div className="flex border-b border-slate-300 mb-8">
            <button 
              onClick={() => navigate('/crew/join')}
              className={`px-8 py-4 font-bold uppercase tracking-widest text-sm transition-colors border-b-4 ${location.pathname === '/crew/join' ? 'border-[#00408B] text-[#00408B] bg-blue-50' : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-[#00408B]'}`}
            >
              Join a Crew
            </button>
            <button 
              onClick={() => navigate('/crew/form')}
              className={`px-8 py-4 font-bold uppercase tracking-widest text-sm transition-colors border-b-4 ${location.pathname === '/crew/form' ? 'border-[#00408B] text-[#00408B] bg-blue-50' : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-[#00408B]'}`}
            >
              Form a Crew
            </button>
          </div>

          <div className="mb-10">
            <div className="flex items-center gap-3 text-secondary uppercase font-headline-sm font-bold tracking-tighter">
              <span className="material-symbols-outlined">group_add</span>
              PHASE 2 EVALUATION
            </div>
            <h2 className="font-headline-lg text-primary uppercase leading-tight mt-2">Join a Crew</h2>
            <TrackDivider className="w-48 mt-4" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Teams List */}
            <div className="lg:col-span-8 space-y-6">
              {availableTeams.map((team) => (
                <MachinedCard key={team.id} className="p-6 transition-all hover:shadow-lg border border-slate-200">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div>
                      <h3 className="font-headline-md text-[#00408B] uppercase font-black text-xl">{team.name}</h3>
                      <p className="font-label-sm text-slate-500 uppercase mt-1">Domain: {team.domain}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {team.needsFemale && (
                        <span className="bg-pink-50 text-pink-700 border border-pink-200 px-3 py-1 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">female</span>
                          Diversity Rule Unmet
                        </span>
                      )}
                      <span className={`px-3 py-1 font-bold text-xs uppercase ${team.members >= team.maxMembers ? 'bg-error-container text-error' : 'bg-slate-100 text-slate-600'}`}>
                        {team.members} / {team.maxMembers} Members
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 border-l-4 border-[#00408B] mb-6">
                    <p className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-2">Problem Statement</p>
                    <p className="font-body-md text-slate-700">{team.problemStatement}</p>
                  </div>

                  <div className="flex justify-end">
                    {joinedTeamId === team.id ? (
                      <button disabled className="bg-green-100 text-green-800 border border-green-300 px-6 py-2 font-bold uppercase flex items-center gap-2 cursor-not-allowed">
                        <span className="material-symbols-outlined">how_to_reg</span>
                        Request Pending
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleJoinRequest(team)}
                        disabled={joinedTeamId !== null || team.members >= team.maxMembers}
                        className={`px-8 py-2 font-bold uppercase transition-colors flex items-center gap-2 ${
                          joinedTeamId !== null || team.members >= team.maxMembers
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-[#00408B] text-white hover:bg-black shadow-md'
                        }`}
                      >
                        <span className="material-symbols-outlined">send</span>
                        Request to Join
                      </button>
                    )}
                  </div>
                </MachinedCard>
              ))}
            </div>

            {/* Right Column: Status Info */}
            <div className="lg:col-span-4">
              <MachinedCard accent className="p-6 border-t-4 border-[#00408B] sticky top-24">
                <h3 className="font-headline-md text-primary uppercase text-xl mb-4">Your Status</h3>
                
                {joinedTeamId ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 p-4 flex items-start gap-3">
                      <span className="material-symbols-outlined text-green-600">hourglass_top</span>
                      <div>
                        <p className="font-bold text-green-800 uppercase text-sm mb-1">Awaiting Approval</p>
                        <p className="text-sm text-green-700 mb-4">You have requested to join a team. You cannot request to join other teams until you delete your request.</p>
                        <button 
                          onClick={handleWithdrawRequest}
                          className="text-xs bg-white border border-red-300 text-red-600 px-4 py-2 uppercase font-bold hover:bg-red-50"
                        >
                          Withdraw Request
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-600">info</span>
                      <div>
                        <p className="font-bold text-blue-800 uppercase text-sm mb-1">Looking for a Crew</p>
                        <p className="text-sm text-blue-700">Browse the problem statements of teams in your domain and send a request to join.</p>
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                      <span className="material-symbols-outlined text-amber-600">warning</span>
                      <div>
                        <p className="font-bold text-amber-800 uppercase text-sm mb-1">Action Irreversible</p>
                        <p className="text-sm text-amber-700">Once your request is accepted, you will be locked into that team permanently.</p>
                      </div>
                    </div>
                  </div>
                )}
              </MachinedCard>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default JoinCrew;
