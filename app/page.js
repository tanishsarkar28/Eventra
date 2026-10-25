'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  // 1. state to store the logged-in user
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. check if a user is logged in when the page loads
  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // 3. show loading message while checking auth status
  if (loading) {
    return <p>Loading...</p>;
  }

  // 4. if logged in, show greeting with name and role
  if (user) {
    return (
      <div>
        <h2>Hello, {user.name} ({user.role})</h2>
        <p>Welcome back to Eventra!</p>
        <ul>
          <li><Link href="/profile">Go to your Profile</Link></li>
          {(user.role === 'organiser' || user.role === 'admin') && (
            <>
              <li><Link href="/my-events">Manage My Events</Link></li>
              <li><Link href="/events/create">Create New Event</Link></li>
            </>
          )}
          {user.role === 'admin' && (
            <li><Link href="/admin">Go to Admin Panel</Link></li>
          )}
        </ul>
      </div>
    );
  }

  // 5. if not logged in, show welcome and login/register links
  return (
    <div>
      <h2>Welcome to Eventra</h2>
      <p>Please log in or create a new account to continue.</p>
      <ul>
        <li><Link href="/login">Login to your account</Link></li>
        <li><Link href="/register">Register as a Student or Organiser</Link></li>
      </ul>
    </div>
  );
}
