import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminPage.css';

const ICON_OPTIONS = ['scales', 'briefcase', 'home', 'family', 'shield', 'receipt', 'heart', 'globe', 'star'];

// ── Utility ──────────────────────────────────────────────────────────────────
function useAdminData(authFetch, path) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(path);
      if (!res.ok) throw new Error('Failed to load');
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, path]);

  useEffect(() => { load(); }, [load]);
  return { data, setData, loading, error, reload: load };
}

// ── Category Modal ────────────────────────────────────────────────────────────
function CategoryModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial || {
      id: '', label: '', shortLabel: '', icon: 'scales',
      color: '#e8922f', description: '', systemContext: '',
      quickPrompts: ['', '', ''], order: 999,
    }
  );
  const isEdit = !!initial;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setQP = (i, v) => {
    const arr = [...form.quickPrompts];
    arr[i] = v;
    set('quickPrompts', arr);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      quickPrompts: form.quickPrompts.filter((p) => p.trim()),
      order: Number(form.order),
    });
  };

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <h3>{isEdit ? 'Edit Category' : 'Add New Category'}</h3>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-row">
            <div className="admin-field">
              <label>Category ID *</label>
              <input
                required
                placeholder="e.g. tax_law"
                value={form.id}
                onChange={(e) => set('id', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                disabled={isEdit}
              />
            </div>
            <div className="admin-field">
              <label>Order (sort)</label>
              <input type="number" value={form.order} onChange={(e) => set('order', e.target.value)} min={1} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-field">
              <label>Full Label *</label>
              <input required placeholder="Tax & Finance" value={form.label} onChange={(e) => set('label', e.target.value)} />
            </div>
            <div className="admin-field">
              <label>Short Label *</label>
              <input required placeholder="Tax" value={form.shortLabel} onChange={(e) => set('shortLabel', e.target.value)} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-field">
              <label>Icon</label>
              <select value={form.icon} onChange={(e) => set('icon', e.target.value)}>
                {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <div className="admin-field">
              <label>Color (hex)</label>
              <input type="color" value={form.color} onChange={(e) => set('color', e.target.value)} />
            </div>
          </div>
          <div className="admin-field">
            <label>Description *</label>
            <input required placeholder="Brief one-line description" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="admin-field">
            <label>System Context (AI prompt supplement)</label>
            <textarea
              rows={4}
              placeholder="Focus on the relevant laws and acts for this category..."
              value={form.systemContext}
              onChange={(e) => set('systemContext', e.target.value)}
            />
          </div>
          <div className="admin-field">
            <label>Quick Prompts (up to 3)</label>
            {[0, 1, 2].map((i) => (
              <input
                key={i}
                placeholder={`Quick prompt ${i + 1}`}
                value={form.quickPrompts[i] || ''}
                onChange={(e) => setQP(i, e.target.value)}
                style={{ marginBottom: i < 2 ? '0.45rem' : 0 }}
              />
            ))}
          </div>
          <div className="admin-form-actions">
            <button type="button" className="admin-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-btn-primary">
              {isEdit ? 'Save Changes' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Categories Tab ────────────────────────────────────────────────────────────
function CategoriesTab({ authFetch }) {
  const { data: cats, loading, error, reload } = useAdminData(authFetch, '/api/categories');
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [actionError, setActionError] = useState('');

  const handleSave = async (form) => {
    setActionError('');
    try {
      const isEdit = !!editCat;
      const res = await authFetch(
        isEdit ? `/api/categories/${form.id}` : '/api/categories',
        {
          method: isEdit ? 'PUT' : 'POST',
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      setShowModal(false);
      setEditCat(null);
      reload();
    } catch (e) {
      setActionError(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete category "${id}"? This cannot be undone.`)) return;
    const res = await authFetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) { setActionError('Delete failed'); return; }
    reload();
  };

  return (
    <div>
      {(showModal || editCat) && (
        <CategoryModal
          initial={editCat}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditCat(null); }}
        />
      )}
      <div className="admin-section-header">
        <div>
          <h2>Legal Categories</h2>
          <p>Manage the AI legal issue types visible to all users</p>
        </div>
        <button className="admin-btn-primary" onClick={() => setShowModal(true)}>
          Add Category
        </button>
      </div>
      {actionError && <div className="admin-error-msg">{actionError}</div>}
      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /> Loading…</div>
      ) : error ? (
        <div className="admin-error-msg">{error}</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Category</th>
                <th>ID</th>
                <th>Icon</th>
                <th>Color</th>
                <th>Quick Prompts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((cat) => (
                <tr key={cat.id}>
                  <td style={{ color: 'rgba(255,255,255,0.3)' }}>{cat.order}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{cat.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{cat.description}</div>
                  </td>
                  <td><code style={{ fontSize: '0.78rem', color: '#4ea8de' }}>{cat.id}</code></td>
                  <td style={{ color: 'rgba(255,255,255,0.5)' }}>{cat.icon}</td>
                  <td>
                    <span className="cat-color-dot" style={{ background: cat.color }} />
                    <code style={{ fontSize: '0.75rem' }}>{cat.color}</code>
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>
                    {cat.quickPrompts?.length || 0} prompts
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="admin-btn-edit" onClick={() => setEditCat(cat)}>Edit</button>
                      <button className="admin-btn-delete" onClick={() => handleDelete(cat.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cats.length === 0 && <div className="admin-empty">No categories found.</div>}
        </div>
      )}
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab({ authFetch, currentUserId }) {
  const { data: users, loading, error, reload } = useAdminData(authFetch, '/api/admin/users');
  const [actionError, setActionError] = useState('');

  const toggleAdmin = async (id) => {
    const res = await authFetch(`/api/admin/users/${id}/toggle-admin`, { method: 'PATCH' });
    if (!res.ok) { setActionError('Failed to toggle admin'); return; }
    reload();
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    const res = await authFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (!res.ok) { setActionError('Delete failed'); return; }
    reload();
  };

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h2>Users</h2>
          <p>All registered accounts — toggle admin rights or remove users</p>
        </div>
      </div>
      {actionError && <div className="admin-error-msg">{actionError}</div>}
      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /> Loading…</div>
      ) : error ? (
        <div className="admin-error-msg">{error}</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{u.name}</td>
                  <td style={{ color: 'rgba(255,255,255,0.6)' }}>{u.email}</td>
                  <td>
                    {u.is_admin
                      ? <span className="badge-admin">Admin</span>
                      : <span className="badge-user">User</span>}
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                    {new Date(u.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      {u.id !== currentUserId && (
                        <>
                          <button
                            className={`admin-btn-toggle ${!u.is_admin ? '' : 'admin-btn-toggle--off'}`}
                            onClick={() => toggleAdmin(u.id)}
                          >
                            {u.is_admin ? 'Revoke Admin' : 'Make Admin'}
                          </button>
                          <button className="admin-btn-delete" onClick={() => deleteUser(u.id, u.name)}>Delete</button>
                        </>
                      )}
                      {u.id === currentUserId && (
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>You</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div className="admin-empty">No users found.</div>}
        </div>
      )}
    </div>
  );
}

// ── Sessions Tab ──────────────────────────────────────────────────────────────
function SessionsTab({ authFetch }) {
  const { data: sessions, loading, error } = useAdminData(authFetch, '/api/admin/sessions');

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h2>Chat Sessions</h2>
          <p>All user conversation sessions across the platform (read-only)</p>
        </div>
      </div>
      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /> Loading…</div>
      ) : error ? (
        <div className="admin-error-msg">{error}</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Category</th>
                <th>Messages</th>
                <th>Started</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td><code style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{s.id.slice(-8)}</code></td>
                  <td style={{ color: '#fff' }}>{s.category_label}</td>
                  <td style={{ color: '#56c596', fontWeight: 600 }}>{s.message_count}</td>
                  <td style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>
                    {new Date(s.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>
                    {new Date(s.updated_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sessions.length === 0 && <div className="admin-empty">No chat sessions yet.</div>}
        </div>
      )}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage({ onBack }) {
  const { user, authFetch, logout } = useAuth();
  const [tab, setTab] = useState('categories');

  const TABS = [
    { id: 'categories', label: 'Categories' },
    { id: 'users', label: 'Users' },
    { id: 'sessions', label: 'Sessions' },
  ];

  return (
    <div className="admin-root">
      <header className="admin-topbar">
        <div className="admin-topbar__brand">
          <span>Nyaay Saathi</span>
          <span className="admin-topbar__badge">Admin</span>
        </div>
        <div className="admin-topbar__actions">
          <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>
            {user?.name}
          </span>
          <button className="admin-back-btn" onClick={onBack}>← Back to Chat</button>
          <button className="admin-logout-btn" onClick={logout}>Sign Out</button>
        </div>
      </header>

      <nav className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`admin-tab ${tab === t.id ? 'admin-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="admin-content">
        {tab === 'categories' && <CategoriesTab authFetch={authFetch} />}
        {tab === 'users' && <UsersTab authFetch={authFetch} currentUserId={user?.id} />}
        {tab === 'sessions' && <SessionsTab authFetch={authFetch} />}
      </main>
    </div>
  );
}
