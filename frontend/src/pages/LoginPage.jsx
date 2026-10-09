import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOpportunities } from '../context/useOpportunities';
import { IconMail, IconLock, IconEye, IconEyeOff } from '../components/Icons';

export function LoginPage() {
  const navigate = useNavigate();
  const { demoLogin, showToast } = useOpportunities();

  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid work email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    // Demo sign-in: record user without storing password in localStorage
    demoLogin(cleanEmail);

    showToast('Signed in successfully. Tell us about your product to customize matches.', 'info');
    navigate('/onboarding');
  };

  return (
    <div className="login-exact-page">
      <div className="login-exact-card">
        {/* Left Half: Atmospheric Desk Photo Panel with Logo & Tagline */}
        <div
          className="login-exact-photo-panel"
          role="img"
          aria-label="DarkIntent - Find signals. Build pipelines."
        >
          <span className="sr-only">DarkIntent - FIND SIGNALS. BUILD PIPELINES.</span>
        </div>

        {/* Right Half: Warm Ivory Form Panel */}
        <div className="login-exact-form-panel">
          {/* Top-Right: Small DEMO ACCESS Indicator */}
          <div className="login-exact-demo-indicator" aria-label="Demo Access Active">
            <span className="login-exact-demo-dot" />
            <span>DEMO ACCESS</span>
          </div>

          {/* Centered Form Wrapper */}
          <div className="login-exact-form-wrapper">
            <div className="login-exact-header">
              <h1 className="login-exact-title font-editorial">
                {mode === 'login' ? 'Welcome back' : 'Create an account'}
              </h1>
              <p className="login-exact-subtitle">
                {mode === 'login'
                  ? 'Sign in to access your opportunities.'
                  : 'Sign up to access your opportunities.'}
              </p>
            </div>

            {error && (
              <div className="login-exact-error-banner" role="alert">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-exact-form">
              {/* Work email */}
              <div className="login-exact-field-group">
                <label htmlFor="login-work-email" className="login-exact-label">
                  Work email
                </label>
                <div className="login-exact-input-wrap">
                  <IconMail size={15} className="login-exact-input-icon" />
                  <input
                    id="login-work-email"
                    type="email"
                    autoComplete="email"
                    className="login-exact-input"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="login-exact-field-group">
                <label htmlFor="login-password" className="login-exact-label">
                  Password
                </label>
                <div className="login-exact-input-wrap">
                  <IconLock size={15} className="login-exact-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="login-exact-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="login-exact-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="login-exact-forgot-wrap">
                <button
                  type="button"
                  className="login-exact-forgot-link"
                  onClick={() =>
                    showToast('Demo access active: enter any email & password to sign in.', 'info')
                  }
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign in button */}
              <button type="submit" className="login-exact-submit-btn">
                <span>{mode === 'login' ? 'Sign in →' : 'Sign up →'}</span>
              </button>
            </form>

            {/* OR Divider */}
            <div className="login-exact-divider">
              <span>OR</span>
            </div>

            {/* Footer */}
            <div className="login-exact-footer">
              {mode === 'login' ? (
                <p>
                  Don’t have an account?{' '}
                  <button
                    type="button"
                    className="login-exact-toggle-link"
                    onClick={() => {
                      setMode('signup');
                      setError('');
                    }}
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="login-exact-toggle-link"
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
