'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';

/**
 * Minimalist Discover Events Feed
 * Next.js Unit II: Client Components & Fetch API
 * React Unit II: Reusable component abstractions (Card, Badge, Button, EmptyState)
 * React Unit III: Hooks & Optimization (useState, useEffect, useMemo, useCallback)
 * React Unit VI: Global State Management with useAuth()
 */
export default function DiscoverPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and filter inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [pricing, setPricing] = useState('');
  const [sort, setSort] = useState('recommended');
  const [message, setMessage] = useState('');

  // 1. Fetch categories on mount
  useEffect(() => {
    async function init() {
      try {
        const catRes = await fetch('/api/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }
      } catch (err) {
        // ignore
      }
    }
    init();
  }, []);

  // 2. React Unit III: useCallback memoizes event loading function
  const loadEvents = useCallback(async () => {
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
  }, [searchQuery, category, pricing, sort]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // 3. React Unit III: useMemo memoizes computed counts preventing recalculation
  const bookmarkedCount = useMemo(() => {
    return events.filter((ev) => ev.isBookmarked).length;
  }, [events]);

  function handleSearch(e) {
    e.preventDefault();
    loadEvents();
  }

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

        setEvents(
          events.map((ev) => {
            if (ev.id === eventId) {
              return {
                ...ev,
                isBookmarked: data.isBookmarked,
                bookmarkCount: data.bookmarkCount,
              };
            }
            return ev;
          })
        );
      }
    } catch (err) {
      alert('Could not update bookmark');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ border: 'none', margin: '0 0 4px 0', padding: 0 }}>
            Discover Campus Events
          </h2>
          <p style={{ margin: 0 }}>
            Browse upcoming workshops, hackathons, and cultural fests matching your interests.
          </p>
        </div>
        {user && user.interests && user.interests.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Interests:</span>
            {user.interests.map((tag) => (
              <Badge key={tag} variant="info" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {message && (
        <div className="alert alert-success" role="alert">
          <span>✅</span>
          <span>{message}</span>
        </div>
      )}

      {/* Minimal Filter Bar */}
      <Card padding="compact" style={{ marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search events by title, description or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: '220px' }}
          />
          <Button type="submit" variant="primary" size="sm">
            Search
          </Button>
          {searchQuery && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setTimeout(loadEvents, 0);
              }}
            >
              Reset
            </Button>
          )}
        </form>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ margin: 0 }}>Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: 'auto', padding: '4px 8px' }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ margin: 0 }}>Pricing:</label>
            <select
              value={pricing}
              onChange={(e) => setPricing(e.target.value)}
              style={{ width: 'auto', padding: '4px 8px' }}
            >
              <option value="">All</option>
              <option value="free">Free Only</option>
              <option value="paid">Paid Only</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ margin: 0 }}>Sort By:</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{ width: 'auto', padding: '4px 8px' }}
            >
              <option value="recommended">Best Match (Relevant to Me)</option>
              <option value="trending">Most Bookmarked</option>
              <option value="date">Date</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Events Presentation */}
      {loading ? (
        <LoadingSpinner text="Finding matches..." />
      ) : events.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No published events found"
          description="Try broadening your category filter or clearing the search keyword."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setCategory('');
            setPricing('');
            setTimeout(loadEvents, 0);
          }}
        />
      ) : (
        <div className="card card-padding-none">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Category</th>
                <th>Date & Time</th>
                <th>Venue</th>
                <th>Price</th>
                <th>Match</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td>
                    <Link href={`/events/${ev.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {ev.title}
                    </Link>
                    <br />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {ev.clubName || ev.organiserName}
                    </span>
                  </td>
                  <td>
                    <Badge variant="info" size="sm">
                      {ev.category}
                    </Badge>
                  </td>
                  <td>
                    <span>{ev.date}</span>
                    <br />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {ev.startTime} - {ev.endTime}
                    </span>
                  </td>
                  <td>{ev.venue}</td>
                  <td>
                    <Badge variant={ev.isPaid ? 'warning' : 'neutral'} size="sm">
                      {ev.isPaid ? `₹${ev.ticketPrice}` : 'Free'}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={ev.relevanceScore >= 50 ? 'success' : 'neutral'} dot size="sm">
                      {ev.relevanceScore}%
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <Link href={`/events/${ev.id}`} className="btn btn-outline btn-sm">
                        View
                      </Link>
                      <Button
                        variant={ev.isBookmarked ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleBookmark(ev.id)}
                      >
                        {ev.isBookmarked ? '★ Saved' : '☆ Save'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
