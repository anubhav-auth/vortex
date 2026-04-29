import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavigationDrawer = () => {
  const location = useLocation();

  const getLinkClasses = (path) => {
    const baseClasses = "flex items-center gap-3 px-4 py-3 font-['Space_Grotesk'] text-sm font-semibold uppercase transition-all duration-200";
    if (location.pathname === path) {
      return `${baseClasses} bg-[#00408B] text-white rounded-none border-l-4 border-cyan-400`;
    }
    return `${baseClasses} text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:pl-6`;
  };

  return (
    <aside className="fixed left-0 top-0 h-full z-40 flex flex-col pt-20 bg-slate-50 dark:bg-slate-900 w-64 border-r border-slate-200 dark:border-slate-800 border-r-[1px] border-[#00408B]/20 flat no-shadows hidden lg:flex">
      <div className="px-6 py-4">
        <p className="font-['Space_Grotesk'] text-lg font-bold uppercase text-[#00408B]">CONTROL CENTER</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        <Link to="/leaderboard" className={getLinkClasses('/leaderboard')}>
          <span className="material-symbols-outlined">leaderboard</span>
          <span>Leaderboard</span>
        </Link>
        <Link to="/register" className={getLinkClasses('/register')}>
          <span className="material-symbols-outlined">app_registration</span>
          <span>Registration</span>
        </Link>
        <Link to="/crew" className={getLinkClasses('/crew')}>
          <span className="material-symbols-outlined">engineering</span>
          <span>Form a Crew</span>
        </Link>
      </nav>
    </aside>
  );
};

export default NavigationDrawer;
