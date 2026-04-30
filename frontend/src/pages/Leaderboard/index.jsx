import { useState, useEffect } from 'react';
import './styles.css';

function Leaderboard({ apiUrl }) {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetch(`${apiUrl}/leaderboard`)
      .then(res => res.json())
      .then(data => setLeaderboard(data.leaderboard || []))
      .catch(console.error);
  }, [apiUrl]);

  return (
    <div className="leaderboard-page">
      <div className="page-header center">
        <h1><span className="gradient-text">Leaderboard</span></h1>
        <p>Live rankings</p>
      </div>

      <div className="glass-card leaderboard-table">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>Problem Statement</th>
              <th>R1</th>
              <th>R2</th>
              <th>GF</th>
              <th>Final</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length > 0 ? (
              leaderboard.map(entry => (
                <tr key={entry.teamId} className={entry.rankPosition <= 3 ? 'top-ranked' : ''}>
                  <td className="rank-cell">
                    {entry.rankPosition <= 3 && <span className="medal">
                      {entry.rankPosition === 1 ? '🥇' : entry.rankPosition === 2 ? '🥈' : '🥉'}
                    </span>}
                    <span className="rank-num">#{entry.rankPosition}</span>
                  </td>
                  <td className="team-name">{entry.team?.teamName}</td>
                  <td className="ps-name">{entry.team?.problemStatement?.title}</td>
                  <td>{entry.r1Score?.toFixed(1) || '-'}</td>
                  <td>{entry.r2Score?.toFixed(1) || '-'}</td>
                  <td>{entry.gfScore?.toFixed(1) || '-'}</td>
                  <td className="final-score">{entry.finalScore?.toFixed(1) || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="empty-cell">
                  No rankings yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Leaderboard;