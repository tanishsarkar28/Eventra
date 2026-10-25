'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  // 1. form state variables
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [clubName, setClubName] = useState('');

  // 2. status message
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // 3. handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');

    try {
      // send post request to register route
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
          role: role,
          clubName: clubName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage('Registration successful! You can now log in.');
        // clear inputs
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
    }
  }

  return (
    <div style={{ maxWidth: '420px', margin: '20px auto' }}>
      <h2>Register</h2>

      {message && (
        <div
          style={{
            backgroundColor: isSuccess ? '#e8f5e9' : '#ffebee',
            color: isSuccess ? '#2e7d32' : '#c62828',
            padding: '10px 12px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
            border: `1px solid ${isSuccess ? '#c8e6c9' : '#ffcdd2'}`,
          }}
        >
          {message}
        </div>
      )}

      {isSuccess && (
        <p style={{ marginBottom: '16px' }}>
          <Link href="/login" style={{ fontWeight: 'bold' }}>
            Click here to go to the Login page →
          </Link>
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '14px' }}>
          <label>Name:</label>
          <br />
          <input
            type="text"
            required
            style={{ width: '100%' }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alice Johnson"
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label>Email:</label>
          <br />
          <input
            type="email"
            required
            style={{ width: '100%' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alice@campus.edu"
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label>Password:</label>
          <br />
          <input
            type="password"
            required
            style={{ width: '100%' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose a password"
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label>Role:</label>
          <br />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="student">Student</option>
            <option value="organiser">Organiser</option>
          </select>
        </div>

        {/* show clubName input only if role is organiser */}
        {role === 'organiser' && (
          <div style={{ marginBottom: '14px' }}>
            <label>Club Name:</label>
            <br />
            <input
              type="text"
              required
              style={{ width: '100%' }}
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="e.g. Robotics Club"
            />
          </div>
        )}

        <button type="submit" style={{ width: '100%', marginTop: '6px' }}>
          Register
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
        Already have an account? <Link href="/login">Login here</Link>
      </p>
    </div>
  );
}
