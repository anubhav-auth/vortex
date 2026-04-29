import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TopAppBar from './components/common/TopAppBar';
import Footer from './components/common/Footer';
import RegistrationPage from './pages/Registration/RegistrationPage';
import PassengerManifest from './pages/PassengerManifest/PassengerManifest';
import FormCrew from './pages/CrewDashboard/FormCrew';
import JoinCrew from './pages/CrewDashboard/JoinCrew';
import LeaderboardPage from './pages/Leaderboard/LeaderboardPage';

const App = () => {
  return (
    <BrowserRouter>
      <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col relative">
        <TopAppBar />
        
        <main className="flex-grow flex relative w-full h-full">
          {/* Main content area */}
          <div className="w-full flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/register" replace />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route path="/manifest" element={<PassengerManifest />} />
              <Route path="/crew/form" element={<FormCrew />} />
              <Route path="/crew/join" element={<JoinCrew />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
            </Routes>
          </div>
        </main>
        
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
