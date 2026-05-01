import { Link } from 'react-router-dom';
import { Wind } from 'lucide-react';
import './styles.css';

function TopAppBar({ isRegistered, user, onLogout }) {
  return (
    <header className="topappbar">
      <div className="topappbar-content">
        <Link to="/" className="logo">
          <Wind size={24} color="var(--accent-cyan)" strokeWidth={2.5} />
        </Link>
        <nav className="nav-links">
          <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
          <Link to="/problem-statements" className="nav-link">Problem Statements</Link>
          {isRegistered ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              {user?.role !== 'ADMIN' && (
                <Link to="/teams" className="nav-link">Teams</Link>
              )}
              <Link to="/awards" className="nav-link">Awards</Link>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="nav-link admin-link">Admin</Link>
              )}
              <button onClick={onLogout} className="logout-btn">Logout</button>
            </>
          ) : (
            <Link to="/register" className="nav-link register-btn">Register</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default TopAppBar;
