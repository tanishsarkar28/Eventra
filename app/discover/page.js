'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DiscoverPage() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPricing, setSelectedPricing] = useState('');
  const [selectedSort, setSelectedSort] = useState('recommended');
  const [selectedDate, setSelectedDate] = useState('');

  // Status message
  const [message, setMessage] = useState('');

  // Load user & categories
  useEffect(() => {
    async function init() {
      try {
        const [userRes, catRes] = await Promise.all([
          fetch('/api/users/me'),
          fetch('/api/categories'),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }
      } catch (e) {
        // ignore
      }
    }
    init();
  }, []);

  // Fetch events whenever filters change
  async function fetchEvents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedPricing) params.set('pricing', selectedPricing);
      if (selectedDate) params.set('date', selectedDate);
      if (selectedSort) params.set('sort', selectedSort);

      const res = await fetch(`/api/discover?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (e) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, selectedPricing, selectedSort, selectedDate]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchEvents();
  }

  // Toggle Bookmark
  async function handleToggleBookmark(eventId) {
    if (!user) {
      alert('Please log in to save or bookmark events!');
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}/bookmark`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setTimeout(() => setMessage(''), 2500);

        // Update local state
        setEvents(prev => prev.map(ev => {
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
    } catch (e) {
      alert('Failed to bookmark event');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
        <div>
          <h2>Explore & Discover Campus Events</h2>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
            Personalized recommendations, search, and bookmarks for students.
          </p>
        </div>
        {user && user.interests && user.interests.length > 0 && (
          <div style={{ backgroundColor: '#eff6ff', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', color: '#1e40af', border: '1px solid #bfdbfe' }}>
            🎯 <strong>Your Interests:</strong> {user.interests.join(', ')}
          </div>
        )}
      </div>

      {message && (
        <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '8px 12px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #bbf7d0', fontSize: '14px' }}>
          {message}
        </div>
      )}

      {/* Search and Filters Bar */}
      <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Search events by title, description, tags, or club..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, padding: '9px 12px', fontSize: '14px' }}
          />
          <button type="submit" style={{ padding: '9px 18px', fontWeight: 'bold' }}>
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setTimeout(fetchEvents, 0); }}
              style={{ backgroundColor: '#fff' }}
            >
              Clear
            </button>
          )}
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
          <div>
            <label style={{ marginRight: '6px' }}>Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '13px' }}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ marginRight: '6px' }}>Pricing:</label>
            <select
              value={selectedPricing}
              onChange={(e) => setSelectedPricing(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '13px' }}
            >
              <option value="">All (Free & Paid)</option>
              <option value="free">Free Events Only</option>
              <option value="paid">Paid Events Only</option>
            </select>
          </div>

          <div>
            <label style={{ marginRight: '6px' }}>Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ marginRight: '6px' }}>Sort By:</label>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '13px', fontWeight: 'bold' }}
            >
              <option value="recommended">⭐ Relevant to Me (AI Rank)</option>
              <option value="trending">🔥 Trending / Most Saved</option>
              <option value="date">📅 Date (Earliest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <p>Loading discovery feed...</p>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
          <p style={{ fontSize: '16px', color: '#64748b' }}>No published events match your search or filters.</p>
          <button onClick={() => { setSelectedCategory(''); setSelectedPricing(''); setSelectedDate(''); setSearchQuery(''); setSelectedSort('recommended'); }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {events.map(event => (
            <div
              key={event.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Poster thumbnail */}
              {event.poster ? (
                <img
                  src={event.poster}
                  alt={event.title}
                  style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  No Poster Provided
                </div>
              )}

              <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header row: category + relevance score badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                    {event.category}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      backgroundColor: event.relevanceScore >= 60 ? '#dcfce7' : '#fef9c3',
                      color: event.relevanceScore >= 60 ? '#15803d' : '#854d0e',
                    }}
                    title="Calculated from your interests, branch, proximity & popularity"
                  >
                    ⭐ {event.relevanceScore}% Match
                  </span>
                </div>

                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#0f172a' }}>
                  <Link href={`/events/${event.id}`}>
                    {event.title}
                  </Link>
                </h3>

                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#64748b', flex: 1 }}>
                  {event.description ? event.description.substring(0, 85) + '...' : ''}
                </p>

                {/* Event meta */}
                <div style={{ fontSize: '12px', color: '#475569', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginBottom: '12px' }}>
                  <div>📅 <strong>Date:</strong> {event.date} ({event.startTime} - {event.endTime})</div>
                  <div>📍 <strong>Venue:</strong> {event.venue}</div>
                  <div>🏛️ <strong>Club:</strong> {event.clubName || event.organiserName}</div>
                  <div>💰 <strong>Fee:</strong> {event.isPaid ? `₹${event.ticketPrice}` : 'Free'}</div>
                </div>

                {/* Tags */}
                {Array.isArray(event.tags) && event.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                    {event.tags.slice(0, 4).map(tag => (
                      <span key={tag} style={{ fontSize: '11px', padding: '1px 6px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', color: '#64748b' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <Link
                    href={`/events/${event.id}`}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '7px 0',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      textDecoration: 'none',
                    }}
                  >
                    View Details
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleToggleBookmark(event.id)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      backgroundColor: event.isBookmarked ? '#fef3c7' : '#f8fafc',
                      borderColor: event.isBookmarked ? '#f59e0b' : '#cbd5e1',
                      color: event.isBookmarked ? '#b45309' : '#475569',
                      fontWeight: event.isBookmarked ? 'bold' : 'normal',
                    }}
                    title={event.isBookmarked ? 'Remove bookmark' : 'Bookmark this event'}
                  >
                    {event.isBookmarked ? '★ Saved' : '☆ Save'} {event.bookmarkCount > 0 ? `(${event.bookmarkCount})` : ''}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
