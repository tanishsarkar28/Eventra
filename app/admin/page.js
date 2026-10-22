'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  // 1. state variables
  const [organisers, setOrganisers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState('');

  // 2. fetch pending organisers from API
  async function fetchPendingOrganisers() {
    try {
      const response = await fetch('/api/organisers/pending');
      if (response.ok) {
        const data = await response.json();
        setOrganisers(data.organisers || []);
      }
    } catch (error) {
      // ignore or handle error
    }
  }

  // 3. check admin permissions on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.role === 'admin') {
            setIsAdmin(true);
            await fetchPendingOrganisers();
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  // 4. handle clicking the verify button for an organiser
  async function handleVerify(id) {
    setMessage('');
    try {
      const response = await fetch('/api/organisers/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Organiser successfully verified!');
        // refresh the pending organisers list
        fetchPendingOrganisers();
      } else {
        setMessage(data.message || 'Verification failed');
      }
    } catch (error) {
      setMessage('Failed to verify organiser');
    }
  }

  // 5. show loading state
  if (isLoading) {
    return <p>Checking admin permissions...</p>;
  }

  // 6. show access denied if user is not an admin
  if (!isAdmin) {
    return (
      <div>
        <h2>Access Denied</h2>
        <p>This page is only accessible by administrators.</p>
        <Link href="/login">Please login with an admin account</Link>
      </div>
    );
  }

  // 7. render pending organisers table
  return (
    <div>
      <h2>Admin Panel - Pending Organisers</h2>

      {message && <p style={{ color: 'green' }}>{message}</p>}

      {organisers.length === 0 ? (
        <p>No pending organisers waiting for verification.</p>
      ) : (
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Club Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {organisers.map((org) => (
              <tr key={org.id}>
                <td>{org.id}</td>
                <td>{org.name}</td>
                <td>{org.email}</td>
                <td>{org.clubName}</td>
                <td>
                  <button onClick={() => handleVerify(org.id)}>
                    Verify
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
