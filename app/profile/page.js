'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';

/**
 * Minimalist Profile Page with Role-Aware Presentation
 * Next.js Unit IV: Session management & RBAC profile viewing
 * React Unit II: Component composition with Card & Badge
 * React Unit IV: Form handling & controlled inputs
 */
export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form edit fields
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [interests, setInterests] = useState('');

  // Status message
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setName(data.user.name || '');
          setBranch(data.user.branch || '');
          setYear(data.user.year || '');
          setInterests(
            Array.isArray(data.user.interests)
              ? data.user.interests.join(', ')
              : ''
          );
        } else {
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

  async function handleUpdate(e) {
    e.preventDefault();
    setMessage('');
    setIsSaving(true);

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          branch: user?.role === 'admin' ? '' : branch,
          year: user?.role === 'admin' ? '' : year,
          interests: user?.role === 'admin' ? '' : interests,
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
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      window.location.href = '/login';
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading your profile..." />;
  }

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isOrganiser = user.role === 'organiser';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ border: 'none', margin: '0 0 4px 0', padding: 0 }}>
            {isAdmin ? 'Administrator Profile' : 'User Profile'}
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {isAdmin
              ? 'Manage your campus administrative identity and credentials.'
              : 'Manage your campus identity, preferences, and club affiliation.'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Sign Out
        </Button>
      </div>

      <div className="grid-2">
        {/* Account Details Card */}
        <Card
          title="Account Details"
          subtitle={isAdmin ? 'Verified administrative identity & security clearance' : 'Your verified campus identity records'}
          padding="normal"
        >
          <table>
            <tbody>
              <tr>
                <td style={{ width: '40%', fontWeight: 600 }}>User ID:</td>
                <td><code>{user.id}</code></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Name:</td>
                <td>{user.name}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Email:</td>
                <td>{user.email}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Role:</td>
                <td>
                  <Badge variant={isAdmin ? 'danger' : 'neutral'} dot size="sm">
                    {isAdmin ? 'Administrator (Full Access)' : user.role}
                  </Badge>
                </td>
              </tr>

              {isOrganiser && (
                <tr>
                  <td style={{ fontWeight: 600 }}>Club Name:</td>
                  <td><strong>{user.clubName || 'N/A'}</strong></td>
                </tr>
              )}

              {isAdmin ? (
                <>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Privilege Level:</td>
                    <td>
                      <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>
                        ● Central University Authority
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Access Scope:</td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      Event Approval, Clash Overrides, Blackout Scheduling &amp; Audit Logs
                    </td>
                  </tr>
                </>
              ) : (
                <>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Verification Status:</td>
                    <td>
                      <Badge variant={user.isVerified ? 'success' : 'warning'} dot size="sm">
                        {user.isVerified ? 'Verified' : 'Pending Admin Verification'}
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Branch:</td>
                    <td>{user.branch || '(not set)'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Year:</td>
                    <td>{user.year || '(not set)'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Interests:</td>
                    <td>
                      {user.interests && user.interests.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {user.interests.map((tag) => (
                            <Badge key={tag} variant="info" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>(none)</span>
                      )}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </Card>

        {/* Edit Profile Card */}
        <Card
          title={isAdmin ? 'Administrator Settings' : 'Edit Profile'}
          subtitle={
            isAdmin
              ? 'Update administrator display name and contact profile'
              : 'Update student details and event interest tags'
          }
          padding="normal"
        >
          {message && (
            <div className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'}`} role="alert">
              <span>{isSuccess ? '✅' : '⚠️'}</span>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label htmlFor="edit-name">{isAdmin ? 'Administrator Display Name' : 'Name'}</label>
              <input
                id="edit-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {!isAdmin && (
              <>
                <div className="form-group">
                  <label htmlFor="edit-branch">Branch (e.g., Computer Science)</label>
                  <input
                    id="edit-branch"
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-year">Year (e.g., 3rd Year)</label>
                  <input
                    id="edit-year"
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-interests">Interests (comma separated, e.g. AI, Music, Sports)</label>
                  <input
                    id="edit-interests"
                    type="text"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={isSaving}
              style={{ width: '100%', marginTop: '8px' }}
            >
              Save Changes
            </Button>
          </form>

          {isAdmin && (
            <div style={{ marginTop: '20px', padding: '14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '18px' }}>🛡️</span>
                <strong style={{ color: '#9a3412', fontSize: '13.5px' }}>Central Admin Console</strong>
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: '#7c2d12', lineHeight: '1.5' }}>
                Manage campus events, approve or reject pending submissions, set exam blackout dates, and inspect audit logs.
              </p>
              <Link href="/admin" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                Open Admin Command Center &rarr;
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
