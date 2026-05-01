import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import TopAppBar from './components/common/TopAppBar';
import Home from './pages/Home';
import Login from './pages/Login';
import Registration from './pages/Registration';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import TeamFormation from './pages/TeamFormation';
import Evaluation from './pages/Evaluation';
import Leaderboard from './pages/Leaderboard';
import Awards from './pages/Awards';
import ProblemStatements from './pages/ProblemStatements';
import RetroGrid from './components/ui/RetroGrid';
import { useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('vortex_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleSetUser = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('vortex_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('vortex_user');
      localStorage.removeItem('vortex_token');
    }
  };

  const handleLogout = () => handleSetUser(null);

  return (
    <BrowserRouter>
      <div className="app-container relative min-h-screen overflow-hidden bg-[var(--bg-void)]">
        <RetroGrid className="fixed inset-0 z-0" />
        <div className="relative z-10">
          {/* Hide TopAppBar in Admin View for full-screen Command Center */}
          <Routes>
            <Route path="/admin/*" element={null} />
            <Route path="*" element={<TopAppBar isRegistered={!!user} user={user} onLogout={handleLogout} />} />
          </Routes>
          
          <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login onLogin={handleSetUser} apiUrl={API_URL} />} />
        <Route path="/register" element={<Registration onRegister={handleSetUser} apiUrl={API_URL} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} apiUrl={API_URL} /> : <Navigate to="/register" />} />
        <Route path="/admin" element={user?.role === 'ADMIN' ? <AdminDashboard apiUrl={API_URL} user={user} onLogout={handleLogout} /> : <Navigate to="/register" />} />
        <Route path="/teams" element={user ? <TeamFormation user={user} apiUrl={API_URL} /> : <Navigate to="/register" />} />
        <Route path="/evaluation/:round" element={user?.role === 'JURY' ? <Evaluation user={user} apiUrl={API_URL} /> : <Navigate to="/register" />} />
        <Route path="/leaderboard" element={<Leaderboard apiUrl={API_URL} />} />
        <Route path="/awards" element={<Awards apiUrl={API_URL} />} />
        <Route path="/problem-statements" element={<ProblemStatements user={user} apiUrl={API_URL} />} />
      </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;