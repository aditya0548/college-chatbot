import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Edit2, Trash2 } from 'lucide-react';
import '../styles/admin.css';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (token) {
      setIsAuthenticated(true);
      fetchEntries(token);
    }
  }, []);

  const fetchEntries = async (token) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/admin', {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      if (res.ok) {
        sessionStorage.setItem('admin_token', password);
        setIsAuthenticated(true);
        fetchEntries(password);
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      setError('Server error. Try again.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setEntries([]);
    setPassword('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    const token = sessionStorage.getItem('admin_token');
    
    try {
      const res = await fetch('/api/admin', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setEntries(entries.filter(e => e.id !== id));
      } else {
        alert('Failed to delete entry');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('admin_token');
    const isNew = !editingEntry.id;
    const method = isNew ? 'POST' : 'PATCH';
    
    // Convert comma-separated string to array
    let patterns = editingEntry.question_patterns;
    if (typeof patterns === 'string') {
      patterns = patterns.split(',').map(s => s.trim()).filter(s => s);
    }

    const payload = {
      ...editingEntry,
      question_patterns: patterns
    };

    try {
      const res = await fetch('/api/admin', {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        if (isNew) {
          setEntries([data.entry, ...entries]);
        } else {
          setEntries(entries.map(ent => ent.id === data.entry.id ? data.entry : ent));
        }
        setIsModalOpen(false);
        setEditingEntry(null);
      } else {
        alert('Failed to save entry');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving entry');
    }
  };

  const openNewModal = () => {
    setEditingEntry({
      category: '',
      question_patterns: '',
      answer: '',
      confidence: 'high',
      source: 'Admin'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (entry) => {
    setEditingEntry({
      ...entry,
      question_patterns: entry.question_patterns.join(', ')
    });
    setIsModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-page">
        <div className="admin-login-container">
          <h2>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit">Access Panel</button>
          </form>
          {error && <div className="admin-error">{error}</div>}
        </div>
      </div>
    );
  }

  const uniqueCategories = new Set(entries.map(e => e.category)).size;

  return (
    <div className="admin-page">
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1>ACA47 Admin</h1>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <LogOut size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
            Logout
          </button>
        </div>

        <div className="admin-stats">
          <div className="stat-card">
            <h3>Total KB Entries</h3>
            <p>{entries.length}</p>
          </div>
          <div className="stat-card">
            <h3>Categories</h3>
            <p>{uniqueCategories}</p>
          </div>
          <div className="stat-card">
            <h3>Last Update</h3>
            <p style={{ fontSize: '18px', lineHeight: '36px' }}>
              {entries.length > 0 
                ? new Date(Math.max(...entries.map(e => new Date(e.updated_at).getTime()))).toLocaleDateString()
                : 'N/A'
              }
            </p>
          </div>
        </div>

        <div className="admin-actions">
          <button className="admin-add-btn" onClick={openNewModal}>
            <Plus size={16} /> Add Entry
          </button>
        </div>

        <div className="admin-table-container">
          {loading ? (
            <div className="admin-loading">Loading entries...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Patterns</th>
                  <th>Answer Preview</th>
                  <th>Confidence</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id}>
                    <td>{entry.category}</td>
                    <td>
                      {entry.question_patterns.slice(0, 3).map(p => (
                        <span key={p} className="pattern-chip">{p}</span>
                      ))}
                      {entry.question_patterns.length > 3 && (
                        <span className="pattern-chip">+{entry.question_patterns.length - 3}</span>
                      )}
                    </td>
                    <td>
                      <div className="cell-truncate">{entry.answer}</div>
                    </td>
                    <td>
                      <span style={{ 
                        color: entry.confidence === 'high' ? '#16a34a' : entry.confidence === 'medium' ? '#ca8a04' : '#dc2626',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {entry.confidence}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon edit" onClick={() => openEditModal(entry)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-icon delete" onClick={() => handleDelete(entry.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2>{editingEntry.id ? 'Edit Entry' : 'Add New Entry'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Category</label>
                <input 
                  type="text" 
                  value={editingEntry.category} 
                  onChange={e => setEditingEntry({...editingEntry, category: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Question Patterns (comma-separated)</label>
                <input 
                  type="text" 
                  value={editingEntry.question_patterns} 
                  onChange={e => setEditingEntry({...editingEntry, question_patterns: e.target.value})}
                  placeholder="e.g. fee, cost, tuition, price"
                  required
                />
              </div>
              <div className="form-group">
                <label>Answer (supports markdown)</label>
                <textarea 
                  value={editingEntry.answer} 
                  onChange={e => setEditingEntry({...editingEntry, answer: e.target.value})}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Confidence</label>
                  <select 
                    value={editingEntry.confidence} 
                    onChange={e => setEditingEntry({...editingEntry, confidence: e.target.value})}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Source</label>
                  <input 
                    type="text" 
                    value={editingEntry.source} 
                    onChange={e => setEditingEntry({...editingEntry, source: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-save">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
