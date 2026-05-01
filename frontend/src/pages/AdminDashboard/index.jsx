import { useState, useEffect } from 'react';
import { NeonBorderCard } from '../../components/ui/NeonBorderCard';
import { ScrambleText } from '../../components/ui/ScrambleText';
import ProblemStatements from '../ProblemStatements';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  Building2, 
  Radio, 
  LogOut, 
  Check, 
  X, 
  AlertTriangle, 
  Settings,
  RefreshCw,
  Send,
  Wind
} from 'lucide-react';
import './styles.css';

function AdminDashboard({ apiUrl, user, onLogout }) {
  const [activeModule, setActiveModule] = useState('overview');
  const [operatives, setOperatives] = useState([]);
  const [teams, setTeams] = useState([]);
  const [config, setConfig] = useState({});
  const [report, setReport] = useState(null);
  const [broadcast, setBroadcast] = useState({ subject: '', text: '', target: 'ALL' });
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedOperative, setSelectedOperative] = useState(null);
  
  // Management States
  const [institutes, setInstitutes] = useState([]);
  const [domains, setDomains] = useState([]);
  const [newInst, setNewInst] = useState('');
  const [newDom, setNewDom] = useState({ name: '', minMembers: 2 });

  useEffect(() => {
    refreshData();
  }, [apiUrl]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [opRes, teamRes, configRes, reportRes, instRes, domRes] = await Promise.all([
        fetch(`${apiUrl}/admin/students`),
        fetch(`${apiUrl}/teams`),
        fetch(`${apiUrl}/admin/config`),
        fetch(`${apiUrl}/admin/report`),
        fetch(`${apiUrl}/institutes`),
        fetch(`${apiUrl}/domains`)
      ]);

      const opData = await opRes.json();
      const teamData = await teamRes.json();
      const configData = await configRes.json();
      const reportData = await reportRes.json();

      setOperatives(opData.operatives || []);
      setTeams(Array.isArray(teamData) ? teamData : []);
      setConfig(configData);
      setReport(reportData);
      setInstitutes(await instRes.json());
      setDomains(await domRes.json());
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    }
    setLoading(false);
  };

  const handleVerify = async (id, status) => {
    await fetch(`${apiUrl}/admin/students/${id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setSelectedOperative(null);
    refreshData();
  };

  const handleUpdateConfig = async (newConfig) => {
    await fetch(`${apiUrl}/admin/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    });
    refreshData();
  };

  const handleReevaluate = async () => {
    const res = await fetch(`${apiUrl}/admin/reevaluate-teams`, {
      method: 'POST'
    });
    const data = await res.json();
    alert(data.message);
    refreshData();
  };

  const handleBroadcast = async () => {
    await fetch(`${apiUrl}/admin/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(broadcast),
    });
    alert('BROADCAST_SENT');
    setBroadcast({ subject: '', text: '', target: 'ALL' });
  };

  const addInstitute = async () => {
    if (!newInst) return;
    await fetch(`${apiUrl}/institutes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newInst }),
    });
    setNewInst('');
    refreshData();
  };

  const addDomain = async () => {
    if (!newDom.name) return;
    await fetch(`${apiUrl}/domains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newDom.name }),
    });
    setNewDom({ name: '', minMembers: 2 });
    refreshData();
  };

  const deleteEntity = async (type, id) => {
    await fetch(`${apiUrl}/${type}/${id}`, { method: 'DELETE' });
    refreshData();
  };

  if (loading) return <div className="admin-layout"><p>Loading Admin Dashboard...</p></div>;

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'operatives', label: 'Participants', icon: <Users size={18} /> },
    { id: 'squads', label: 'Teams', icon: <ShieldCheck size={18} /> },
    { id: 'infrastructure', label: 'Resources', icon: <Building2 size={18} /> },
    { id: 'broadcast', label: 'Broadcast', icon: <Radio size={18} /> },
  ];

  const getMissingRequirements = (team) => {
    const missing = [];
    if (team.femaleCount < (config.minFemaleMembers || 1)) missing.push('Female Member');
    const minMembers = config.minTeamMembers || 2;
    if (team.memberCount < minMembers) {
      missing.push(`${minMembers - team.memberCount} more members`);
    }
    const minDomain = config.minDomainExperts || 1;
    if (team.domainSpecificCount < minDomain) {
      missing.push(`${minDomain - team.domainSpecificCount} domain experts`);
    }
    return missing;
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <Wind size={20} color="var(--accent-cyan)" />
          <span>ADMIN_PANEL</span>
        </div>
        <nav className="sidebar-nav">
          {sidebarItems.map(item => (
            <button 
              key={item.id} 
              className={`nav-item ${activeModule === item.id ? 'active' : ''}`}
              onClick={() => setActiveModule(item.id)}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </button>
          ))}
          <button className="nav-item logout-nav" onClick={onLogout}>
            <span className="icon"><LogOut size={18} /></span>
            <span className="label">LOGOUT</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="status-indicator verified">CONNECTED</div>
          <p style={{fontSize: '8px', color: 'var(--text-dim)', marginTop: '5px'}}>SECURE_ADMIN_SESSION</p>
        </div>
      </aside>

      <main className="admin-main">
        <header className="module-header">
          <h2><ScrambleText text={sidebarItems.find(i => i.id === activeModule).label} /></h2>
          <div className="lockdown-status">
            LOCKDOWN: <span className={config.lockdownActive ? 'text-crit' : 'text-live'}>{config.lockdownActive ? 'ACTIVE' : 'INACTIVE'}</span>
          </div>
        </header>

        <div className="module-content">
          {activeModule === 'overview' && (
            <div className="overview-module">
              <div className="stats-grid">
                <NeonBorderCard><div className="glass-card stat-box"><h4>QUALIFIED_TEAMS</h4><span className="value text-live">{report?.squads?.qualified?.length || 0}</span></div></NeonBorderCard>
                <NeonBorderCard><div className="glass-card stat-box"><h4>UNQUALIFIED_TEAMS</h4><span className="value text-warn">{report?.squads?.unqualified?.length || 0}</span></div></NeonBorderCard>
                <NeonBorderCard><div className="glass-card stat-box"><h4>INDIVIDUAL_PARTICIPANTS</h4><span className="value text-crit">{report?.operatives?.unassigned || 0}</span></div></NeonBorderCard>
              </div>

              <div className="quick-config glass-card" style={{ marginTop: '24px' }}>
                <h3>HACKATHON_RULES</h3>
                <div className="config-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                  <div className="config-group">
                    <label style={{fontSize: '10px', color: 'var(--text-dim)'}}>MIN_TEAM_SIZE</label>
                    <input type="number" className="input-glass" value={config.minTeamMembers} onChange={e => setConfig({...config, minTeamMembers: parseInt(e.target.value)})} />
                  </div>
                  <div className="config-group">
                    <label style={{fontSize: '10px', color: 'var(--text-dim)'}}>MAX_TEAM_SIZE</label>
                    <input type="number" className="input-glass" value={config.maxTeamMembers} onChange={e => setConfig({...config, maxTeamMembers: parseInt(e.target.value)})} />
                  </div>
                  <div className="config-group">
                    <label style={{fontSize: '10px', color: 'var(--text-dim)'}}>MIN_FEMALE</label>
                    <input type="number" className="input-glass" value={config.minFemaleMembers} onChange={e => setConfig({...config, minFemaleMembers: parseInt(e.target.value)})} />
                  </div>
                  <div className="config-group">
                    <label style={{fontSize: '10px', color: 'var(--text-dim)'}}>MIN_DOMAIN_EXPERTS</label>
                    <input type="number" className="input-glass" value={config.minDomainExperts} onChange={e => setConfig({...config, minDomainExperts: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div className="config-toggles">
                   <button onClick={() => handleUpdateConfig(config)} className="glow-button"><Settings size={14} className="inline mr-2" /> SAVE_RULES</button>
                   <button onClick={handleReevaluate} className="glow-button" style={{borderColor: 'var(--status-warn)', color: 'var(--status-warn)'}}><RefreshCw size={14} className="inline mr-2" /> REEVALUATE_ALL_TEAMS</button>
                   <button onClick={() => handleUpdateConfig({ ...config, lockdownActive: !config.lockdownActive })} className={`glow-button ${config.lockdownActive ? 'btn-active-crit' : ''}`}>
                    {config.lockdownActive ? 'STOP_LOCKDOWN' : 'LOCKDOWN_REGISTRATIONS'}
                   </button>
                   <button onClick={() => handleUpdateConfig({ ...config, leaderboardVisible: !config.leaderboardVisible })} className="glow-button">
                    {config.leaderboardVisible ? 'HIDE_LEADERBOARD' : 'SHOW_LEADERBOARD'}
                   </button>
                   <button onClick={refreshData} className="glow-button mini-btn"><RefreshCw size={14} /></button>
                </div>
              </div>

              {config.lockdownActive && (
                <div className="lockdown-intelligence" style={{ marginTop: '32px' }}>
                  <h3 className="text-crit">LOCKDOWN_SUMMARY</h3>
                  <div className="lockdown-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
                    <div className="glass-card intelligence-card">
                      <h4>UNASSIGNED_PARTICIPANTS</h4>
                      <div className="scroll-table" style={{ maxHeight: '200px' }}>
                        {report?.operatives?.unassignedList?.map(o => (
                          <div key={o.id} className="intel-row">
                            <span>{o.fullName}</span>
                            <span className="text-dim">{o.domain?.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="glass-card intelligence-card">
                      <h4>UNQUALIFIED_TEAMS</h4>
                      <div className="scroll-table" style={{ maxHeight: '200px' }}>
                        {report?.squads?.unqualified?.map(s => (
                          <div key={s.id} className="intel-row">
                            <span>{s.name}</span>
                            <span className="text-crit" style={{fontSize: '9px'}}>{s.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeModule === 'operatives' && (
            <div className="operatives-module">
              <div className="glass-card table-container">
                <div className="scroll-table full-height">
                  <table>
                    <thead>
                      <tr><th>NAME</th><th>ROLL</th><th>INSTITUTION</th><th>DOMAIN</th><th>STATUS</th><th>ACTION</th></tr>
                    </thead>
                    <tbody>
                      {operatives.map(o => (
                        <tr key={o.id} onClick={() => setSelectedOperative(o)} style={{ cursor: 'pointer' }}>
                          <td>{o.fullName}</td>
                          <td>{o.rollNumber}</td>
                          <td>{o.institute?.name}</td>
                          <td>{o.domain?.name}</td>
                          <td className={o.verificationStatus === 'VERIFIED' ? 'text-live' : 'text-warn'}>{o.verificationStatus}</td>
                          <td>
                            {o.verificationStatus === 'PENDING' ? (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn-verify action-btn-verify" title="APPROVE" onClick={(e) => { e.stopPropagation(); handleVerify(o.id, 'VERIFIED'); }}><Check size={14} /></button>
                                <button className="btn-verify action-btn-reject" title="REJECT" onClick={(e) => { e.stopPropagation(); handleVerify(o.id, 'REJECTED'); }}><X size={14} /></button>
                              </div>
                            ) : (
                              <span className={o.verificationStatus === 'VERIFIED' ? 'text-live' : 'text-crit'} style={{fontSize: '10px'}}>{o.verificationStatus}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'squads' && (
            <div className="squads-module">
              <div className="glass-card table-container">
                <div className="scroll-table full-height">
                  <table>
                    <thead>
                      <tr><th>TEAM_NAME</th><th>LEADER</th><th>CONTACT</th><th>STRENGTH</th><th>STATUS</th><th>PENDING_REQUIREMENTS</th></tr>
                    </thead>
                    <tbody>
                      {teams.map(t => {
                        const missing = getMissingRequirements(t);
                        return (
                          <tr key={t.id} onClick={() => setSelectedTeam(t)} style={{ cursor: 'pointer' }}>
                            <td className="name-cell">{t.teamName}</td>
                            <td>{t.leader?.fullName}</td>
                            <td className="text-live" style={{fontSize: '11px', fontFamily: 'monospace'}}>{t.leader?.phone || 'NO_CONTACT'}</td>
                            <td>{t.memberCount}/{config.maxTeamMembers || 5}</td>
                            <td><span className={`status-badge ${t.teamStatus?.toLowerCase()}`}>{t.teamStatus}</span></td>
                            <td className="text-warn" style={{ fontSize: '10px' }}>
                              {missing.length > 0 ? missing.join(' | ') : <span className="text-live">✓_QUALIFIED</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'infrastructure' && (
            <div className="infra-module">
              <div className="infra-grid">
                <NeonBorderCard>
                  <div className="glass-card">
                    <h3>INSTITUTIONS</h3>
                    <div className="entity-manager">
                      <div className="add-box">
                        <input placeholder="NEW_INSTITUTION" className="input-glass" value={newInst} onChange={e => setNewInst(e.target.value)} />
                        <button onClick={addInstitute} className="glow-button">ADD</button>
                      </div>
                      <div className="entity-list scroll-table" style={{ maxHeight: '300px', marginTop: '15px' }}>
                        {institutes.map(i => (
                          <div key={i.id} className="intel-row">
                            <span>{i.name}</span>
                            <button onClick={() => deleteEntity('institutes', i.id)} className="btn-del"><X size={12} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </NeonBorderCard>
                <NeonBorderCard>
                  <div className="glass-card">
                    <h3>TECH_DOMAINS</h3>
                    <div className="entity-manager">
                      <div className="add-box flex-col">
                        <input placeholder="NEW_DOMAIN" className="input-glass" value={newDom.name} onChange={e => setNewDom({...newDom, name: e.target.value})} />
                        <button onClick={addDomain} className="glow-button" style={{width: '100%', marginTop: '10px'}}>ADD_DOMAIN</button>
                      </div>
                      <div className="entity-list scroll-table" style={{ maxHeight: '300px', marginTop: '15px' }}>
                        {domains.map(d => (
                          <div key={d.id} className="intel-row">
                            <span>{d.name}</span>
                            <button onClick={() => deleteEntity('domains', d.id)} className="btn-del"><X size={12} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </NeonBorderCard>
              </div>
              <div style={{ marginTop: '24px' }}>
                <ProblemStatements apiUrl={apiUrl} user={{ role: 'ADMIN' }} />
              </div>
            </div>
          )}

          {activeModule === 'broadcast' && (
            <div className="broadcast-module" style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
              <NeonBorderCard style={{ flex: 1 }}>
                <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <h3>EVENT_BROADCAST</h3>
                  <div className="broadcast-form" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                    <input placeholder="SUBJECT" className="input-glass" style={{ fontSize: '1.2rem', padding: '15px' }} value={broadcast.subject} onChange={e => setBroadcast({ ...broadcast, subject: e.target.value })} />
                    <textarea placeholder="MESSAGE_CONTENT" className="input-glass" style={{ flex: 1, minHeight: '300px', fontSize: '1.1rem', padding: '20px' }} value={broadcast.text} onChange={e => setBroadcast({ ...broadcast, text: e.target.value })} />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <select className="select-glass" style={{ width: '250px' }} value={broadcast.target} onChange={e => setBroadcast({ ...broadcast, target: e.target.value })}>
                        <option value="ALL">ALL_PARTICIPANTS</option>
                        <option value="LEADS">TEAM_LEADERS_ONLY</option>
                      </select>
                      <button onClick={handleBroadcast} className="glow-button" style={{flex: 1, height: '50px', fontSize: '1.1rem'}}><Send size={18} className="inline mr-2" /> SEND_BROADCAST</button>
                    </div>
                  </div>
                </div>
              </NeonBorderCard>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {selectedTeam && (
        <div className="modal-overlay" onClick={() => setSelectedTeam(null)}>
          <div className="glass-card ps-modal team-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedTeam(null)}><X /></button>
            <div className="modal-header">
              <h2>TEAM_DETAILS: {selectedTeam.teamName}</h2>
              <span className="badge">{selectedTeam.problemStatement?.title}</span>
            </div>
            <div className="modal-body">
              <div className="members-detail-grid">
                {selectedTeam.members.map(m => (
                  <div key={m.studentId} className="member-detail-card clickable" onClick={() => setSelectedOperative(m.student)}>
                    <div className="member-photo">
                      {m.student.photo ? <img src={m.student.photo} alt={m.student.fullName} /> : <div className="no-photo">NO_IMAGE</div>}
                    </div>
                    <div className="member-meta">
                      <p className="name">{m.student.fullName}</p>
                      <p className="role">{m.role.toUpperCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOperative && (
        <div className="modal-overlay" onClick={() => setSelectedOperative(null)} style={{ zIndex: 2000 }}>
          <div className="glass-card ps-modal operative-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedOperative(null)}><X /></button>
            <div className="modal-header">
              <h2>PARTICIPANT_PROFILE: {selectedOperative.fullName}</h2>
              <span className={`status-badge ${selectedOperative.verificationStatus?.toLowerCase()}`}>{selectedOperative.verificationStatus}</span>
            </div>
            <div className="modal-body">
              <div className="dossier-layout">
                <div className="dossier-photo">
                  {selectedOperative.photo ? <img src={selectedOperative.photo} alt={selectedOperative.fullName} /> : <div className="no-photo">NO_IMAGE</div>}
                </div>
                <div className="dossier-intel">
                  <div className="intel-item"><span className="label">ROLL_NUMBER</span><span className="val">{selectedOperative.rollNumber || 'N/A'}</span></div>
                  <div className="intel-item"><span className="label">EMAIL</span><span className="val">{selectedOperative.email}</span></div>
                  <div className="intel-item"><span className="label">PHONE</span><span className="val text-live">{selectedOperative.phone || 'N/A'}</span></div>
                  <div className="intel-item"><span className="label">INSTITUTION</span><span className="val">{selectedOperative.institute?.name || 'N/A'}</span></div>
                  <div className="intel-item"><span className="label">DOMAIN</span><span className="val">{selectedOperative.domain?.name || 'N/A'}</span></div>
                  <div className="intel-item"><span className="label">CHALLENGE</span><span className="val">{selectedOperative.problemStatement?.title || 'UNASSIGNED'}</span></div>
                </div>
              </div>
              <div className="dossier-summary">
                <span className="label">SUMMARY</span>
                <p>{selectedOperative.summary || 'No summary provided.'}</p>
              </div>
            </div>
            <div className="modal-footer">
              {selectedOperative.verificationStatus === 'PENDING' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="glow-button" style={{color: 'var(--status-live)'}} onClick={() => handleVerify(selectedOperative.id, 'VERIFIED')}><Check size={16} className="inline mr-1" /> APPROVE</button>
                  <button className="glow-button" style={{color: 'var(--status-crit)'}} onClick={() => handleVerify(selectedOperative.id, 'REJECTED')}><X size={16} className="inline mr-1" /> REJECT</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

