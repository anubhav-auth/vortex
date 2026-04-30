import { useState, useEffect } from 'react';
import { NeonBorderCard } from '../../components/ui/NeonBorderCard';
import { ScrambleText } from '../../components/ui/ScrambleText';
import './styles.css';

function AdminDashboard({ apiUrl }) {
  const [activeTab, setActiveTab] = useState('operatives');
  const [operatives, setOperatives] = useState([]);
  const [teams, setTeams] = useState([]);
  const [config, setConfig] = useState({});
  const [report, setReport] = useState(null);
  const [broadcast, setBroadcast] = useState({ subject: '', text: '', target: 'ALL' });

  useEffect(() => {
    refreshData();
  }, [apiUrl, activeTab]);

  const refreshData = async () => {
    const opRes = await fetch(`${apiUrl}/admin/students`);
    const opData = await opRes.json();
    setOperatives(opData.operatives || []);

    const teamRes = await fetch(`${apiUrl}/teams`);
    const teamData = await teamRes.json();
    setTeams(teamData.teams || []);

    const configRes = await fetch(`${apiUrl}/awards/config`);
    const configData = await configRes.json();
    setConfig(configData);

    const reportRes = await fetch(`${apiUrl}/awards/report`);
    const reportData = await reportRes.json();
    setReport(reportData.report);
  };

  const handleVerify = async (id, status) => {
    await fetch(`${apiUrl}/admin/students/${id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    refreshData();
  };

  const handleUpdateConfig = async (newConfig) => {
    await fetch(`${apiUrl}/awards/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    });
    refreshData();
  };

  const handleBroadcast = async () => {
    await fetch(`${apiUrl}/awards/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(broadcast),
    });
    alert('BROADCAST_TRANSMITTED');
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>COMMAND_CENTER</h1>
        <p>GLOBAL_SYSTEM_OVERSIGHT_AND_PROTOCOL_MANAGEMENT</p>
      </div>

      <div className="admin-tabs" style={{ display: 'flex', gap: '2px', marginBottom: '24px' }}>
        {['operatives', 'squads', 'config', 'broadcast', 'report'].map(t => (
          <button 
            key={t}
            className={`tab-btn ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}
            style={{ 
              background: activeTab === t ? 'var(--accent-cyan)' : '#000',
              color: activeTab === t ? '#000' : 'var(--text-secondary)',
              border: '1px solid var(--accent-cyan)',
              padding: '10px 15px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'operatives' && (
        <div className="glass-card table-card">
          <table className="students-table">
            <thead>
              <tr>
                <th>OPERATIVE_NAME</th>
                <th>STATION</th>
                <th>DOMAIN</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {operatives.map(o => (
                <tr key={o.id}>
                  <td className="name-cell">{o.fullName}</td>
                  <td>{o.institute?.name}</td>
                  <td>{o.domain?.name}</td>
                  <td>
                    <span className={`status-badge ${o.verificationStatus?.toLowerCase()}`}>
                      {o.verificationStatus}
                    </span>
                  </td>
                  <td>
                    {o.verificationStatus === 'PENDING' && (
                      <div className="action-buttons">
                        <button className="btn-verify" onClick={() => handleVerify(o.id, 'VERIFIED')}>APPROVE</button>
                        <button className="btn-reject" onClick={() => handleVerify(o.id, 'REJECTED')}>DENY</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'squads' && (
        <div className="glass-card table-card">
          <table className="students-table">
            <thead>
              <tr>
                <th>DESIGNATION</th>
                <th>COMMANDER</th>
                <th>OPS</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(t => (
                <tr key={t.id}>
                  <td className="name-cell">{t.teamName}</td>
                  <td>{t.leader?.fullName}</td>
                  <td>{t.memberCount}/5</td>
                  <td>
                    <span className={`status-badge ${t.teamStatus?.toLowerCase()}`}>
                      {t.teamStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="config-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <NeonBorderCard>
            <div className="glass-card">
              <h3>SYSTEM_CONTROLS</h3>
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>FORMATION_LOCKDOWN</span>
                  <button 
                    onClick={() => handleUpdateConfig({ lockdownActive: !config.lockdownActive })}
                    className="btn-verify"
                    style={{ background: config.lockdownActive ? 'var(--status-crit)' : 'transparent', color: config.lockdownActive ? '#000' : '' }}
                  >
                    {config.lockdownActive ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>LEADERBOARD_VISIBILITY</span>
                  <button 
                    onClick={() => handleUpdateConfig({ leaderboardVisible: !config.leaderboardVisible })}
                    className="btn-verify"
                  >
                    {config.leaderboardVisible ? 'VISIBLE' : 'HIDDEN'}
                  </button>
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>SHOW_TOTAL_MARKS</span>
                  <button 
                    onClick={() => handleUpdateConfig({ showMarks: !config.showMarks })}
                    className="btn-verify"
                  >
                    {config.showMarks ? 'YES' : 'NO'}
                  </button>
                </label>
              </div>
            </div>
          </NeonBorderCard>
        </div>
      )}

      {activeTab === 'broadcast' && (
        <NeonBorderCard>
          <div className="glass-card">
            <h3>GLOBAL_COMM_BROADCAST</h3>
            <div className="create-form" style={{ marginTop: '20px' }}>
              <input 
                placeholder="BROADCAST_SUBJECT" 
                className="input-glass"
                value={broadcast.subject}
                onChange={e => setBroadcast({ ...broadcast, subject: e.target.value })}
              />
              <textarea 
                placeholder="MESSAGE_CONTENT" 
                className="input-glass"
                style={{ minHeight: '150px' }}
                value={broadcast.text}
                onChange={e => setBroadcast({ ...broadcast, text: e.target.value })}
              />
              <select 
                className="select-glass"
                value={broadcast.target}
                onChange={e => setBroadcast({ ...broadcast, target: e.target.value })}
              >
                <option value="ALL">ALL_VERIFIED_OPERATIVES</option>
                <option value="LEADS">SQUAD_COMMANDERS_ONLY</option>
              </select>
              <button onClick={handleBroadcast} className="glow-button">TRANSMIT_BROADCAST</button>
            </div>
          </div>
        </NeonBorderCard>
      )}

      {activeTab === 'report' && report && (
        <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <NeonBorderCard>
            <div className="glass-card">
              <h3>OPERATIVE_STATUS_REPORT</h3>
              <div style={{ marginTop: '20px' }}>
                <p>TOTAL_OPERATIVES: {report.operatives.total}</p>
                <p style={{ color: 'var(--status-crit)' }}>UNASSIGNED: {report.operatives.unassigned}</p>
              </div>
            </div>
          </NeonBorderCard>
          <NeonBorderCard>
            <div className="glass-card">
              <h3>SQUAD_STATUS_REPORT</h3>
              <div style={{ marginTop: '20px' }}>
                <p>TOTAL_SQUADS: {report.squads.total}</p>
                <p style={{ color: 'var(--status-live)' }}>CONFIRMED: {report.squads.confirmed}</p>
                <p style={{ color: 'var(--status-warn)' }}>FORMING: {report.squads.forming}</p>
              </div>
            </div>
          </NeonBorderCard>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
