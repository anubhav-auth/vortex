import { Link } from 'react-router-dom';
import { NeonBorderCard } from '../../components/ui/NeonBorderCard';
import { ScrambleText } from '../../components/ui/ScrambleText';
import './styles.css';

function Home() {
  const navItems = [
    {
      title: 'REGISTRATION',
      description: 'Initialize your participant profile and join the hackathon.',
      path: '/register',
      color: 'var(--accent-cyan)'
    },
    {
      title: 'LOGIN',
      description: 'Access your dashboard and event overview.',
      path: '/login',
      color: 'var(--accent-cyan)'
    },
    {
      title: 'LEADERBOARD',
      description: 'Track real-time performance of all active teams.',
      path: '/leaderboard',
      color: 'var(--status-live)'
    },
    {
      title: 'PROBLEM STATEMENTS',
      description: 'Review challenge details and problem statements.',
      path: '/problem-statements',
      color: 'var(--status-warn)'
    },
    {
      title: 'AWARDS',
      description: 'Recognizing excellence in project implementation.',
      path: '/awards',
      color: 'var(--status-crit)'
    }
  ];

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <ScrambleText text="VORTEX" className="title-text" />
          </h1>
          <p className="hero-subtitle">Unified Hackathon Management Platform</p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-label">STATUS</span>
              <span className="stat-value text-live">SYSTEM_READY</span>
            </div>
            <div className="stat">
              <span className="stat-label">SECURITY</span>
              <span className="stat-value">SSL_ENCRYPTED</span>
            </div>
          </div>
        </div>
      </section>

      <section className="nav-grid-container">
        <div className="nav-grid">
          {navItems.map((item, index) => (
            <Link key={index} to={item.path} className="nav-card-link">
              <NeonBorderCard className="nav-card">
                <div className="nav-card-content glass-card">
                  <h3 style={{ color: item.color }}>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="nav-card-footer">
                    <span className="access-link">View Section {'>'}</span>
                  </div>
                </div>
              </NeonBorderCard>
            </Link>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-line"></div>
          <p>© 2026 VORTEX. PROFESSIONAL HACKATHON SYSTEMS.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
