'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DiscoverPage() {
  // 1. State variables (beginner-friendly state)
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search and filter inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [pricing, setPricing] = useState('');
  const [sort, setSort] = useState('recommended');

  const [message, setMessage] = useState('');

  // 2. Fetch logged-in user profile & categories on page load
  useEffect(() => {
    async function init() {
      try {
        const userRes = await fetch('/api/users/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }

        const catRes = await fetch('/api/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }
      } catch (err) {
        // ignore errors
      }
    }
    init();
  }, []);

  // 3. Fetch events according to search and filters
  async function loadEvents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (category) params.set('category', category);
      if (pricing) params.set('pricing', pricing);
      if (sort) params.set('sort', sort);

      const res = await fetch(`/api/discover?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  // Reload events when dropdown filters change
  useEffect(() => {
    loadEvents();
  }, [category, pricing, sort]);

  // Handle search form submission
  function handleSearch(e) {
    e.preventDefault();
    loadEvents();
  }

  // 4. Bookmark toggle button handler
  async function handleBookmark(eventId) {
    if (!user) {
      alert('Please log in first to save events!');
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}/bookmark`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setTimeout(() => setMessage(''), 3000);

        // Update event bookmark state in list
        setEvents(events.map(ev => {
          if (ev.id === eventId) {
            return {
              ...ev,
              isBookmarked: data.isBookmarked,
              bookmarkCount: data.bookmarkCount,
            };
          }
          return ev;
        }));
      }
    } catch (err) {
      alert('Could not update bookmark');
    }
  }

  return (
    <div>
      <h2>Discover Events</h2>
      <p>Browse upcoming campus events, search by topic, and bookmark what you like.</p>

      {/* Student interests notification */}
      {user && user.interests && user.interests.length > 0 && (
        <p style={{ background: '#f0f0f0', padding: '8px', border: '1px solid #ccc' }}>
          <strong>Your Interests:</strong> {user.interests.join(', ')} (Events are ranked to match your interests!)
        </p>
      )}

      {/* Success/Action message */}
      {message && (
        <p style={{ color: 'green', fontWeight: 'bold' }}>
          {message}
        </p>
      )}

      {/* Simple Search & Filter Box */}
      <div style={{ border: '1px solid #ccc', padding: '12px', marginBottom: '20px' }}>
        <form onSubmit={handleSearch} style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Search events by title, description or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '70%', marginRight: '8px' }}
          />
          <button type="submit">Search</button>
          {' '}
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setTimeout(loadEvents, 0); }}
            >
              Reset
            </button>
          )}
        </form>

        <div>
          <label>Category: </label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {' | '}

          <label>Pricing: </label>
          <select value={pricing} onChange={(e) => setPricing(e.target.value)}>
            <option value="">All</option>
            <option value="free">Free Only</option>
            <option value="paid">Paid Only</option>
          </select>
          {' | '}

          <label>Sort By: </label>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recommended">Best Match (Relevant to Me)</option>
            <option value="trending">Most Bookmarked</option>
            <option value="date">Date</option>
          </select>
        </div>
      </div>

      {/* Event List */}
      {loading ? (
        <p>Loading events...</p>
      ) : events.length === 0 ? (
        <p>No published events found matching your search.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ width: '100%', marginTop: '10px' }}>
          <thead>
            <tr>
              <th>Event</th>
              <th>Category</th>
              <th>Date & Time</th>
              <th>Venue</th>
              <th>Price</th>
              <th>Match</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id}>
                <td>
                  <strong>
                    <Link href={`/events/${ev.id}`}>{ev.title}</Link>
                  </strong>
                  <br />
                  <small>{ev.clubName || ev.organiserName}</small>
                </td>
                <td>{ev.category}</td>
                <td>
                  {ev.date}
                  <br />
                  <small>{ev.startTime} - {ev.endTime}</small>
                </td>
                <td>{ev.venue}</td>
                <td>{ev.isPaid ? `₹${ev.ticketPrice}` : 'Free'}</td>
                <td>
                  <strong>{ev.relevanceScore}%</strong>
                </td>
                <td>
                  <Link href={`/events/${ev.id}`}>View</Link>
                  {' | '}
                  <button onClick={() => handleBookmark(ev.id)}>
                    {ev.isBookmarked ? 'Saved ★' : 'Save ☆'}
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
