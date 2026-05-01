import { useState, useEffect } from 'react';
import { ScrambleText } from '../../components/ui/ScrambleText';
import { X, Plus, Trash2, ExternalLink } from 'lucide-react';
import './styles.css';

function ProblemStatements({ apiUrl, user }) {
  const [psList, setPsList] = useState([]);
  const [domains, setDomains] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', domainId: '' });
  const [selectedPs, setSelectedPs] = useState(null);
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    loadPs();
    if (isAdmin) {
      fetch(`${apiUrl}/domains`)
        .then(res => res.json())
        .then(setDomains)
        .catch(console.error);
    }
  }, [apiUrl, isAdmin]);

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
    setForm({ title: '', description: '', domainId: '' });
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
        <p>{isAdmin ? 'Manage hackathon challenges' : 'Available hackathon challenges'}</p>
      </div>

      {isAdmin && (
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
            <textarea
              placeholder="Detailed Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="input-glass"
              style={{ minHeight: '100px' }}
            />
            <select
              value={form.domainId}
              onChange={e => setForm({ ...form, domainId: e.target.value })}
              className="select-glass"
              style={{ width: '100%', marginBottom: '15px' }}
            >
              <option value="">Select Domain</option>
              {domains.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button onClick={handleCreate} className="glow-button">
              <Plus size={16} className="inline mr-2" /> Create
            </button>
          </div>
        </div>
      )}

      <div className="ps-list">
        {psList.map(ps => (
          <div key={ps.id} className="glass-card ps-item" onClick={() => setSelectedPs(ps)}>
            <div className="ps-info">
              <h4>{ps.title}</h4>
              <p>{ps.domain?.name}</p>
            </div>
            <div className="ps-actions">
              <button className="btn-view"><ExternalLink size={14} className="inline mr-1" /> View Details</button>
              {isAdmin && (
                <button onClick={(e) => { e.stopPropagation(); handleDelete(ps.id); }} className="btn-delete">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
        {psList.length === 0 && (
          <div className="glass-card empty-card">
            <p>No problem statements yet</p>
          </div>
        )}
      </div>

      {selectedPs && (
        <div className="modal-overlay" onClick={() => setSelectedPs(null)}>
          <div className="glass-card ps-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedPs(null)}><X /></button>
            <div className="modal-header">
              <h2><ScrambleText text={selectedPs.title} /></h2>
              <span className="badge">{selectedPs.domain?.name}</span>
            </div>
            <div className="modal-body">
              <p className="description">{selectedPs.description || 'No description provided for this challenge.'}</p>
              <div className="requirements">
                <p><strong>Released On:</strong> {new Date(selectedPs.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="glow-button" onClick={() => setSelectedPs(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProblemStatements;
