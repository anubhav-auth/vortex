import { useState, useEffect } from 'react';
import { Trophy, Target, Lightbulb, Mic } from 'lucide-react';
import './styles.css';

function Awards({ apiUrl }) {
  const [awards, setAwards] = useState(null);

  useEffect(() => {
    fetch(`${apiUrl}/awards`)
      .then(res => res.json())
      .then(data => setAwards(data.awards))
      .catch(console.error);
  }, [apiUrl]);

  return (
    <div className="awards-page">
      <div className="page-header center">
        <h1><span className="gradient-text">Awards</span></h1>
        <p>Celebrating excellence</p>
      </div>

      <div className="awards-grid">
        {awards?.grandPrize && (
          <div className="glass-card grand-prize-card">
            <div className="trophy"><Trophy size={48} color="#FFD700" /></div>
            <h2>Grand Prize</h2>
            <p className="winner">{awards.grandPrize.team}</p>
            <p className="score">{awards.grandPrize.finalScore?.toFixed(2)} pts</p>
          </div>
        )}

        {awards?.domainExcellence?.map(d => (
          <div key={d.domain} className="glass-card award-card">
            <div className="award-icon"><Target size={32} color="var(--accent-cyan)" /></div>
            <h3>{d.domain} Excellence</h3>
            <p className="winner">{d.team}</p>
          </div>
        ))}

        {awards?.innovationAward && (
          <div className="glass-card award-card">
            <div className="award-icon"><Lightbulb size={32} color="#FFD700" /></div>
            <h3>Innovation Award</h3>
            <p className="winner">{awards.innovationAward.team}</p>
          </div>
        )}

        {awards?.bestPresentation && (
          <div className="glass-card award-card">
            <div className="award-icon"><Mic size={32} color="var(--status-live)" /></div>
            <h3>Best Presentation</h3>
            <p className="winner">{awards.bestPresentation.team}</p>
          </div>
        )}

        {!awards && (
          <div className="glass-card empty-awards">
            <p>No awards announced yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Awards;
