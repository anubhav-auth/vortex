import { NeonBorderCard } from '../../components/ui/NeonBorderCard';
import { ScrambleText } from '../../components/ui/ScrambleText';
import './styles.css';

function Dashboard({ user, apiUrl }) {
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1><ScrambleText text={`Welcome, ${user?.fullName}`} className="text-[var(--status-live)] font-sans" /></h1>
        <p>Institution: {user?.institute?.name || 'Unknown Station'}</p>
      </div>

      <div className="dashboard-grid">
        <NeonBorderCard>
        <div className="glass-card profile-card h-full">
          <div className="card-header">
            <h2>User Profile</h2>
          </div>
          <div className="profile-info">
            <div className="info-item">
              <span className="info-label">Roll Number</span>
              <span className="info-value">{user?.rollNumber || 'Not Found'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email Address</span>
              <span className="info-value">{user?.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Tech Stack</span>
              <span className="info-value">{user?.domain?.name || 'Unassigned'}</span>
            </div>
          </div>
        </div>
        </NeonBorderCard>

        <NeonBorderCard>
        <div className="glass-card status-card h-full">
          <div className="card-header">
            <h2>Registration Status</h2>
          </div>
          <div className="status-display">
            <div className={`status-indicator ${user?.role === 'ADMIN' ? 'verified' : user?.role === 'TEAMLEAD' ? 'verified' : 'pending'}`}>
              {user?.role === 'ADMIN' ? 'Administrator' : user?.role === 'TEAMLEAD' ? 'Team Leader' : 'Pending Verification'}
            </div>
            <p className="status-message">
              {user?.role === 'ADMIN' 
                ? 'Full administrative access granted.' 
                : user?.role === 'TEAMLEAD'
                ? 'Team leadership active. Leading the project challenge.'
                : 'Awaiting administrator verification for full participation.'}
            </p>
          </div>
        </div>
        </NeonBorderCard>

        {(user?.role === 'STUDENT' || user?.role === 'TEAMLEAD') && (
          <NeonBorderCard>
          <div className="glass-card team-preview-card h-full">
            <div className="card-header">
              <h2>Team Management</h2>
            </div>
            <div className="no-team">
              <p>{user?.role === 'TEAMLEAD' ? 'Team Active' : 'No Team Found'}</p>
              <a href="/teams" className="glow-button">
                {user?.role === 'TEAMLEAD' ? 'Manage Team' : 'Create Team'}
              </a>
            </div>
          </div>
          </NeonBorderCard>
        )}

        {user?.role === 'ADMIN' && (
          <NeonBorderCard>
          <div className="glass-card admin-ops-card h-full">
            <div className="card-header">
              <h2>Admin Dashboard</h2>
            </div>
            <div className="admin-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a href="/admin" className="action-link"> {'>'} Manage Participants</a>
              <a href="/problem-statements" className="action-link"> {'>'} Challenges</a>
              <a href="/leaderboard" className="action-link"> {'>'} Leaderboard</a>
            </div>
          </div>
          </NeonBorderCard>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
