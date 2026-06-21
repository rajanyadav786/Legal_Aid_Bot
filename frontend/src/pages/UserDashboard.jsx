import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Icons } from '../components/Icons';
import './UserDashboard.css';

export default function UserDashboard({ onBack }) {
  const { authFetch } = useAuth();
  const [tab, setTab] = useState('bookmarks');
  const [bookmarks, setBookmarks] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showBMModal, setShowBMModal] = useState(false);
  const [showProcModal, setShowProcModal] = useState(false);
  const [bmForm, setBmForm] = useState({ title: '', description: '', link: '' });
  const [procForm, setProcForm] = useState({ title: '', status: 'in_progress', steps: [] });
  const [newStep, setNewStep] = useState('');

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'bookmarks') {
        const res = await authFetch('/api/dashboard/bookmarks');
        if (res.ok) setBookmarks(await res.json());
      } else {
        const res = await authFetch('/api/dashboard/procedures');
        if (res.ok) setProcedures(await res.json());
      }
    } catch (e) {
      setError('Failed to load data');
    }
    setLoading(false);
  };

  const handleAddBookmark = async (e) => {
    e.preventDefault();
    try {
      await authFetch('/api/dashboard/bookmarks', {
        method: 'POST',
        body: JSON.stringify(bmForm),
      });
      setShowBMModal(false);
      setBmForm({ title: '', description: '', link: '' });
      loadData();
    } catch (err) {}
  };

  const handleDeleteBookmark = async (id) => {
    if (!window.confirm('Delete this bookmark?')) return;
    await authFetch(`/api/dashboard/bookmarks/${id}`, { method: 'DELETE' });
    loadData();
  };

  const handleAddProcedure = async (e) => {
    e.preventDefault();
    try {
      await authFetch('/api/dashboard/procedures', {
        method: 'POST',
        body: JSON.stringify(procForm),
      });
      setShowProcModal(false);
      setProcForm({ title: '', status: 'in_progress', steps: [] });
      loadData();
    } catch (err) {}
  };

  const handleAddStep = () => {
    if (!newStep.trim()) return;
    setProcForm({ ...procForm, steps: [...procForm.steps, { title: newStep.trim(), completed: false }] });
    setNewStep('');
  };

  const handleDeleteProcedure = async (id) => {
    if (!window.confirm('Delete this procedure?')) return;
    await authFetch(`/api/dashboard/procedures/${id}`, { method: 'DELETE' });
    loadData();
  };

  const toggleStep = async (procId, stepIdx) => {
    const proc = procedures.find((p) => p.id === procId);
    if (!proc) return;
    const newSteps = [...proc.steps];
    newSteps[stepIdx].completed = !newSteps[stepIdx].completed;
    
    // Check if all steps completed
    const allDone = newSteps.length > 0 && newSteps.every(s => s.completed);
    const newStatus = allDone ? 'completed' : 'in_progress';

    setProcedures(procedures.map(p => p.id === procId ? { ...p, steps: newSteps, status: newStatus } : p));

    await authFetch(`/api/dashboard/procedures/${procId}`, {
      method: 'PUT',
      body: JSON.stringify({ steps: newSteps, status: newStatus }),
    });
  };

  return (
    <div className="dashboard-root">
      <header className="dashboard-header">
        <div className="dashboard-header__left">
          <button className="dashboard-back" onClick={onBack}>
            <Icons.chevronDown style={{ transform: 'rotate(90deg)', width: 20 }} /> Back to Chat
          </button>
          <h2>My Dashboard</h2>
        </div>
        <div className="dashboard-tabs">
          <button className={`dashboard-tab ${tab === 'bookmarks' ? 'active' : ''}`} onClick={() => setTab('bookmarks')}>
            <Icons.receipt style={{ width: 16 }} /> Bookmarks
          </button>
          <button className={`dashboard-tab ${tab === 'procedures' ? 'active' : ''}`} onClick={() => setTab('procedures')}>
            <Icons.briefcase style={{ width: 16 }} /> Procedures
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {loading ? (
          <div className="dashboard-loading">Loading...</div>
        ) : error ? (
          <div className="dashboard-error">{error}</div>
        ) : (
          <>
            {/* Bookmarks Tab */}
            {tab === 'bookmarks' && (
              <div className="dashboard-section">
                <div className="dashboard-section-header">
                  <h3>Saved Laws & Bookmarks</h3>
                  <button className="dashboard-btn-primary" onClick={() => setShowBMModal(true)}>+ Add Bookmark</button>
                </div>
                {bookmarks.length === 0 ? (
                  <p className="dashboard-empty">No bookmarks saved yet.</p>
                ) : (
                  <div className="bm-grid">
                    {bookmarks.map((bm) => (
                      <div key={bm.id} className="bm-card">
                        <div className="bm-card-header">
                          <h4>{bm.title}</h4>
                          <button className="bm-del-btn" onClick={() => handleDeleteBookmark(bm.id)}>
                            <Icons.close style={{ width: 14 }} />
                          </button>
                        </div>
                        <p>{bm.description}</p>
                        {bm.link && <a href={bm.link} target="_blank" rel="noreferrer" className="bm-link">Read more ↗</a>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Procedures Tab */}
            {tab === 'procedures' && (
              <div className="dashboard-section">
                <div className="dashboard-section-header">
                  <h3>Legal Procedure Tracking</h3>
                  <button className="dashboard-btn-primary" onClick={() => setShowProcModal(true)}>+ New Procedure</button>
                </div>
                {procedures.length === 0 ? (
                  <p className="dashboard-empty">No procedures tracked yet.</p>
                ) : (
                  <div className="proc-list">
                    {procedures.map((proc) => {
                      const completedCount = proc.steps.filter(s => s.completed).length;
                      const progress = proc.steps.length === 0 ? 0 : Math.round((completedCount / proc.steps.length) * 100);
                      return (
                        <div key={proc.id} className={`proc-card ${proc.status === 'completed' ? 'proc-card--done' : ''}`}>
                          <div className="proc-card-header">
                            <div>
                              <h4>{proc.title}</h4>
                              <span className={`proc-badge ${proc.status}`}>{proc.status.replace('_', ' ')}</span>
                            </div>
                            <button className="bm-del-btn" onClick={() => handleDeleteProcedure(proc.id)}>
                              <Icons.close style={{ width: 14 }} />
                            </button>
                          </div>
                          
                          <div className="proc-progress">
                            <div className="proc-progress-bar" style={{ width: `${progress}%` }} />
                          </div>
                          <p className="proc-progress-text">{progress}% Completed</p>

                          <div className="proc-steps">
                            {proc.steps.map((step, idx) => (
                              <label key={idx} className={`proc-step ${step.completed ? 'completed' : ''}`}>
                                <input type="checkbox" checked={step.completed} onChange={() => toggleStep(proc.id, idx)} />
                                <span>{step.title}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Bookmark Modal */}
      {showBMModal && (
        <div className="dash-modal-overlay">
          <div className="dash-modal">
            <h3>Add Bookmark</h3>
            <form onSubmit={handleAddBookmark}>
              <div className="dash-field">
                <label>Title</label>
                <input required value={bmForm.title} onChange={e => setBmForm({...bmForm, title: e.target.value})} placeholder="e.g. Right to Information Act" />
              </div>
              <div className="dash-field">
                <label>Description</label>
                <textarea rows="3" value={bmForm.description} onChange={e => setBmForm({...bmForm, description: e.target.value})} placeholder="Brief summary..." />
              </div>
              <div className="dash-field">
                <label>Link (optional)</label>
                <input type="url" value={bmForm.link} onChange={e => setBmForm({...bmForm, link: e.target.value})} placeholder="https://..." />
              </div>
              <div className="dash-modal-actions">
                <button type="button" onClick={() => setShowBMModal(false)}>Cancel</button>
                <button type="submit" className="dashboard-btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Procedure Modal */}
      {showProcModal && (
        <div className="dash-modal-overlay">
          <div className="dash-modal">
            <h3>New Procedure</h3>
            <form onSubmit={handleAddProcedure}>
              <div className="dash-field">
                <label>Procedure Title</label>
                <input required value={procForm.title} onChange={e => setProcForm({...procForm, title: e.target.value})} placeholder="e.g. Filing a Police Complaint (FIR)" />
              </div>
              <div className="dash-field">
                <label>Steps</label>
                <div className="dash-step-input">
                  <input value={newStep} onChange={e => setNewStep(e.target.value)} placeholder="Add a step..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddStep(); } }} />
                  <button type="button" onClick={handleAddStep}>Add</button>
                </div>
                <ul className="dash-step-preview">
                  {procForm.steps.map((s, i) => <li key={i}>• {s.title}</li>)}
                </ul>
              </div>
              <div className="dash-modal-actions">
                <button type="button" onClick={() => setShowProcModal(false)}>Cancel</button>
                <button type="submit" className="dashboard-btn-primary" disabled={procForm.title.trim() === ''}>Create Tracker</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
