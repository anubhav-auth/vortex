import React, { useState } from 'react';
import MachinedCard from '../../components/common/MachinedCard';
import TrackDivider from '../../components/common/TrackDivider';
import { Link } from 'react-router-dom';

const CrewPage = ({ user, teamMembers, setTeamMembers, teamName, setTeamName, isLocked, setIsLocked, problemStatement, setProblemStatement }) => {
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);
  const [tempTeamName, setTempTeamName] = useState('');
  const [tempProblemStatement, setTempProblemStatement] = useState('');

  const [selectedProfile, setSelectedProfile] = useState(null);

  const hasFemaleMember = teamMembers.some(member => member.gender === 'Female');
  const isLeader = teamMembers.length > 0 && teamMembers[0].id === user.id;

  const handleInitializeCrew = (e) => {
    e.preventDefault();
    if (!tempTeamName.trim()) {
      alert("Please enter a crew name.");
      return;
    }
    setTeamName(tempTeamName);
    setProblemStatement(tempProblemStatement);
    setTeamMembers([user]);
    setIsInitModalOpen(false);
  };

  const removeMember = (e, member) => {
    e.stopPropagation();
    if (isLocked) return;
    if (member.id === user.id) {
      alert("You cannot remove yourself. Leave the crew instead.");
      return;
    }
    setTeamMembers(teamMembers.filter(m => m.id !== member.id));
  };

  const leaveCrew = () => {
    if (isLocked) return;
    if (isLeader) {
      alert("As the leader, leaving will dissolve the entire crew.");
    } else {
      alert("You have left the crew.");
    }
    setTeamMembers([]);
    setTeamName('');
    setProblemStatement('');
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

  return (
    <div className="flex-1 p-4 md:p-8 bg-surface flex justify-center relative">
      <div className="w-full max-w-5xl">
        <div className="mb-10">
          <div className="flex items-center gap-3 text-secondary uppercase font-headline-sm font-bold tracking-tighter">
            <span className="material-symbols-outlined">engineering</span>
            CREW MANAGEMENT
          </div>
          <h2 className="font-headline-lg text-primary uppercase leading-tight mt-2">Team Assembly</h2>
          <TrackDivider className="w-48 mt-4" />
        </div>

        {teamMembers.length === 0 ? (
          <MachinedCard className="p-10 text-center flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">group_off</span>
            <h3 className="font-headline-md text-primary uppercase mb-2">No Active Crew</h3>
            <p className="font-body-md text-slate-500 max-w-md mx-auto mb-8">
              You are currently flying solo. You can either initialize a new crew as a team leader or wait for invitations from others.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setIsInitModalOpen(true)} className="bg-[#00408B] text-white px-8 py-3 font-label-md uppercase hover:bg-primary transition-colors shadow-md">
                Initialize New Crew
              </button>
              <Link to="/requests" className="border border-[#00408B] text-[#00408B] px-8 py-3 font-label-md uppercase hover:bg-blue-50 transition-colors">
                Check Invites
              </Link>
            </div>
          </MachinedCard>
        ) : (
          <MachinedCard accent className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4 border-b border-slate-200 pb-6">
              <div>
                <h3 className="font-headline-md text-primary uppercase">{teamName || 'Your Crew'}</h3>
                <p className="font-body-md text-on-surface-variant">Domain: <span className="font-bold text-[#00408B]">{user.domain}</span></p>
              </div>
              <div className="flex items-center gap-4">
                {isLocked ? (
                  <span className="bg-primary text-white px-4 py-2 font-label-md uppercase shadow flex items-center gap-2 w-max">
                    <span className="material-symbols-outlined text-sm">lock</span> LOCKED
                  </span>
                ) : (
                  <span className="bg-secondary-container text-on-secondary-container px-4 py-2 font-label-md uppercase border border-secondary w-max">
                    ASSEMBLING
                  </span>
                )}
                {!isLocked && (
                  <button onClick={leaveCrew} className="text-error hover:underline font-label-sm uppercase">
                    {isLeader ? 'Dissolve Crew' : 'Leave Crew'}
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {teamMembers.map((member) => (
                <div 
                  key={member.id} 
                  onClick={() => setSelectedProfile(member)}
                  className="bg-surface-container p-5 border-l-4 border-[#00408B] cursor-pointer hover:bg-blue-50 transition-colors shadow-sm"
                  title="Click to view full profile"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-300 flex-shrink-0 overflow-hidden">
                        {member.profilePic ? (
                          <img src={member.profilePic} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-500">person</span>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-label-md text-primary uppercase truncate">
                          {member.name} {teamMembers[0].id === member.id && <span className="text-secondary ml-1">(Leader)</span>}
                        </p>
                        <p className="font-label-sm text-slate-500 uppercase">{member.domain}</p>
                      </div>
                    </div>
                    {!isLocked && isLeader && member.id !== user.id && (
                      <button onClick={(e) => removeMember(e, member)} className="text-error hover:bg-error-container p-2 transition-colors flex items-center justify-center flex-shrink-0 rounded-full" title="Remove Member">
                        <span className="material-symbols-outlined text-sm">person_remove</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-1 pl-[60px]">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="material-symbols-outlined text-[16px] text-[#00408B]">mail</span>
                      <span className="truncate">{member.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="material-symbols-outlined text-[16px] text-[#00408B]">phone</span>
                      <span>{member.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-8">
              <label className="font-label-md text-primary uppercase block">Problem Statement</label>
              <textarea 
                rows={4}
                disabled={isLocked || !isLeader}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                className={`w-full bg-surface border border-slate-300 p-4 font-body-md outline-none focus:border-[#00408B] ${isLocked || !isLeader ? 'opacity-70 cursor-not-allowed' : ''}`}
                placeholder={isLeader ? "Enter your team's specific problem statement..." : "Waiting for leader to add statement..."}
              />
            </div>

            {!isLocked && isLeader && (
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
        )}
      </div>

      {/* Candidate Details Modal */}
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

      {/* Initialization Modal */}
      {isInitModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <MachinedCard accent className="w-full max-w-lg bg-white p-8">
            <div className="flex justify-between items-start mb-6 border-b border-slate-200 pb-4">
              <h3 className="font-headline-md text-primary uppercase">Initialize Crew</h3>
              <button onClick={() => setIsInitModalOpen(false)} className="text-slate-400 hover:text-error">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleInitializeCrew} className="space-y-6">
              <div className="space-y-2">
                <label className="font-label-md text-primary uppercase block">Crew Name</label>
                <input 
                  required
                  autoFocus
                  type="text" 
                  value={tempTeamName}
                  onChange={(e) => setTempTeamName(e.target.value)}
                  className="w-full bg-surface border border-slate-300 p-3 font-body-md outline-none focus:border-[#00408B]"
                  placeholder="e.g. Alpha Mavericks"
                />
              </div>

              <div className="space-y-2">
                <label className="font-label-md text-primary uppercase block">Problem Statement (Optional)</label>
                <textarea 
                  rows={3}
                  value={tempProblemStatement}
                  onChange={(e) => setTempProblemStatement(e.target.value)}
                  className="w-full bg-surface border border-slate-300 p-3 font-body-md outline-none focus:border-[#00408B]"
                  placeholder="Can be added or updated later..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsInitModalOpen(false)} 
                  className="px-6 py-2 border border-slate-300 text-slate-600 font-label-md uppercase hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-[#00408B] text-white px-6 py-2 font-label-md uppercase hover:bg-primary transition-colors flex items-center gap-2"
                >
                  <span>Create Crew</span>
                  <span className="material-symbols-outlined text-sm">rocket_launch</span>
                </button>
              </div>
            </form>
          </MachinedCard>
        </div>
      )}
    </div>
  );
};

export default CrewPage;
