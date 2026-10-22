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
    <div>
      <h2>Register</h2>

      {message && (
        <p style={{ color: isSuccess ? 'green' : 'red' }}>
          {message}
        </p>
      )}

      {isSuccess && (
        <p>
          <Link href="/login">Click here to go to the Login page</Link>
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Name:</label>
          <br />
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

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

        <div style={{ marginBottom: '10px' }}>
          <label>Role:</label>
          <br />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="organiser">Organiser</option>
          </select>
        </div>

        {/* show clubName input only if role is organiser */}
        {role === 'organiser' && (
          <div style={{ marginBottom: '10px' }}>
            <label>Club Name:</label>
            <br />
            <input
              type="text"
              required
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
            />
          </div>
        )}

        <button type="submit">Register</button>
      </form>

      <p>
        Already have an account? <Link href="/login">Login here</Link>
      </p>
    </div>
  );
}
