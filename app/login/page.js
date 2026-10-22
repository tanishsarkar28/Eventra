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
    <div>
      <h2>Login</h2>

      {errorMessage && (
        <p style={{ color: 'red' }}>{errorMessage}</p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <br />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Password:</label>
          <br />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p>
        Don't have an account yet? <Link href="/register">Register here</Link>
      </p>
    </div>
  );
}
