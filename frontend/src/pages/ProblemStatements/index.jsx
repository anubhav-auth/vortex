import { useState, useEffect } from 'react';
import './styles.css';

function ProblemStatements({ apiUrl }) {
  const [psList, setPsList] = useState([]);
  const [domains, setDomains] = useState([]);
  const [form, setForm] = useState({ title: '', domainId: '', minDomainMembers: 2 });

  useEffect(() => {
    loadPs();
    fetch(`${apiUrl}/domains`)
      .then(res => res.json())
      .then(setDomains)
      .catch(console.error);
  }, [apiUrl]);

  const loadPs = () => {
    fetch(`${apiUrl}/problem-statements`)
      .then(res => res.json())
      .then(data => setPsList(data.problemStatements || []))
      .catch(console.error);
  };

  const handleCreate = async () => {
    await fetch(`${apiUrl}/admin/problem-statements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    loadPs();
    setForm({ title: '', domainId: '', minDomainMembers: 2 });
  };

  const handleDelete = async (id) => {
    await fetch(`${apiUrl}/admin/problem-statements/${id}`, {
      method: 'DELETE',
    });
    loadPs();
  };

  return (
    <div className="ps-page">
      <div className="page-header">
        <h1>Problem <span className="gradient-text">Statements</span></h1>
        <p>Manage hackathon challenges</p>
      </div>

      <div className="glass-card create-card">
        <h3>Create New Problem Statement</h3>
        <div className="create-form">
          <input
            type="text"
            placeholder="Problem Title"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="input-glass"
          />
          <select
            value={form.domainId}
            onChange={e => setForm({ ...form, domainId: e.target.value })}
            className="select-glass"
          >
            <option value="">Select Domain</option>
            {domains.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            placeholder="Min Members"
            value={form.minDomainMembers}
            onChange={e => setForm({ ...form, minDomainMembers: parseInt(e.target.value) })}
            className="input-glass"
          />
          <button onClick={handleCreate} className="glow-button">
            Create
          </button>
        </div>
      </div>

      <div className="ps-list">
        {psList.map(ps => (
          <div key={ps.id} className="glass-card ps-item">
            <div className="ps-info">
              <h4>{ps.title}</h4>
              <p>{ps.domain?.name} · Min {ps.minDomainMembers} members</p>
            </div>
            <button onClick={() => handleDelete(ps.id)} className="btn-delete">
              Delete
            </button>
          </div>
        ))}
        {psList.length === 0 && (
          <div className="glass-card empty-card">
            <p>No problem statements yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProblemStatements;