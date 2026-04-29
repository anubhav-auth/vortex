import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const TopAppBar = () => {
  const location = useLocation();

  return (
    <header className="bg-white dark:bg-slate-950 flex justify-between items-center w-full px-6 py-4 max-w-full docked full-width top-0 border-b border-[#00408B] border-double border-b-[3px] shadow-sm z-50 sticky">
      <div className="flex items-center gap-3 w-1/4">
        <span className="material-symbols-outlined text-[#00408B] dark:text-blue-400 text-3xl">train</span>
        <h1 className="font-['Space_Grotesk'] uppercase tracking-widest font-black text-2xl text-[#00408B] dark:text-blue-500">
          TECH XPRESS
        </h1>
      </div>
      
      <div className="flex-1 flex justify-center">
        <nav className="hidden md:flex items-center gap-8 font-['Space_Grotesk'] uppercase font-medium text-sm text-slate-500 tracking-wide">
          <Link to="/register" className={`transition-colors ${location.pathname === '/register' ? 'text-[#00408B] border-b-2 border-[#00408B] pb-1' : 'hover:text-[#00408B] pb-1'}`}>
            REGISTRATION
          </Link>
          <Link to="/manifest" className={`transition-colors ${location.pathname === '/manifest' ? 'text-[#00408B] border-b-2 border-[#00408B] pb-1' : 'hover:text-[#00408B] pb-1'}`}>
            PASSENGER MANIFEST
          </Link>
          <Link to="/crew/form" className={`transition-colors ${location.pathname.startsWith('/crew') ? 'text-[#00408B] border-b-2 border-[#00408B] pb-1' : 'hover:text-[#00408B] pb-1'}`}>
            FORM A CREW
          </Link>
          <Link to="/leaderboard" className={`transition-colors ${location.pathname === '/leaderboard' ? 'text-[#00408B] border-b-2 border-[#00408B] pb-1' : 'hover:text-[#00408B] pb-1'}`}>
            LEADERBOARD
          </Link>
          <Link to="/awards" className={`transition-colors ${location.pathname === '/awards' ? 'text-[#00408B] border-b-2 border-[#00408B] pb-1' : 'hover:text-[#00408B] pb-1'}`}>
            AWARDS
          </Link>
        </nav>
      </div>
        
      <div className="flex items-center justify-end w-1/4">
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-[#00408B]">
          <img src="https://ui-avatars.com/api/?name=Arjun+Sharma&background=0D8ABC&color=fff" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
};

export default TopAppBar;
