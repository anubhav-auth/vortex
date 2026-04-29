import React, { useState } from 'react';
import NavigationDrawer from '../../components/common/NavigationDrawer';
import MachinedCard from '../../components/common/MachinedCard';
import TrackDivider from '../../components/common/TrackDivider';

// Mock Data
const MOCK_CANDIDATES = [
  { id: 'u2', name: 'Priya Patel', domain: 'AI/ML', gender: 'Female' },
  { id: 'u3', name: 'Rahul Singh', domain: 'AI/ML', gender: 'Male' },
  { id: 'u4', name: 'Neha Gupta', domain: 'Web', gender: 'Female' },
  { id: 'u5', name: 'Vikram Das', domain: 'Cloud', gender: 'Male' },
  { id: 'u6', name: 'Sneha Rao', domain: 'Web', gender: 'Female' },
  { id: 'u7', name: 'Rohan Kumar', domain: 'IoT', gender: 'Male' },
];

const MOCK_INVITES = [
  { id: 'inv1', teamName: 'Alpha Tech', from: 'Karan Sharma', domain: 'AI/ML' }
];

const CrewDashboard = ({ user }) => {
  const currentUser = user ? { id: 'u0', name: user.fullName, domain: user.domain, gender: user.gender } : { id: 'u1', name: 'Arjun Sharma', domain: 'AI/ML', gender: 'Male' };

  const [teamMembers, setTeamMembers] = useState([currentUser]);
  const [problemStatement, setProblemStatement] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES);
  const [invites, setInvites] = useState(MOCK_INVITES);
  
  // Domain Filter State
  const [selectedDomain, setSelectedDomain] = useState('All');

  const hasFemaleMember = teamMembers.some(member => member.gender === 'Female');

  const addMember = (candidate) => {
    if (isLocked) return;
    if (candidate.domain !== currentUser.domain) {
      alert("Cannot add member from a different domain!");
      return;
    }
    setTeamMembers([...teamMembers, candidate]);
    setCandidates(candidates.filter(c => c.id !== candidate.id));
  };

  const removeMember = (member) => {
    if (isLocked) return;
    if (member.id === currentUser.id) {
      alert("You cannot remove yourself from your own team.");
      return;
    }
    setTeamMembers(teamMembers.filter(m => m.id !== member.id));
    setCandidates([...candidates, member]);
  };

  const lockTeam = () => {
    if (!hasFemaleMember) {
      alert("Diversity Rule: Your team must have at least one female member before locking.");
      return;
    }
    if (problemStatement.trim() === '') {
      alert("Please provide a Problem Statement before locking.");
      return;
    }
    setIsLocked(true);
    alert("Team Locked Successfully!");
  };

  const acceptInvite = (invite) => {
    alert(`Accepted invite from ${invite.teamName}!`);
    setInvites(invites.filter(i => i.id !== invite.id));
  };

  const rejectInvite = (invite) => {
    setInvites(invites.filter(i => i.id !== invite.id));
  };

  const filteredCandidates = candidates.filter(c => selectedDomain === 'All' || c.domain === selectedDomain);

  return (
    <div className="flex w-full h-full">
      <NavigationDrawer />
      
      <main className="flex-1 lg:ml-64 p-4 md:p-8 bg-surface flex justify-center">
        <div className="w-full max-w-7xl">
          <div className="mb-10">
          <div className="flex items-center gap-3 text-secondary uppercase font-headline-sm font-bold tracking-tighter">
            <span className="material-symbols-outlined">badge</span>
            USER PORTAL
          </div>
          <h2 className="font-headline-lg text-primary uppercase leading-tight mt-2">Welcome, {currentUser.name.split(' ')[0]}</h2>
          <TrackDivider className="w-48 mt-4" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left Column: Invites & Team Management */}
          <div className="xl:col-span-8 space-y-8">
            
            {/* Invites Section */}
            {invites.length > 0 && (
              <MachinedCard accent className="p-6 border-l-4 border-secondary">
                <h3 className="font-headline-md text-primary uppercase mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">mail</span> Pending Invites
                </h3>
                <div className="space-y-4">
                  {invites.map(invite => (
                    <div key={invite.id} className="bg-surface-container p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <p className="font-label-md text-primary uppercase">{invite.teamName}</p>
                        <p className="font-body-sm text-slate-500">From: {invite.from} • Domain: {invite.domain}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => acceptInvite(invite)} className="bg-primary text-white px-4 py-2 font-label-sm uppercase hover:bg-[#002b61] transition-colors">Accept</button>
                        <button onClick={() => rejectInvite(invite)} className="border border-slate-300 text-slate-600 px-4 py-2 font-label-sm uppercase hover:bg-slate-100 transition-colors">Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              </MachinedCard>
            )}

            <MachinedCard accent className="p-6 md:p-8">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div>
                  <h3 className="font-headline-md text-primary uppercase">Form a Crew</h3>
                  <p className="font-body-md text-on-surface-variant">Domain: <span className="font-bold text-[#00408B]">{currentUser.domain}</span></p>
                </div>
                {isLocked ? (
                  <span className="bg-primary text-white px-4 py-2 font-label-md uppercase shadow flex items-center gap-2 w-max">
                    <span className="material-symbols-outlined">lock</span> LOCKED
                  </span>
                ) : (
                  <span className="bg-secondary-container text-on-secondary-container px-4 py-2 font-label-md uppercase border border-secondary w-max">
                    ASSEMBLING
                  </span>
                )}
              </div>
              
              <div className="space-y-3 mb-8">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex justify-between items-center bg-surface-container p-4 border-l-4 border-[#00408B]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-300 flex-shrink-0">
                        <span className="material-symbols-outlined text-slate-500">person</span>
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-label-md text-primary uppercase truncate">{member.name} {member.id === currentUser.id && '(Leader)'}</p>
                        <p className="font-label-sm text-slate-500">{member.gender}</p>
                      </div>
                    </div>
                    {!isLocked && member.id !== currentUser.id && (
                      <button onClick={() => removeMember(member)} className="text-error hover:bg-error-container p-2 transition-colors flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined">person_remove</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="font-label-md text-primary uppercase block">Problem Statement</label>
                <textarea 
                  rows={4}
                  disabled={isLocked}
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  className={`w-full bg-surface border border-slate-300 p-4 font-body-md outline-none focus:border-[#00408B] ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                  placeholder="Enter your team's specific problem statement within the chosen domain..."
                />
              </div>

              {!isLocked && (
                <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className={`flex items-center gap-2 ${hasFemaleMember ? 'text-secondary' : 'text-error'}`}>
                    <span className="material-symbols-outlined">{hasFemaleMember ? 'check_circle' : 'warning'}</span>
                    <span className="font-label-md uppercase">Diversity: {hasFemaleMember ? 'Met' : 'Need 1 Female'}</span>
                  </div>
                  <button 
                    onClick={lockTeam}
                    className="w-full sm:w-auto bg-[#00408B] text-white px-8 py-3 font-label-md uppercase flex items-center justify-center gap-2 hover:bg-primary transition-colors"
                  >
                    <span>Finalize Team</span>
                    <span className="material-symbols-outlined">done_all</span>
                  </button>
                </div>
              )}
            </MachinedCard>
          </div>

          {/* Right Column: Passenger Manifest */}
          <div className="xl:col-span-4 mt-8 xl:mt-0">
            <MachinedCard className="p-6 h-full border-t-4 border-slate-300 flex flex-col">
              <h3 className="font-headline-md text-primary uppercase text-xl mb-2">Passenger Manifest</h3>
              
              <div className="mb-6">
                <label className="font-label-sm text-slate-500 uppercase block mb-1">Filter by Domain</label>
                <select 
                  value={selectedDomain} 
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full bg-surface border border-slate-300 p-2 font-body-md outline-none focus:border-[#00408B]"
                >
                  <option value="All">All Domains</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Web">Web</option>
                  <option value="Cloud">Cloud</option>
                  <option value="IoT">IoT</option>
                </select>
              </div>
              
              {filteredCandidates.length === 0 ? (
                <p className="text-center font-body-md text-slate-500 py-8">No passengers found in this domain.</p>
              ) : (
                <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: '600px' }}>
                  {filteredCandidates.map(candidate => (
                    <div key={candidate.id} className="bg-white border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-label-md text-primary uppercase">{candidate.name}</p>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 font-bold uppercase">{candidate.domain}</span>
                      </div>
                      <p className="font-label-sm text-slate-500 mb-4">{candidate.gender}</p>
                      
                      <button 
                        disabled={isLocked || candidate.domain !== currentUser.domain}
                        onClick={() => addMember(candidate)}
                        className={`w-full py-2 font-label-md uppercase border transition-colors ${
                          isLocked || candidate.domain !== currentUser.domain 
                            ? 'opacity-50 border-slate-300 text-slate-400 cursor-not-allowed' 
                            : 'border-[#00408B] text-[#00408B] hover:bg-[#00408B] hover:text-white'
                        }`}
                        title={candidate.domain !== currentUser.domain ? "Must be from same domain" : ""}
                      >
                        {candidate.domain !== currentUser.domain ? 'Domain Mismatch' : 'Recruit'}
                      </button>
                    </div>
                  ))}
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

export default CrewDashboard;
