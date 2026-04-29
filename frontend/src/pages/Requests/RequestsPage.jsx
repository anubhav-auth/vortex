import React, { useState } from 'react';
import MachinedCard from '../../components/common/MachinedCard';
import TrackDivider from '../../components/common/TrackDivider';

const RequestsPage = ({ invites, setInvites, sentInvites, setSentInvites, teamMembers, setTeamMembers, user, candidates }) => {
  const [selectedProfile, setSelectedProfile] = useState(null);

  const acceptInvite = (e, invite) => {
    e.stopPropagation();
    if (teamMembers.length > 0) {
      alert("You are already in a crew. Leave your current crew to accept this invite.");
      return;
    }
    alert(`Accepted invite from ${invite.teamName}!`);
    setInvites(invites.filter(i => i.id !== invite.id));
    
    // Find the full candidate object for the inviter
    const leader = candidates.find(c => c.id === invite.fromId) || { id: invite.fromId, name: invite.from, domain: invite.domain, gender: 'Male' };
    
    // Mocking adding the user to that team by initializing team with leader and user
    setTeamMembers([leader, user]);
  };

  const rejectInvite = (e, invite) => {
    e.stopPropagation();
    setInvites(invites.filter(i => i.id !== invite.id));
  };

  const cancelSentInvite = (invite) => {
    setSentInvites(sentInvites.filter(i => i.id !== invite.id));
  };

  const openProfile = (invite) => {
    if (invite.fromId) {
      const candidate = candidates.find(c => c.id === invite.fromId);
      if (candidate) setSelectedProfile(candidate);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 bg-surface flex justify-center relative">
      <div className="w-full max-w-5xl">
        <div className="mb-10">
          <div className="flex items-center gap-3 text-secondary uppercase font-headline-sm font-bold tracking-tighter">
            <span className="material-symbols-outlined">mail</span>
            REQUESTS
          </div>
          <h2 className="font-headline-lg text-primary uppercase leading-tight mt-2">Communications Hub</h2>
          <TrackDivider className="w-48 mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Incoming Invites */}
          <div>
            <h3 className="font-headline-md text-primary uppercase mb-4">Incoming Invites</h3>
            {invites.length === 0 ? (
              <MachinedCard className="p-8 text-center text-slate-500 font-body-md border-dashed border-2">
                No pending incoming invites.
              </MachinedCard>
            ) : (
              <div className="space-y-4">
                {invites.map(invite => (
                  <MachinedCard 
                    key={invite.id} 
                    accent 
                    className="p-6 border-l-4 border-secondary cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => openProfile(invite)}
                    title="Click to view sender's profile"
                  >
                    <p className="font-label-md text-primary uppercase text-lg">{invite.teamName}</p>
                    <p className="font-body-sm text-slate-500 mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">account_circle</span>
                      From: {invite.from} • Domain: {invite.domain}
                    </p>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => acceptInvite(e, invite)} className="flex-1 bg-[#00408B] text-white px-4 py-2 font-label-sm uppercase hover:bg-primary transition-colors">Accept</button>
                      <button onClick={(e) => rejectInvite(e, invite)} className="flex-1 border border-slate-300 text-slate-600 px-4 py-2 font-label-sm uppercase hover:bg-slate-100 transition-colors">Decline</button>
                    </div>
                  </MachinedCard>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Invites */}
          <div>
            <h3 className="font-headline-md text-primary uppercase mb-4">Sent Invites</h3>
            {sentInvites.length === 0 ? (
              <MachinedCard className="p-8 text-center text-slate-500 font-body-md border-dashed border-2">
                You haven't sent any invites. Head to the Manifest to recruit passengers.
              </MachinedCard>
            ) : (
              <div className="space-y-4">
                {sentInvites.map(invite => (
                  <MachinedCard key={invite.id} className="p-6 border-l-4 border-slate-300">
                    <p className="font-label-md text-primary uppercase text-lg">To: {invite.toName}</p>
                    <p className="font-body-sm text-slate-500 mb-4">Status: Pending</p>
                    <button onClick={() => cancelSentInvite(invite)} className="w-full border border-error text-error px-4 py-2 font-label-sm uppercase hover:bg-error-container transition-colors">
                      Cancel Request
                    </button>
                  </MachinedCard>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Candidate Details Modal for Inviter */}
      {selectedProfile && (() => {
        const candidate = selectedProfile;

        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <MachinedCard accent className="w-full max-w-lg bg-white p-8 relative">
              <button 
                onClick={() => setSelectedProfile(null)} 
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

              <div className="flex justify-center gap-4 mb-4">
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
            </MachinedCard>
          </div>
        );
      })()}
    </div>
  );
};

export default RequestsPage;
