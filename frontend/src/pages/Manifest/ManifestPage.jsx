import React, { useState } from 'react';
import MachinedCard from '../../components/common/MachinedCard';
import TrackDivider from '../../components/common/TrackDivider';

const ManifestPage = ({ candidates, teamMembers, user, sentInvites, setSentInvites, isLocked }) => {
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  const isLeader = teamMembers.length > 0 && teamMembers[0].id === user.id;

  const filteredCandidates = candidates.filter(c => {
    const matchesDomain = selectedDomain === 'All' || c.domain === selectedDomain;
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.registrationId && c.registrationId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesDomain && matchesSearch;
  });

  const isTeamMember = (candidateId) => teamMembers.some(m => m.id === candidateId);
  const isInviteSent = (candidateId) => sentInvites.some(i => i.toId === candidateId);

  const sendInvite = (candidate) => {
    if (isLocked) return;
    if (!isLeader) {
      alert("First initialize your crew before sending invites.");
      return;
    }
    if (candidate.domain !== user.domain) {
      alert("You can only recruit passengers from your own domain.");
      return;
    }
    setSentInvites([...sentInvites, { id: `out_${Date.now()}`, toId: candidate.id, toName: candidate.name }]);
    alert(`Invite sent to ${candidate.name}!`);
    setSelectedCandidate(null); // Close modal on invite
  };

  return (
    <div className="flex-1 p-4 md:p-8 bg-surface flex justify-center relative">
      <div className="w-full max-w-6xl">
        <div className="mb-10">
          <div className="flex items-center gap-3 text-secondary uppercase font-headline-sm font-bold tracking-tighter">
            <span className="material-symbols-outlined">group</span>
            PASSENGER MANIFEST
          </div>
          <h2 className="font-headline-lg text-primary uppercase leading-tight mt-2">Available Candidates</h2>
          <TrackDivider className="w-48 mt-4" />
        </div>

        <MachinedCard className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4 border-b border-slate-200 pb-6">
            <div className="max-w-md">
              <p className="font-body-md text-slate-500">
                Browse through all registered passengers. Click on a passenger card to view their complete profile and send a recruitment invitation.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="w-full sm:w-64">
                <label className="font-label-sm text-slate-500 uppercase block mb-1">Search Passengers</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Name or Reg ID..."
                    className="w-full bg-surface border border-slate-300 py-2 pl-10 pr-3 font-body-md outline-none focus:border-[#00408B]"
                  />
                </div>
              </div>

              <div className="w-full sm:w-48">
                <label className="font-label-sm text-slate-500 uppercase block mb-1">Filter by Domain</label>
                <select 
                  value={selectedDomain} 
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full bg-surface border border-slate-300 p-2 font-body-md outline-none focus:border-[#00408B] h-[42px]"
                >
                  <option value="All">All Domains</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Web">Web</option>
                  <option value="Cloud">Cloud</option>
                  <option value="IoT">IoT</option>
                </select>
              </div>
            </div>
          </div>
          
          {filteredCandidates.length === 0 ? (
            <p className="text-center font-body-md text-slate-500 py-12">No passengers found matching your criteria.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCandidates.map(candidate => {
                const inTeam = isTeamMember(candidate.id);

                return (
                  <div 
                    key={candidate.id} 
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`bg-white border p-5 shadow-sm hover:shadow-md cursor-pointer transition-all transform hover:-translate-y-1 ${inTeam ? 'border-[#00408B] border-l-4' : 'border-slate-200'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-label-md text-primary uppercase text-lg">{candidate.name}</p>
                        <p className="font-label-sm text-slate-500">{candidate.gender}</p>
                      </div>
                      <span className="text-[10px] bg-[#00408B] text-white px-2 py-1 font-bold uppercase tracking-wider">{candidate.domain}</span>
                    </div>

                    <div className="bg-slate-50 p-3 text-sm font-body-md line-clamp-2 text-slate-600 border border-slate-100">
                      {candidate.bio || "No bio provided."}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </MachinedCard>
      </div>

      {/* Candidate Details Modal */}
      {selectedCandidate && (() => {
        const candidate = selectedCandidate;
        const inTeam = isTeamMember(candidate.id);
        const pending = isInviteSent(candidate.id);
        const canRecruit = isLeader && !isLocked && candidate.domain === user.domain && !inTeam && !pending;

        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <MachinedCard accent className="w-full max-w-lg bg-white p-8 relative">
              <button 
                onClick={() => setSelectedCandidate(null)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              
              <div className="mb-6 flex items-center justify-center flex-col pt-4">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-[#00408B] mb-4">
                  {candidate.profilePic ? (
                    <img src={candidate.profilePic} alt={candidate.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-5xl text-slate-400">person</span>
                  )}
                </div>
                <h3 className="font-headline-md text-primary uppercase text-3xl text-center">{candidate.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-[#00408B] text-white px-3 py-1 font-bold uppercase tracking-wider">{candidate.domain}</span>
                  <span className="text-xs text-slate-500 uppercase font-bold">{candidate.gender}</span>
                </div>
              </div>

              <TrackDivider className="w-full mb-6" />

              <div className="space-y-4 mb-6 text-center px-4">
                <p className="font-body-lg text-slate-600 leading-relaxed">
                  "{candidate.bio || "This passenger has not provided a biography yet."}"
                </p>
                {candidate.registrationId && (
                  <p className="font-label-sm text-[#00408B] uppercase tracking-widest mt-4 font-bold">
                    Reg ID: {candidate.registrationId}
                  </p>
                )}
              </div>

              <div className="flex justify-center gap-4 mb-8">
                {candidate.linkedin ? (
                  <a href={candidate.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold text-[#00408B] hover:text-blue-500 hover:underline transition-colors uppercase border border-slate-200 px-3 py-2 bg-slate-50 hover:bg-white rounded">
                    <span className="material-symbols-outlined text-[18px]">link</span> LinkedIn
                  </a>
                ) : (
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase border border-slate-200 px-3 py-2 bg-slate-50 rounded cursor-not-allowed">
                    <span className="material-symbols-outlined text-[18px]">link_off</span> No LinkedIn
                  </span>
                )}
                {candidate.github ? (
                  <a href={candidate.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold text-[#00408B] hover:text-blue-500 hover:underline transition-colors uppercase border border-slate-200 px-3 py-2 bg-slate-50 hover:bg-white rounded">
                    <span className="material-symbols-outlined text-[18px]">code</span> GitHub
                  </a>
                ) : (
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase border border-slate-200 px-3 py-2 bg-slate-50 rounded cursor-not-allowed">
                    <span className="material-symbols-outlined text-[18px]">code_off</span> No GitHub
                  </span>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200">
                <button 
                  disabled={!isLeader || inTeam || pending || candidate.domain !== user.domain}
                  onClick={() => sendInvite(candidate)}
                  className={`w-full py-4 font-label-md uppercase border transition-colors flex items-center justify-center gap-2 shadow-sm ${
                    !isLeader ? 'bg-slate-100 text-slate-500 border-slate-300 cursor-not-allowed' :
                    inTeam ? 'bg-slate-100 text-slate-400 border-transparent cursor-default' :
                    pending ? 'bg-secondary-container text-on-secondary-container border-transparent cursor-default' :
                    candidate.domain !== user.domain ? 'opacity-50 border-slate-300 text-slate-400 cursor-not-allowed' : 
                    'bg-[#00408B] text-white hover:bg-primary border-transparent'
                  }`}
                  title={
                    !isLeader ? "You must initialize a crew first" :
                    inTeam ? "Already in crew" : 
                    pending ? "Invite sent" : 
                    candidate.domain !== user.domain ? "Must be from same domain" : ""
                  }
                >
                  <span className="material-symbols-outlined text-sm">
                    {!isLeader ? 'block' : inTeam ? 'check' : pending ? 'schedule' : 'person_add'}
                  </span>
                  {!isLeader ? 'First Initialize Your Crew' : 
                   inTeam ? 'Already In Crew' : 
                   pending ? 'Invite Pending' : 
                   candidate.domain !== user.domain ? 'Domain Mismatch' : 
                   'Send Invite'}
                </button>
              </div>
            </MachinedCard>
          </div>
        );
      })()}
    </div>
  );
};

export default ManifestPage;
