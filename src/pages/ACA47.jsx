import React from 'react';
import { useAuth } from '../context/AuthProvider';
import AuroraBackground from '../components/AuroraBackground';
import ChatShell from '../components/ChatShell';
import { useNavigate } from 'react-router-dom';

const ACA47 = () => {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app">
      <AuroraBackground />

      <header className="app-header">
        <div className="brand">ACA47</div>
        <div className="header-right">
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="avatar">
                {session.user?.email?.[0].toUpperCase() || 'U'}
              </div>
              <button onClick={() => signOut()} className="sign-out-btn">
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="sign-in-btn">
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        <div className="hero">
          <h1 className="hero-title">Ask anything.</h1>
          <p className="hero-sub">The voice of Ahmednagar College — since 1947.</p>
        </div>

        <div className="chat-shell">
          <ChatShell />
        </div>
      </main>
    </div>
  );
};

export default ACA47;
