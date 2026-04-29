import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NavigationDrawer from '../../components/common/NavigationDrawer';
import MachinedCard from '../../components/common/MachinedCard';
import TrackDivider from '../../components/common/TrackDivider';

// Mock Data
const MOCK_CURRENT_USER = {
  id: 'u1',
  name: 'Arjun Sharma',
  domain: 'AI/ML',
  gender: 'Male',
  isShortlisted: true
};

const MOCK_CANDIDATES = [
  { id: 'u2', name: 'Priya Patel', domain: 'AI/ML', gender: 'Female', tech: 'Python, TensorFlow' },
  { id: 'u3', name: 'Rahul Singh', domain: 'AI/ML', gender: 'Male', tech: 'PyTorch, SQL' },
  { id: 'u4', name: 'Neha Gupta', domain: 'Web', gender: 'Female', tech: 'React, Tailwind' },
  { id: 'u5', name: 'Vikram Das', domain: 'AI/ML', gender: 'Male', tech: 'OpenCV, C++' },
];

const CrewDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [teamMembers, setTeamMembers] = useState([MOCK_CURRENT_USER]);
  const [problemStatement, setProblemStatement] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES.filter(c => c.domain === MOCK_CURRENT_USER.domain));

  const hasFemaleMember = teamMembers.some(member => member.gender === 'Female');

  const addMember = (candidate) => {
    if (isLocked) return;
    if (candidate.domain !== MOCK_CURRENT_USER.domain) {
      alert("Cannot add member from a different domain!");
      return;
    }
    setTeamMembers([...teamMembers, candidate]);
    setCandidates(candidates.filter(c => c.id !== candidate.id));
  };

  const removeMember = (member) => {
    if (isLocked) return;
    if (member.id === MOCK_CURRENT_USER.id) {
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
              className={`px-8 py-4 font-bold uppercase tracking-widest text-sm transition-colors border-b-4 ${location.pathname === '/crew/form' || location.pathname === '/crew' ? 'border-[#00408B] text-[#00408B] bg-blue-50' : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-[#00408B]'}`}
            >
              Form a Crew
            </button>
          </div>

          <div className="mb-10">
          <div className="flex items-center gap-3 text-secondary uppercase font-headline-sm font-bold tracking-tighter">
            <span className="material-symbols-outlined">engineering</span>
            PHASE 2 EVALUATION
          </div>
          <h2 className="font-headline-lg text-primary uppercase leading-tight mt-2">Team Assembly Lock</h2>
          <TrackDivider className="w-48 mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Team Management */}
          <div className="lg:col-span-8 space-y-8">
            <MachinedCard accent className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-headline-md text-primary uppercase">Your Crew</h3>
                  <p className="font-body-md text-on-surface-variant">Domain: <span className="font-bold text-[#00408B]">{MOCK_CURRENT_USER.domain}</span></p>
                </div>
                {isLocked ? (
                  <span className="bg-primary text-white px-4 py-2 font-label-md uppercase shadow flex items-center gap-2">
                    <span className="material-symbols-outlined">lock</span> LOCKED
                  </span>
                ) : (
                  <span className="bg-secondary-container text-on-secondary-container px-4 py-2 font-label-md uppercase border border-secondary">
                    ASSEMBLING
                  </span>
                )}
              </div>
              
              <div className="space-y-3 mb-8">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex justify-between items-center bg-surface-container p-4 border-l-4 border-[#00408B]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-300">
                        <span className="material-symbols-outlined text-slate-500">person</span>
                      </div>
                      <div>
                        <p className="font-label-md text-primary uppercase">{member.name} {member.id === MOCK_CURRENT_USER.id && '(Leader)'}</p>
                        <p className="font-label-sm text-slate-500">{member.gender}</p>
                      </div>
                    </div>
                    {!isLocked && member.id !== MOCK_CURRENT_USER.id && (
                      <button onClick={() => removeMember(member)} className="text-error hover:bg-error-container p-2 transition-colors flex items-center justify-center">
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
                <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
                  <div className={`flex items-center gap-2 ${hasFemaleMember ? 'text-secondary' : 'text-error'}`}>
                    <span className="material-symbols-outlined">{hasFemaleMember ? 'check_circle' : 'warning'}</span>
                    <span className="font-label-md uppercase">Diversity Rule: {hasFemaleMember ? 'Met' : 'Unmet (Need 1 Female)'}</span>
                  </div>
                  <button 
                    onClick={lockTeam}
                    className="bg-[#00408B] text-white px-8 py-3 font-label-md uppercase flex items-center gap-2 hover:bg-primary transition-colors"
                  >
                    <span>Finalize Team</span>
                    <span className="material-symbols-outlined">done_all</span>
                  </button>
                </div>
              )}
            </MachinedCard>
          </div>

          {/* Right Column: Shortlisted Candidates */}
          <div className="lg:col-span-4">
            <MachinedCard className="p-6 h-full border-t-4 border-slate-300">
              <h3 className="font-headline-md text-primary uppercase text-xl mb-2">Available Passengers</h3>
              <p className="font-body-md text-sm text-on-surface-variant mb-6">Shortlisted candidates in {MOCK_CURRENT_USER.domain}</p>
              
              {candidates.length === 0 ? (
                <p className="text-center font-body-md text-slate-500 py-8">No more candidates available.</p>
              ) : (
                <div className="space-y-4">
                  {candidates.map(candidate => (
                    <div key={candidate.id} className="bg-white border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <p className="font-label-md text-primary uppercase mb-1">{candidate.name}</p>
                      <div className="flex justify-between items-center mb-4">
                        <p className="font-label-sm text-slate-500">{candidate.gender}</p>
                        <p className="font-bold text-[10px] bg-blue-50 text-[#00408B] px-2 py-1 rounded-sm">{candidate.tech}</p>
                      </div>
                      
                      <button 
                        disabled={isLocked}
                        onClick={() => addMember(candidate)}
                        className={`w-full py-2 font-label-md uppercase border ${isLocked ? 'opacity-50 border-slate-300 text-slate-400' : 'border-[#00408B] text-[#00408B] hover:bg-[#00408B] hover:text-white'} transition-colors`}
                      >
                        Recruit
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
