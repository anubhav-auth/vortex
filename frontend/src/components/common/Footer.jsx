import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full py-4 px-8 flex flex-col md:flex-row justify-between items-center mt-auto bg-[#00408B] dark:bg-black text-white font-['Space_Grotesk'] text-[10px] tracking-tight border-t-2 border-double border-white/20">
      <div className="flex items-center gap-4 mb-4 md:mb-0">
        <span className="material-symbols-outlined text-sm">train</span>
        <span className="font-bold">TECH XPRESS | SOA UNIVERSITY RAILWAYS DIVISION</span>
      </div>
      <div className="flex gap-6 uppercase">
        <a className="opacity-80 hover:opacity-100 hover:text-cyan-300 transition-colors" href="#">Privacy Policy</a>
        <a className="opacity-80 hover:opacity-100 hover:text-cyan-300 transition-colors" href="#">Technical Specifications</a>
        <a className="opacity-80 hover:opacity-100 hover:text-cyan-300 transition-colors underline font-bold" href="#">Support</a>
      </div>
    </footer>
  );
};

export default Footer;
