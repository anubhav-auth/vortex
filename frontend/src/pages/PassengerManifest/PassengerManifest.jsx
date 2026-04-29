import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MachinedCard from '../../components/common/MachinedCard';
import TrackDivider from '../../components/common/TrackDivider';

// Mock Data for all shortlisted candidates
const MOCK_MANIFEST = [
  { id: '101', regNo: 'ID-2024-012', name: 'Priya Patel', domain: 'AI/ML' },
  { id: '102', regNo: 'ID-2024-034', name: 'Rahul Singh', domain: 'AI/ML' },
  { id: '103', regNo: 'ID-2024-045', name: 'Arjun Sharma', domain: 'AI/ML' },
  { id: '104', regNo: 'ID-2024-056', name: 'Neha Gupta', domain: 'Web' },
  { id: '105', regNo: 'ID-2024-088', name: 'Vikram Das', domain: 'Cloud' },
  { id: '106', regNo: 'ID-2024-091', name: 'Sara Khan', domain: 'IoT' },
  { id: '107', regNo: 'ID-2024-112', name: 'Amit Kumar', domain: 'Web' },
  { id: '108', regNo: 'ID-2024-156', name: 'Pooja Reddy', domain: 'Cloud' },
  { id: '109', regNo: 'ID-2024-201', name: 'Karan Malhotra', domain: 'IoT' },
  { id: '110', regNo: 'ID-2024-222', name: 'Sneha Iyer', domain: 'AI/ML' },
];

const PassengerManifest = () => {
  const [filterDomain, setFilterDomain] = useState('All');
  const navigate = useNavigate();

  const filteredCandidates = filterDomain === 'All' 
    ? MOCK_MANIFEST 
    : MOCK_MANIFEST.filter(c => c.domain === filterDomain);

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto p-8 bg-slate-50 min-h-screen">
      
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 text-secondary uppercase font-headline-sm font-bold tracking-tighter">
            <span className="material-symbols-outlined">receipt_long</span>
            PHASE 1.5
          </div>
          <h2 className="font-headline-lg text-[#00408B] uppercase leading-tight mt-2 font-black">
            Passenger Manifest
          </h2>
          <p className="text-slate-600 mt-2 font-medium">Directory of all shortlisted candidates verified for boarding.</p>
          <TrackDivider className="w-64 mt-6" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => navigate('/crew/join')}
            className="bg-white text-[#00408B] border-2 border-[#00408B] px-8 py-3 font-bold tracking-wider uppercase hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">group_add</span>
            Join a Crew
          </button>
          <button 
            onClick={() => navigate('/crew/form')}
            className="bg-[#00408B] text-white px-8 py-3 font-bold tracking-wider uppercase hover:bg-black transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">engineering</span>
            Form a Crew
          </button>
        </div>
      </div>

      <MachinedCard className="p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200">
        
        {/* Filter Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-6 border-b border-slate-200 gap-4">
          <h3 className="font-bold text-lg text-[#00408B] uppercase tracking-wide">
            Shortlisted Candidates ({filteredCandidates.length})
          </h3>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-sm font-bold text-slate-500 uppercase">Filter by Track:</label>
            <select 
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="bg-white border border-slate-300 text-[#00408B] font-bold px-4 py-2 outline-none focus:border-[#00408B] min-w-[150px] shadow-sm appearance-none"
            >
              <option value="All">All Domains</option>
              <option value="AI/ML">AI/ML</option>
              <option value="Web">Web</option>
              <option value="Cloud">Cloud</option>
              <option value="IoT">IoT</option>
            </select>
          </div>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
              <p className="font-bold uppercase tracking-widest">No candidates found in this domain.</p>
            </div>
          ) : (
            filteredCandidates.map((candidate) => (
              <div key={candidate.id} className="bg-white border border-slate-200 p-5 hover:border-[#00408B] transition-colors group relative overflow-hidden">
                <div className="absolute right-0 top-0 w-12 h-12 bg-blue-50 -mr-6 -mt-6 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <p className="font-bold text-sm text-slate-500 mb-1">{candidate.regNo}</p>
                    <h4 className="font-black text-lg text-[#00408B] uppercase mb-2">{candidate.name}</h4>
                  </div>
                  <div className="bg-blue-100 text-[#00408B] px-3 py-1 text-xs font-bold uppercase">
                    {candidate.domain}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
      </MachinedCard>

    </div>
  );
};

export default PassengerManifest;
