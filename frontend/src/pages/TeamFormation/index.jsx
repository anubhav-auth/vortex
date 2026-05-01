import { useState, useEffect } from 'react';
import { NeonBorderCard } from '../../components/ui/NeonBorderCard';
import { ScrambleText } from '../../components/ui/ScrambleText';
import { AlertTriangle, CheckCircle2, UserPlus, Users, MessageSquare } from 'lucide-react';
import './styles.css';

function TeamFormation({ user, apiUrl }) {
  const [myTeam, setMyTeam] = useState(null);
  const [compatibleTeams, setCompatibleTeams] = useState([]);
  const [availableOperatives, setAvailableOperatives] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ teamName: '' });
  const [config, setConfig] = useState({});

  useEffect(() => {
    fetch(`${apiUrl}/admin/config`).then(res => res.json()).then(setConfig);
    refreshData();
  }, [apiUrl, user.id, user.ps?.id]);

  const refreshData = async () => {
    // 1. Fetch latest user profile to get most current team status
    const profileRes = await fetch(`${apiUrl}/students/${user.id}`);
    const latestUser = await profileRes.json();
    
    // 2. Check if user has a team
    const teamRes = await fetch(`${apiUrl}/teams`);
    const teamData = await teamRes.json();
    const allTeams = Array.isArray(teamData) ? teamData : (teamData.teams || []);
    const foundTeam = allTeams.find(t => t.members.some(m => m.studentId === user.id));
    setMyTeam(foundTeam);

    const currentPsId = latestUser.psId || user.ps?.id || foundTeam?.psId;

    if (!foundTeam) {
      // Find compatible squads
      if (currentPsId) {
        const compRes = await fetch(`${apiUrl}/teams/compatible?psId=${currentPsId}`);
        const compData = await compRes.json();
        setCompatibleTeams(compData.teams || []);
      }
    } else {
      // If leader, check requests
      if (foundTeam.leaderId === user.id) {
        const reqRes = await fetch(`${apiUrl}/teams/${foundTeam.id}/requests`);
        const reqData = await reqRes.json();
        setRequests(reqData);

        // Fetch available operatives for recruits
        if (currentPsId) {
          const opsRes = await fetch(`${apiUrl}/students?status=VERIFIED&psId=${currentPsId}`);
          const opsData = await opsRes.json();
          // Filter out students who are already in a team
          const available = (opsData.participants || []).filter(o => 
            !allTeams.some(t => t.members.some(m => m.studentId === o.id))
          );
          setAvailableOperatives(available);
        }
      }
    }
  };

  const handleCreateTeam = async () => {
    if (config.lockdownActive) return alert('LOCKDOWN_ACTIVE: FORMATION_CLOSED');
    const res = await fetch(`${apiUrl}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName: form.teamName, psId: user.ps?.id, leaderId: user.id }),
    });
    if (res.ok) refreshData();
    else alert('FAILURE: TEAM_NAME_TAKEN');
  };

  const handleJoinRequest = async (teamId) => {
    await fetch(`${apiUrl}/teams/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, studentId: user.id }),
    });
    alert('JOIN_REQUEST_SENT');
  };

  const handleProcessRequest = async (requestId, action) => {
    await fetch(`${apiUrl}/teams/request`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action }),
    });
    refreshData();
  };

  return (
    <div className="team-page">
      <div className="page-header">
        <h1>TEAM_FORMATION</h1>
        <p>CHALLENGE: {user.ps?.title || 'AWAITING_CHALLENGE_SELECTION'}</p>
      </div>

      {config.lockdownActive && (
        <div className="error-message" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={20} />
          SYSTEM_LOCKDOWN: TEAM_FORMATION_IS_CURRENTLY_DISABLED
        </div>
      )}

      {!myTeam ? (
        <div className="team-content">
          <NeonBorderCard className="create-card">
            <div className="glass-card">
              <h3>CREATE_NEW_TEAM</h3>
              <div className="create-form">
                <input
                  placeholder="TEAM_NAME"
                  className="input-glass"
                  value={form.teamName}
                  onChange={e => setForm({ ...form, teamName: e.target.value })}
                />
                <button 
                  onClick={handleCreateTeam} 
                  className="glow-button"
                  disabled={config.lockdownActive}
                >
                  <UserPlus size={16} className="inline mr-2" /> CREATE_TEAM
                </button>
              </div>
            </div>
          </NeonBorderCard>

          <div className="compatible-section">
            <h3>AVAILABLE_TEAMS (SAME_CHALLENGE)</h3>
            <div className="available-list" style={{ marginTop: '20px' }}>
              {compatibleTeams.map(t => (
                <NeonBorderCard key={t.id} className="mb-4">
                  <div className="glass-card team-card">
                    <div className="team-header">
                      <h4>{t.teamName}</h4>
                      <span className="ps-name" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>LEADER: {t.leader.email}</span>
                    </div>
                    <div className="validation-details" style={{ margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Users size={12} /> MEMBERS: {t.members.length}/{config.maxTeamMembers || 5}
                      </span>
                      <span style={{ fontSize: '11px', color: t.requirements.pendingFemale ? 'var(--status-warn)' : 'var(--status-live)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {t.requirements.pendingFemale ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                        {t.requirements.pendingFemale ? 'FEMALE_MEMBER_REQUIRED' : 'FEMALE_REQUIREMENT_MET'}
                      </span>
                      <span style={{ fontSize: '11px', color: t.requirements.pendingDomainExperts > 0 ? 'var(--status-warn)' : 'var(--status-live)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {t.requirements.pendingDomainExperts > 0 ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                        {t.requirements.pendingDomainExperts > 0 
                          ? `${t.requirements.pendingDomainExperts} DOMAIN_EXPERTS_REQUIRED` 
                          : 'DOMAIN_REQUIREMENT_MET'}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleJoinRequest(t.id)} 
                      className="glow-button mini-btn"
                      disabled={config.lockdownActive}
                      style={{ width: '100%', fontSize: '10px', padding: '8px' }}
                    >
                      REQUEST_TO_JOIN
                    </button>
                  </div>
                </NeonBorderCard>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="team-content">
          <NeonBorderCard className="team-info-card">
            <div className="glass-card">
              <div className="team-header">
                <h2>{myTeam.teamName}</h2>
                <span className="status-badge verified">{myTeam.teamStatus}</span>
              </div>
              <p className="ps-name">CHALLENGE: {myTeam.problemStatement.title}</p>
              <div className="members-list" style={{ marginTop: '20px' }}>
                {myTeam.members.map(m => (
                  <div key={m.studentId} className="member-item" style={{ borderBottom: '1px solid #1a1a1a', padding: '10px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <div>
                        <span style={{ fontWeight: 'bold' }}>{m.student.fullName}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginLeft: '10px' }}>({m.student.gender})</span>
                        <div style={{ fontSize: '12px', color: 'var(--status-live)', fontFamily: 'monospace', marginTop: '4px' }}>
                          PHN: {m.student.phone || 'HIDDEN'}
                        </div>
                      </div>
                      <span className="member-role" style={{ fontSize: '10px', background: '#111', padding: '2px 8px', borderRadius: '10px', height: 'fit-content' }}>
                        {m.role.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </NeonBorderCard>

          {myTeam.leaderId === user.id && (
            <div className="management-sections" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px' }}>
              <div className="requests-section">
                <h3>PENDING_JOIN_REQUESTS</h3>
                {requests.length === 0 ? (
                  <div className="glass-card empty-state" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    NO_PENDING_REQUESTS
                  </div>
                ) : (
                  requests.map(r => (
                    <NeonBorderCard key={r.id} className="mb-4">
                      <div className="glass-card">
                        <div className="request-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong>{r.student.fullName}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{r.student.email}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--status-live)', fontFamily: 'monospace', margin: '5px 0' }}>
                          PHN: {r.student.phone || 'HIDDEN'}
                        </div>
                        <p style={{ fontSize: '12px', margin: '10px 0', color: 'var(--text-secondary)' }}>
                          {r.student.summary}
                        </p>
                        <div className="action-buttons" style={{ display: 'flex', gap: '10px' }}>
                          <button className="btn-verify" style={{ flex: 1 }} onClick={() => handleProcessRequest(r.id, 'ACCEPTED')}>ACCEPT</button>
                          <button className="btn-reject" style={{ flex: 1 }} onClick={() => handleProcessRequest(r.id, 'REJECTED')}>DENY</button>
                        </div>
                      </div>
                    </NeonBorderCard>
                  ))
                )}
              </div>

              <div className="available-operatives-section">
                <h3>AVAILABLE_PARTICIPANTS</h3>
                {availableOperatives.length === 0 ? (
                  <div className="glass-card empty-state" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    NO_AVAILABLE_PARTICIPANTS_FOUND
                  </div>
                ) : (
                  availableOperatives.map(o => (
                    <NeonBorderCard key={o.id} className="mb-4">
                      <div className="glass-card operative-card">
                        <div className="op-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong>{o.fullName}</strong>
                          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{o.domain?.name}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--status-live)', fontFamily: 'monospace', margin: '5px 0' }}>
                          PHN: {o.phone || 'HIDDEN'}
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                          {o.summary?.substring(0, 100)}...
                        </p>
                        <div className="op-footer" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                          INSTITUTION: {o.institute?.name}
                        </div>
                      </div>
                    </NeonBorderCard>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TeamFormation;
