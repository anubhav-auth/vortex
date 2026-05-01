import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeonBorderCard } from '../../components/ui/NeonBorderCard';
import { ScrambleText } from '../../components/ui/ScrambleText';
import './styles.css';

function Login({ onLogin, apiUrl }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'LOGIN_FAILED');
        return;
      }

      // Store token and user data
      localStorage.setItem('vortex_token', data.token);
      onLogin(data.user);
      
      const role = data.user.role;
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'JURY') navigate('/evaluation/1');
      else navigate('/dashboard');
    } catch (err) {
      setError('CONNECTION_ERROR');
    }
  };

  return (
    <div className="login-page">
      <NeonBorderCard className="w-full max-w-[400px]">
        <div className="login-form glass-card">
          <div className="form-header">
            <h2><ScrambleText text="User Login" className="text-3xl text-[var(--accent-cyan)] font-sans" /></h2>
            <p>Enter your credentials to continue</p>
          </div>

          {error && <div className="error-message" style={{ color: 'var(--status-crit)', textAlign: 'center', marginBottom: '10px' }}>{error}</div>}

          <form onSubmit={handleLogin} className="form-grid">
            <input
              type="email"
              placeholder="Email Address"
              className="input-glass"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="input-glass"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            
            <button type="submit" className="glow-button submit-btn">Login</button>
          </form>
          
          <div className="login-footer">
            <p>No account? <span onClick={() => navigate('/register')} className="link-text">Register Now</span></p>
          </div>
        </div>
      </NeonBorderCard>
    </div>
  );
}

export default Login;
