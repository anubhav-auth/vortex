import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import TopAppBar from './components/common/TopAppBar';
import Registration from './pages/Registration';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import TeamFormation from './pages/TeamFormation';
import Evaluation from './pages/Evaluation';
import Leaderboard from './pages/Leaderboard';
import Awards from './pages/Awards';
import ProblemStatements from './pages/ProblemStatements';
import RetroGrid from './components/ui/RetroGrid';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [user, setUser] = useState(null);

  const handleLogout = () => setUser(null);

  return (
    <BrowserRouter>
      <div className="app-container relative min-h-screen overflow-hidden bg-[#020202]">
        <RetroGrid className="fixed inset-0 z-0" />
        <div className="relative z-10">
          <TopAppBar isRegistered={!!user} user={user} onLogout={handleLogout} />
          <Routes>
        <Route path="/" element={<Navigate to="/register" />} />
        <Route path="/register" element={<Registration onRegister={setUser} apiUrl={API_URL} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} apiUrl={API_URL} /> : <Navigate to="/register" />} />
        <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard apiUrl={API_URL} /> : <Navigate to="/register" />} />
        <Route path="/teams" element={user ? <TeamFormation user={user} apiUrl={API_URL} /> : <Navigate to="/register" />} />
        <Route path="/evaluation/:round" element={user?.role === 'jury' ? <Evaluation user={user} apiUrl={API_URL} /> : <Navigate to="/register" />} />
        <Route path="/leaderboard" element={<Leaderboard apiUrl={API_URL} />} />
        <Route path="/awards" element={<Awards apiUrl={API_URL} />} />
        <Route path="/problem-statements" element={user?.role === 'admin' ? <ProblemStatements apiUrl={API_URL} /> : <Navigate to="/register" />} />
      </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;