'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  // 1. user profile state
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 2. form edit fields
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [interests, setInterests] = useState('');

  // 3. message state
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // 4. load user profile when page opens
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          // populate edit fields
          setName(data.user.name || '');
          setBranch(data.user.branch || '');
          setYear(data.user.year || '');
          setInterests(
            Array.isArray(data.user.interests)
              ? data.user.interests.join(', ')
              : ''
          );
        } else {
          // not logged in, redirect to login page
          window.location.href = '/login';
        }
      } catch (error) {
        window.location.href = '/login';
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, []);

  // 5. handle updating profile
  async function handleUpdate(e) {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          branch: branch,
          year: year,
          interests: interests,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setIsSuccess(true);
        setMessage('Profile updated successfully!');
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Failed to update profile');
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage('Failed to update profile');
    }
  }

  // 6. handle logout
  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      window.location.href = '/login';
    }
  }

  // 7. show loading text while fetching
  if (isLoading) {
    return <p>Loading profile...</p>;
  }

  // 8. if no user, return null (redirecting)
  if (!user) {
    return null;
  }

  return (
    <div>
      <h2>User Profile</h2>

      <button onClick={handleLogout} style={{ marginBottom: '15px' }}>
        Logout
      </button>

      <h3>Account Details</h3>
      <table border="1" cellPadding="6" style={{ marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td><strong>User ID:</strong></td>
            <td>{user.id}</td>
          </tr>
          <tr>
            <td><strong>Name:</strong></td>
            <td>{user.name}</td>
          </tr>
          <tr>
            <td><strong>Email:</strong></td>
            <td>{user.email}</td>
          </tr>
          <tr>
            <td><strong>Role:</strong></td>
            <td>{user.role}</td>
          </tr>
          {user.role === 'organiser' && (
            <tr>
              <td><strong>Club Name:</strong></td>
              <td>{user.clubName || 'N/A'}</td>
            </tr>
          )}
          <tr>
            <td><strong>Verification Status:</strong></td>
            <td>
              {user.isVerified ? 'Verified' : 'Pending Admin Verification'}
            </td>
          </tr>
          <tr>
            <td><strong>Branch:</strong></td>
            <td>{user.branch || '(not set)'}</td>
          </tr>
          <tr>
            <td><strong>Year:</strong></td>
            <td>{user.year || '(not set)'}</td>
          </tr>
          <tr>
            <td><strong>Interests:</strong></td>
            <td>
              {user.interests && user.interests.length > 0
                ? user.interests.join(', ')
                : '(none)'}
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Edit Profile</h3>

      {message && (
        <p style={{ color: isSuccess ? 'green' : 'red' }}>
          {message}
        </p>
      )}

      <form onSubmit={handleUpdate}>
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
          <label>Branch (e.g., Computer Science):</label>
          <br />
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Year (e.g., 2nd Year):</label>
          <br />
          <input
            type="text"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Interests (comma separated, e.g. AI, Music, Sports):</label>
          <br />
          <input
            type="text"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
          />
        </div>

        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}
