'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  // 1. form state variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 2. error and loading message
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 3. handle login form submit
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      // send post request to login route
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // redirect to profile page on successful login
        window.location.href = '/profile';
      } else {
        setErrorMessage(data.message || 'Login failed');
      }
    } catch (error) {
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '20px auto' }}>
      <h2>Login to Eventra</h2>

      {errorMessage && (
        <div
          style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '10px 12px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
            border: '1px solid #ffcdd2',
          }}
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '14px' }}>
          <label>Email Address:</label>
          <br />
          <input
            type="email"
            required
            placeholder="you@campus.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label>Password:</label>
          <br />
          <input
            type="password"
            required
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{ width: '100%', marginTop: '6px' }}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
        Don't have an account yet? <Link href="/register">Register here</Link>
      </p>
    </div>
  );
}
