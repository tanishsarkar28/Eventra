'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/Card';
import Button from '@/components/Button';

/**
 * Minimalist Registration Page
 * React Unit IV: Form handling, controlled components & validation
 * Next.js Unit IV: Role-based registration concepts
 */
export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student');
  const [clubName, setClubName] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          clubName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage('Registration successful! You can now log in.');
        setName('');
        setEmail('');
        setPassword('');
        setClubName('');
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Registration failed');
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card-container">
      <Card
        title="Create your Eventra Account"
        subtitle="Join as a Student attendee or Club Organiser"
        padding="normal"
      >
        {message && (
          <div className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'}`} role="alert">
            <span>{isSuccess ? '✅' : '⚠️'}</span>
            <span>{message}</span>
          </div>
        )}

        {isSuccess && (
          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <Link href="/login" className="btn btn-primary btn-sm">
              Proceed to Login &rarr;
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alice Johnson"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Campus Email</label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@campus.edu"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  borderRadius: '4px',
                  transition: 'color 0.15s ease',
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Account Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Student (Attend & Discover)</option>
              <option value="organiser">Organiser (Host & Manage Events)</option>
            </select>
          </div>

          {role === 'organiser' && (
            <div className="form-group">
              <label htmlFor="clubName">College Club / Society Name</label>
              <input
                id="clubName"
                type="text"
                required
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="e.g. Robotics Club"
              />
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            Create Account
          </Button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13.5px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link href="/login" style={{ fontWeight: 600 }}>
            Login here
          </Link>
        </div>
      </Card>
    </div>
  );
}
