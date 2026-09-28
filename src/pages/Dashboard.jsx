import React from 'react';
import { useAuth } from '../context/AuthProvider';
import { LogOut } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-soft)',
        background: 'var(--bg-card)'
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500 }}>
          College Chatbot
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {user?.email}
          </span>
          <button 
            onClick={signOut}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              color: 'var(--text-muted)',
              fontSize: '14px',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </header>

      <main style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--text-secondary)'
      }}>
        <p>You're logged in. Chat UI coming soon.</p>
      </main>
    </div>
  );
}
