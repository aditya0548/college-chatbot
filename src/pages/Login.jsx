import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import '../styles/auth.css';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const validate = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return 'Please enter a valid email address.';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    if (isSignUp && password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const getFriendlyError = (err) => {
    const errMessage = err?.message || '';
    const errStatus = err?.status;

    if (errMessage.includes('Too Many Requests') || errStatus === 429) {
      return 'Too many attempts. Please wait a few minutes and try again.';
    }
    if (errMessage.includes('Email not confirmed')) {
      return 'Please check your email to confirm your account before signing in.';
    }
    if (errMessage.includes('Password should be at least')) {
      return 'Password must be at least 6 characters.';
    }
    if (errMessage.includes('Invalid login credentials')) {
      return 'Email or password is incorrect.';
    }
    if (errMessage.includes('User already registered')) {
      return 'An account with this email already exists.';
    }
    return 'Something went wrong. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      }
    } catch (err) {
      console.error('[auth]', err);
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1 className="auth-title">College Chatbot</h1>
        <p className="auth-subtitle">BPHE Society's Ahmednagar College</p>
      </div>

      <div className="auth-card">
        <div className="auth-tabs">
          <button 
            type="button"
            className={`auth-tab ${!isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(false); setError(null); }}
          >
            Sign In
          </button>
          <button 
            type="button"
            className={`auth-tab ${isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(true); setError(null); }}
          >
            Create Account
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              className="form-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"}
                className="form-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {!isSignUp && (
              <a 
                href="#" 
                className="forgot-password"
                onClick={(e) => { e.preventDefault(); console.log('forgot password'); }}
              >
                Forgot password?
              </a>
            )}
          </div>
          
          {isSignUp && (
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-input" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="auth-links">
          {!isSignUp ? (
            <p className="auth-link">
              Don't have an account? <span onClick={() => { setIsSignUp(true); setError(null); }}>Sign up</span>
            </p>
          ) : (
            <p className="auth-link">
              Already have an account? <span onClick={() => { setIsSignUp(false); setError(null); }}>Sign in</span>
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
