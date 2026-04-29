import React, { useState } from 'react';
import MachinedCard from '../../components/common/MachinedCard';
import TrackDivider from '../../components/common/TrackDivider';

const RegistrationPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    campus: '',
    registrationId: '',
    domain: '',
    email: '',
    phone: '',
    gender: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Submitted:', formData);
    alert('Registration Successful! (Mocked)');
  };

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-7xl mx-auto h-full bg-slate-50">
      {/* Left Info Panel */}
      <div className="w-full lg:w-5/12 p-8 lg:p-12 space-y-6 flex flex-col justify-center relative">
        <div className="space-y-2 relative z-10">
          <span className="text-[#00408B] font-label-sm uppercase tracking-widest bg-blue-100 px-3 py-1 font-bold">SOA UNIVERSITY RAILWAYS</span>
          <h2 className="text-primary font-headline-lg uppercase leading-none">CAMPUS<br />REGISTRATION</h2>
          <p className="text-on-surface-variant font-body-lg">Open registration for all university campuses. Join the ultimate technical journey across the network.</p>
        </div>
        
        <TrackDivider className="my-8 relative z-10" />
        
        <div className="space-y-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="bg-primary p-2 flex items-center justify-center">
              <span className="material-symbols-outlined text-white">timer</span>
            </div>
            <div>
              <p className="font-label-md text-primary uppercase">Departure Time</p>
              <p className="text-on-surface-variant font-body-md">24th October, 09:00 AM IST</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-primary p-2 flex items-center justify-center">
              <span className="material-symbols-outlined text-white">location_on</span>
            </div>
            <div>
              <p className="font-label-md text-primary uppercase">Platform</p>
              <p className="text-on-surface-variant font-body-md">Central Hub, Campus ITER</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 relative z-10 w-full max-w-md shadow-xl border border-white">
          <img src="https://images.unsplash.com/photo-1474487548417-781cb71495f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="High speed train" className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity" />
        </div>
        
        <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none flex justify-end items-center z-0 overflow-hidden">
          <span className="material-symbols-outlined text-[300px] transform translate-x-1/4">train</span>
        </div>
      </div>

      {/* Right Registration Form */}
      <div className="w-full lg:w-7/12 p-8 lg:p-12 flex flex-col justify-center">
        <MachinedCard accent={true} className="p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="font-label-md text-primary uppercase block text-xs">Full Name</label>
                <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-white border border-slate-200 focus:border-[#00408B] focus:ring-1 focus:ring-[#00408B] px-4 py-3 font-body-md transition-all outline-none" placeholder="e.g. ARJUN SHARMA" />
              </div>
              <div className="space-y-1">
                <label className="font-label-md text-primary uppercase block text-xs">Campus/University Name</label>
                <input required type="text" name="campus" value={formData.campus} onChange={handleChange} className="w-full bg-white border border-slate-200 focus:border-[#00408B] focus:ring-1 focus:ring-[#00408B] px-4 py-3 font-body-md transition-all outline-none" placeholder="e.g. SOA UNIVERSITY" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="font-label-md text-primary uppercase block text-xs">Registration Number (ID)</label>
                <input required type="text" name="registrationId" value={formData.registrationId} onChange={handleChange} className="w-full bg-white border border-slate-200 focus:border-[#00408B] focus:ring-1 focus:ring-[#00408B] px-4 py-3 font-body-md transition-all outline-none" placeholder="ID-2024-XXXX" />
              </div>
              <div className="space-y-1">
                <label className="font-label-md text-primary uppercase block text-xs">Domain/Theme Selection</label>
                <select required name="domain" value={formData.domain} onChange={handleChange} className="w-full bg-white border border-slate-200 focus:border-[#00408B] focus:ring-1 focus:ring-[#00408B] px-4 py-3 font-body-md transition-all outline-none">
                  <option value="" disabled>Select Your Track</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Web">Web</option>
                  <option value="Cloud">Cloud</option>
                  <option value="IoT">IoT</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="font-label-md text-primary uppercase block text-xs">Email Address</label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-white border border-slate-200 focus:border-[#00408B] focus:ring-1 focus:ring-[#00408B] px-4 py-3 font-body-md transition-all outline-none" placeholder="name@university.edu" />
              </div>
              <div className="space-y-1">
                <label className="font-label-md text-primary uppercase block text-xs">Phone Number</label>
                <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-white border border-slate-200 focus:border-[#00408B] focus:ring-1 focus:ring-[#00408B] px-4 py-3 font-body-md transition-all outline-none" placeholder="+91 XXXXX-XXXXX" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="font-label-md text-primary uppercase block text-xs">Gender (For Diversity Rule)</label>
                <select required name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-white border border-slate-200 focus:border-[#00408B] focus:ring-1 focus:ring-[#00408B] px-4 py-3 font-body-md transition-all outline-none">
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="pt-8">
              <button type="submit" className="w-full bg-[#002b61] text-white font-label-md uppercase py-4 px-8 flex items-center justify-center gap-3 shadow-lg hover:bg-black active:translate-y-0.5 transition-all">
                <span>Board the Xpress</span>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
              <p className="mt-4 text-center text-slate-400 text-[9px] uppercase font-bold tracking-widest">
                Subject to validation of university credentials
              </p>
            </div>
          </form>
        </MachinedCard>

        {/* Footer Metrics */}
        <div className="flex justify-between items-center mt-8 px-4 w-full">
          <p className="font-label-sm text-[#00408B] uppercase font-bold text-[10px] flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00408B]"></span> CONFIRMED PASSENGERS: 1,240
          </p>
          <p className="font-label-sm text-error uppercase font-bold text-[10px] flex items-center gap-2">
            <span className="w-2 h-2 bg-error"></span> SEATS REMAINING: 42
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
