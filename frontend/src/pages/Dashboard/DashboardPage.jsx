import React, { useState } from 'react';
import MachinedCard from '../../components/common/MachinedCard';
import TrackDivider from '../../components/common/TrackDivider';

const DashboardPage = ({ user, setCandidates, candidates }) => {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState(user?.bio || '');

  const handleSaveBio = () => {
    // In a real app, this would be an API call. For now, we mutate the user object directly 
    // (since it's lifted state, it will persist in memory).
    user.bio = tempBio;
    setIsEditingBio(false);
  };

  const profileImageSrc = user?.profilePic || `https://ui-avatars.com/api/?name=${user?.name ? user.name.replace(' ', '+') : 'User'}&background=0D8ABC&color=fff`;

  return (
    <div className="flex-1 p-4 md:p-8 bg-surface flex justify-center">
      <div className="w-full max-w-4xl">
        <div className="mb-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-4 border-[#00408B] shadow-lg flex-shrink-0">
            <img src={profileImageSrc} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-3 text-secondary uppercase font-headline-sm font-bold tracking-tighter">
              <span className="material-symbols-outlined">person</span>
              PERSONAL DASHBOARD
            </div>
            <h2 className="font-headline-lg text-primary uppercase leading-tight mt-2">Welcome, {user?.name}</h2>
            <TrackDivider className="w-48 mt-4" />
          </div>
        </div>

        <MachinedCard accent className="p-6 md:p-10 mb-8">
          <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
            <h3 className="font-headline-md text-primary uppercase">About Me</h3>
            {!isEditingBio ? (
              <button onClick={() => setIsEditingBio(true)} className="text-[#00408B] hover:bg-blue-50 px-3 py-1 flex items-center gap-2 font-label-sm uppercase transition-colors">
                <span className="material-symbols-outlined text-sm">edit</span> Edit Bio
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditingBio(false)} className="text-slate-500 hover:bg-slate-100 px-3 py-1 font-label-sm uppercase transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveBio} className="bg-[#00408B] text-white px-3 py-1 font-label-sm uppercase hover:bg-primary transition-colors">
                  Save
                </button>
              </div>
            )}
          </div>
          
          {isEditingBio ? (
            <textarea 
              autoFocus
              rows="3" 
              value={tempBio}
              onChange={(e) => setTempBio(e.target.value)}
              className="w-full bg-surface border border-[#00408B] p-4 font-body-md outline-none focus:ring-1 focus:ring-[#00408B]"
              placeholder="Tell us about yourself..."
            />
          ) : (
            <p className="font-body-lg text-slate-600 leading-relaxed italic border-l-4 border-slate-200 pl-4 py-2 bg-slate-50">
              {user?.bio ? `"${user.bio}"` : "No bio provided yet. Add one to stand out to potential crew members!"}
            </p>
          )}
        </MachinedCard>

        <MachinedCard className="p-6 md:p-10">
          <h3 className="font-headline-md text-primary uppercase mb-6 border-b border-slate-200 pb-4">Passenger Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            <div>
              <p className="font-label-sm text-slate-500 uppercase tracking-widest mb-1">Full Name</p>
              <p className="font-body-lg text-primary font-medium">{user?.name || 'N/A'}</p>
            </div>
            
            <div>
              <p className="font-label-sm text-slate-500 uppercase tracking-widest mb-1">Registration ID</p>
              <p className="font-body-lg text-primary font-medium">{user?.registrationId || 'N/A'}</p>
            </div>

            <div>
              <p className="font-label-sm text-slate-500 uppercase tracking-widest mb-1">Campus</p>
              <p className="font-body-lg text-primary font-medium">{user?.campus || 'N/A'}</p>
            </div>

            <div>
              <p className="font-label-sm text-slate-500 uppercase tracking-widest mb-1">Domain</p>
              <p className="font-body-lg text-[#00408B] font-bold">{user?.domain || 'N/A'}</p>
            </div>

            <div>
              <p className="font-label-sm text-slate-500 uppercase tracking-widest mb-1">Email</p>
              <p className="font-body-lg text-primary font-medium">{user?.email || 'N/A'}</p>
            </div>

            <div>
              <p className="font-label-sm text-slate-500 uppercase tracking-widest mb-1">Phone</p>
              <p className="font-body-lg text-primary font-medium">{user?.phone || 'N/A'}</p>
            </div>
            
            <div>
              <p className="font-label-sm text-slate-500 uppercase tracking-widest mb-1">Gender</p>
              <p className="font-body-lg text-primary font-medium">{user?.gender || 'N/A'}</p>
            </div>

            <div className="md:col-span-2 pt-4 mt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              <div>
                <p className="font-label-sm text-slate-500 uppercase tracking-widest mb-1">LinkedIn Profile</p>
                {user?.linkedin ? (
                  <a href={user.linkedin} target="_blank" rel="noreferrer" className="font-body-lg text-[#00408B] hover:underline break-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">link</span>
                    {user.linkedin}
                  </a>
                ) : (
                  <p className="font-body-lg text-slate-400 italic">Not Provided</p>
                )}
              </div>
              
              <div>
                <p className="font-label-sm text-slate-500 uppercase tracking-widest mb-1">GitHub Profile</p>
                {user?.github ? (
                  <a href={user.github} target="_blank" rel="noreferrer" className="font-body-lg text-[#00408B] hover:underline break-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">code</span>
                    {user.github}
                  </a>
                ) : (
                  <p className="font-body-lg text-slate-400 italic">Not Provided</p>
                )}
              </div>
            </div>

          </div>
        </MachinedCard>
      </div>
    </div>
  );
};

export default DashboardPage;
