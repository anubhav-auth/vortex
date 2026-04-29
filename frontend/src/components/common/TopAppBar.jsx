import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const TopAppBar = ({ isRegistered, user }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const getLinkClass = (path) => {
    return `transition-colors ${location.pathname === path ? 'text-[#00408B] border-b-2 border-[#00408B] pb-1 font-bold' : 'hover:text-[#00408B] pb-1'}`;
  };

  const getMobileLinkClass = (path) => {
    return `block transition-colors py-2 border-l-4 ${location.pathname === path ? 'border-[#00408B] text-[#00408B] font-bold pl-3 bg-slate-50' : 'border-transparent hover:text-[#00408B] pl-3'}`;
  };

  const profileImageSrc = user?.profilePic || `https://ui-avatars.com/api/?name=${user?.name ? user.name.replace(' ', '+') : 'User'}&background=0D8ABC&color=fff`;

  return (
    <header className="bg-white dark:bg-slate-950 flex justify-between items-center w-full px-6 py-4 max-w-full docked full-width top-0 border-b border-[#00408B] border-double border-b-[3px] shadow-sm z-50 sticky">
      <div className="flex items-center gap-3 w-auto md:w-1/4">
        <span className="material-symbols-outlined text-[#00408B] dark:text-blue-400 text-3xl">train</span>
        <h1 className="font-['Space_Grotesk'] uppercase tracking-widest font-black text-xl md:text-2xl text-[#00408B] dark:text-blue-500 whitespace-nowrap">
          TECH XPRESS
        </h1>
      </div>
      
      {/* Desktop Navigation */}
      <div className="flex-1 hidden md:flex justify-center">
        <nav className="flex items-center gap-8 font-['Space_Grotesk'] uppercase font-medium text-sm text-slate-500 tracking-wide">
          {!isRegistered ? (
            <Link to="/register" className={getLinkClass('/register')}>
              REGISTRATION
            </Link>
          ) : (
            <>
              <Link to="/dashboard" className={getLinkClass('/dashboard')}>
                DASHBOARD
              </Link>
              <Link to="/crew" className={getLinkClass('/crew')}>
                CREW
              </Link>
              <Link to="/requests" className={getLinkClass('/requests')}>
                REQUESTS
              </Link>
              <Link to="/manifest" className={getLinkClass('/manifest')}>
                MANIFEST
              </Link>
            </>
          )}
        </nav>
      </div>
        
      <div className="flex items-center justify-end w-auto md:w-1/4 gap-4">
        {/* Profile Picture (Only show if registered) */}
        {isRegistered && (
          <div className="hidden md:flex w-10 h-10 rounded-full bg-slate-200 items-center justify-center overflow-hidden border border-[#00408B]">
            <img src={profileImageSrc} alt="Profile" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Mobile Hamburger Menu Icon */}
        <button className="md:hidden text-[#00408B]" onClick={toggleMenu}>
          <span className="material-symbols-outlined text-3xl">
            {isMobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 shadow-md flex flex-col md:hidden py-4 z-40 gap-2 font-['Space_Grotesk'] uppercase font-medium text-sm text-slate-600">
          {!isRegistered ? (
            <Link to="/register" onClick={toggleMenu} className="px-6 py-2 hover:text-[#00408B]">
              REGISTRATION
            </Link>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2 border-b border-slate-100 pb-3 px-6">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-[#00408B]">
                  <img src={profileImageSrc} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <span>{user?.name || 'User'}</span>
              </div>
              <div className="flex flex-col w-full">
                <Link to="/dashboard" onClick={toggleMenu} className={getMobileLinkClass('/dashboard')}>
                  DASHBOARD
                </Link>
                <Link to="/crew" onClick={toggleMenu} className={getMobileLinkClass('/crew')}>
                  CREW
                </Link>
                <Link to="/requests" onClick={toggleMenu} className={getMobileLinkClass('/requests')}>
                  REQUESTS
                </Link>
                <Link to="/manifest" onClick={toggleMenu} className={getMobileLinkClass('/manifest')}>
                  MANIFEST
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default TopAppBar;
