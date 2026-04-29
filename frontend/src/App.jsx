import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TopAppBar from './components/common/TopAppBar';
import Footer from './components/common/Footer';
import RegistrationPage from './pages/Registration/RegistrationPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import CrewPage from './pages/Crew/CrewPage';
import RequestsPage from './pages/Requests/RequestsPage';
import ManifestPage from './pages/Manifest/ManifestPage';

// Mock DB
const MOCK_CANDIDATES = [
  { id: 'u2', name: 'Priya Patel', domain: 'AI/ML', gender: 'Female', email: 'priya@university.edu', phone: '+91 98765-43210', registrationId: 'ID-2024-0012', bio: 'Passionate about deep learning and natural language processing. Experienced with PyTorch and TensorFlow.', linkedin: 'https://linkedin.com/in/priya', github: 'https://github.com/priya' },
  { id: 'u3', name: 'Rahul Singh', domain: 'AI/ML', gender: 'Male', email: 'rahul@university.edu', phone: '+91 87654-32109', registrationId: 'ID-2024-0155', bio: 'AI enthusiast looking to build scalable computer vision models. Hackathon veteran.', linkedin: 'https://linkedin.com/in/rahul', github: 'https://github.com/rahul' },
  { id: 'u4', name: 'Neha Gupta', domain: 'Web', gender: 'Female', email: 'neha@university.edu', phone: '+91 76543-21098', registrationId: 'ID-2024-0230', bio: 'Full-stack developer focused on React and Node.js. Love creating responsive, accessible UI/UX.', linkedin: 'https://linkedin.com/in/neha', github: 'https://github.com/neha' },
  { id: 'u5', name: 'Vikram Das', domain: 'Cloud', gender: 'Male', email: 'vikram@university.edu', phone: '+91 65432-10987', registrationId: 'ID-2024-0412', bio: 'AWS Certified Solutions Architect. Specialized in serverless infrastructure and DevOps pipelines.', linkedin: 'https://linkedin.com/in/vikram', github: 'https://github.com/vikram' },
  { id: 'u6', name: 'Sneha Rao', domain: 'Web', gender: 'Female', email: 'sneha@university.edu', phone: '+91 54321-09876', registrationId: 'ID-2024-0551', bio: 'Frontend engineer with an eye for design. Experienced with Next.js, Tailwind, and Framer Motion.', linkedin: 'https://linkedin.com/in/sneha', github: 'https://github.com/sneha' },
  { id: 'u7', name: 'Rohan Kumar', domain: 'IoT', gender: 'Male', email: 'rohan@university.edu', phone: '+91 43210-98765', registrationId: 'ID-2024-0722', bio: 'Hardware hacker and C++ programmer. Built multiple smart home automation prototypes.', linkedin: 'https://linkedin.com/in/rohan', github: 'https://github.com/rohan' },
  { id: 'u8', name: 'Karan Sharma', domain: 'AI/ML', gender: 'Male', email: 'karan@university.edu', phone: '+91 32109-87654', registrationId: 'ID-2024-0801', bio: 'Data scientist and predictive modeling expert. Ready to lead a winning team.', linkedin: 'https://linkedin.com/in/karan', github: 'https://github.com/karan' }
];

const MOCK_INVITES = [
  { id: 'inv1', teamName: 'Alpha Tech', from: 'Karan Sharma', fromId: 'u8', domain: 'AI/ML' }
];

const App = () => {
  // Authentication State
  const [isRegistered, setIsRegistered] = useState(false);
  const [user, setUser] = useState(null);

  // Global App State
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [problemStatement, setProblemStatement] = useState('');
  
  const [invites, setInvites] = useState(MOCK_INVITES); // Incoming
  const [sentInvites, setSentInvites] = useState([]); // Outgoing

  // Helpers for passing state
  const stateProps = {
    user,
    candidates, setCandidates,
    teamMembers, setTeamMembers,
    teamName, setTeamName,
    isLocked, setIsLocked,
    problemStatement, setProblemStatement,
    invites, setInvites,
    sentInvites, setSentInvites
  };

  return (
    <BrowserRouter>
      <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col relative">
        <TopAppBar isRegistered={isRegistered} user={user} />
        
        <main className="flex-grow flex relative w-full h-full">
          {/* Main content area */}
          <div className="w-full flex-1">
            <Routes>
              <Route path="/" element={<Navigate to={isRegistered ? "/dashboard" : "/register"} replace />} />
              
              <Route 
                path="/register" 
                element={
                  !isRegistered ? 
                    <RegistrationPage onRegister={(userData) => {
                      const formattedUser = { 
                        id: 'u0', 
                        name: userData.fullName, 
                        domain: userData.domain, 
                        gender: userData.gender,
                        email: userData.email,
                        phone: userData.phone,
                        campus: userData.campus,
                        registrationId: userData.registrationId,
                        linkedin: userData.linkedin,
                        github: userData.github,
                        bio: userData.bio,
                        profilePic: userData.profilePic
                      };
                      setUser(formattedUser);
                      setIsRegistered(true);
                    }} /> 
                  : <Navigate to="/dashboard" replace />
                } 
              />
              
              <Route 
                path="/dashboard" 
                element={isRegistered ? <DashboardPage {...stateProps} /> : <Navigate to="/register" replace />} 
              />
              
              <Route 
                path="/crew" 
                element={isRegistered ? <CrewPage {...stateProps} /> : <Navigate to="/register" replace />} 
              />
              
              <Route 
                path="/requests" 
                element={isRegistered ? <RequestsPage {...stateProps} /> : <Navigate to="/register" replace />} 
              />
              
              <Route 
                path="/manifest" 
                element={isRegistered ? <ManifestPage {...stateProps} /> : <Navigate to="/register" replace />} 
              />
            </Routes>
          </div>
        </main>
        
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
