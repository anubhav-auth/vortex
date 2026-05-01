import { useState, useEffect } from 'react';
import { NeonBorderCard } from '../../components/ui/NeonBorderCard';
import { Search, Send, Lock, Unlock } from 'lucide-react';
import './styles.css';

function Evaluation({ user, apiUrl }) {
  const [search, setSearch] = useState('');
  const [team, setTeam] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [marks, setMarks] = useState({});
  const [feedback, setFeedback] = useState('');
  const [round, setRound] = useState(1);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    fetch(`${apiUrl}/evaluations/criteria`).then(res => res.json()).then(setCriteria);
  }, [apiUrl]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search) {
        handleSearch();
      } else {
        setTeam(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleSearch = async () => {
    const res = await fetch(`${apiUrl}/teams?search=${encodeURIComponent(search)}`);
    const data = await res.json();
    const allTeams = Array.isArray(data) ? data : (data.teams || []);
    const found = allTeams.find(t => t.teamName.toLowerCase().includes(search.toLowerCase()) || t.id === search);
    setTeam(found);
    setLocked(false);
    setMarks({});
    setFeedback('');
    
    if (found) {
        // Check if already evaluated
        const evalRes = await fetch(`${apiUrl}/evaluations?teamId=${found.id}&round=${round}`);
        const evalData = await evalRes.json();
        if (evalData.count > 0) {
            setLocked(true);
        }
    }
  };

  const handleSubmit = async () => {
    if (locked) return;
    const scores = criteria.map(c => ({
      criteriaId: c.id,
      marks: parseFloat(marks[c.id] || 0)
    }));

    const res = await fetch(`${apiUrl}/evaluations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: team.id,
        round,
        juryId: user.id,
        feedback,
        scores
      }),
    });

    if (res.ok) {
      alert('EVALUATION_SUBMITTED: DATA_LOCKED');
      setLocked(true);
    } else {
      const err = await res.json();
      alert(err.error || 'SUBMISSION_FAILURE');
    }
  };

  return (
    <div className="evaluation-page">
      <div className="page-header">
        <h1>PROJECT_EVALUATION</h1>
        <p>JURY_PANEL: {user.fullName}</p>
      </div>

      <div className="search-section" style={{ display: 'flex', gap: '10px', marginBottom: '32px' }}>
        <input 
          placeholder="ENTER_TEAM_NAME_OR_ID" 
          className="input-glass"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={handleSearch} className="glow-button"><Search size={16} className="inline mr-2" /> SEARCH_TEAM</button>
      </div>

      {team && (
        <div className="eval-container">
          <NeonBorderCard>
            <div className="glass-card">
              <h3>TEAM_DETAILS: {team.teamName}</h3>
              <p className="ps-name">CHALLENGE: {team.problemStatement.title}</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)', padding: '12px', border: '1px solid #1a1a1a' }}>
                {team.problemStatement.description || 'NO_DESCRIPTION_PROVIDED'}
              </p>
              
              <div className="members-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px', marginTop: '24px' }}>
                {team.members.map(m => (
                  <div key={m.studentId} className="participant-card" style={{ border: '1px solid #1a1a1a', padding: '10px', textAlign: 'center' }}>
                    <div style={{ width: '100%', aspectRatio: '1/1', background: '#000', marginBottom: '8px', overflow: 'hidden' }}>
                      {m.student.photo ? (
                        <img src={m.student.photo} alt={m.student.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#333' }}>NO_IMAGE</div>
                      )}
                    </div>
                    <p style={{ fontSize: '11px', fontWeight: 'bold' }}>{m.student.fullName}</p>
                    <p style={{ fontSize: '9px', color: 'var(--accent-cyan)' }}>{m.student.domain?.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </NeonBorderCard>

          <div className="evaluation-form-container" style={{ marginTop: '48px' }}>
            <div className="round-selector" style={{ display: 'flex', gap: '12px', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid var(--border-dim)' }}>
                {[1, 2, 3].map(r => (
                    <button 
                        key={r}
                        onClick={() => setRound(r)}
                        className={`glow-button ${round === r ? 'active' : ''}`}
                        style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '2px' }}
                    >
                        Round {r}
                    </button>
                ))}
            </div>

            <div className="criteria-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {criteria.map(c => (
                <div key={c.id} className="criteria-card glass-card" style={{ padding: '20px', border: '1px solid var(--border-dim)', position: 'relative' }}>
                  <div className="criteria-info" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--accent-cyan)', letterSpacing: '1px', marginBottom: '4px' }}>
                      Evaluation Metric
                    </label>
                    <h4 style={{ fontSize: '16px', color: 'var(--text-bright)', margin: 0 }}>{c.name}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>Max Score: {c.maxMarks}</p>
                  </div>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <input 
                      type="number" 
                      className="input-glass"
                      style={{ fontSize: '1.5rem', height: '60px', textAlign: 'center', width: '100%' }}
                      disabled={locked}
                      max={c.maxMarks}
                      min="0"
                      placeholder="0.0"
                      value={marks[c.id] || ''}
                      onChange={e => setMarks({ ...marks, [c.id]: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="feedback-section" style={{ marginTop: '32px' }}>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--accent-cyan)', letterSpacing: '1px', marginBottom: '8px' }}>
                General Feedback & Observations
              </label>
              <textarea 
                placeholder="Enter detailed feedback here..." 
                className="input-glass"
                style={{ minHeight: '150px', width: '100%', fontSize: '1rem', padding: '20px' }}
                disabled={locked}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              />
            </div>

            <div className="form-actions" style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                  onClick={handleSubmit} 
                  className={`glow-button submit-btn ${locked ? 'locked' : ''}`} 
                  style={{ height: '60px', minWidth: '300px', fontSize: '1.1rem' }}
                  disabled={locked}
              >
                {locked ? (
                  <><Lock size={20} className="inline mr-3" /> Evaluation Locked</>
                ) : (
                  <><Send size={20} className="inline mr-3" /> Submit Evaluation</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Evaluation;
