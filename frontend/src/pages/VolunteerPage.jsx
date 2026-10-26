import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UserCheck,
  Search,
  CheckCircle,
  Clock,
  Users,
  Lock,
  Calendar,
  MapPin,
  RefreshCw,
  Eye,
  AlertCircle,
} from 'lucide-react';

export default function VolunteerPage() {
  const { user, login } = useAuth();

  // Login form state
  const [email, setEmail] = useState('volunteer@fest.com');
  const [password, setPassword] = useState('Volunteer@12345');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Volunteer Dashboard State
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PRESENT, NOT_ATTENDED
  const [updatingId, setUpdatingId] = useState(null);
  const [inspectRegistration, setInspectRegistration] = useState(null);

  useEffect(() => {
    if (user) {
      fetchVolunteerEvents();
    }
  }, [user]);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventRegistrations(selectedEventId);
    }
  }, [selectedEventId]);

  const handleVolunteerLogin = async (e) => {
    e.preventDefault();
    try {
      setLoginLoading(true);
      setLoginError(null);
      await login(email, password);
    } catch (err) {
      setLoginError(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchVolunteerEvents = async () => {
    try {
      setLoading(true);
      const events = await api.getMyEvents();
      setAssignedEvents(events || []);
      if (events && events.length > 0) {
        setSelectedEventId(events[0].id);
      }
    } catch (err) {
      console.error('Failed to load volunteer events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventRegistrations = async (eventId) => {
    try {
      setLoading(true);
      const data = await api.getRegistrations({ event_id: eventId });
      setRegistrations(data || []);
    } catch (err) {
      console.error('Failed to load registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAttendance = async (reg) => {
    const nextStatus = reg.attendance_status === 'PRESENT' ? 'NOT_ATTENDED' : 'PRESENT';
    try {
      setUpdatingId(reg.id);
      const updated = await api.updateAttendance(reg.id, nextStatus);
      // Update in local state
      setRegistrations((prev) =>
        prev.map((item) => (item.id === reg.id ? { ...item, attendance_status: updated.attendance_status, attended_at: updated.attended_at } : item))
      );
    } catch (err) {
      alert(`Attendance update error: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter registrations
  const filteredRegistrations = registrations.filter((r) => {
    const matchesSearch =
      r.primary_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.registration_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.primary_phone.includes(searchTerm) ||
      (r.team_name && r.team_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PRESENT' && r.attendance_status === 'PRESENT') ||
      (statusFilter === 'NOT_ATTENDED' && r.attendance_status !== 'PRESENT');

    return matchesSearch && matchesStatus;
  });

  const attendedCount = registrations.filter((r) => r.attendance_status === 'PRESENT').length;

  // Not Logged In View
  if (!user) {
    return (
      <div style={{ maxWidth: '480px', margin: '3rem auto', padding: '1.5rem' }}>
        <div className="neu-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'var(--bg-inset)',
            boxShadow: 'var(--neu-shadow-inset)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <Lock size={24} color="#D4AF37" />
          </div>

          <h2 className="font-display gold-text-glow" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
            Volunteer Check-in Portal
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
            Sign in with your assigned volunteer credentials to scan and check-in participants.
          </p>

          {loginError && (
            <div style={{
              padding: '0.75rem',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#F87171',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
            }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleVolunteerLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Volunteer Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="neu-input"
                placeholder="volunteer@fest.com"
                required
              />
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="neu-input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="neu-btn-gold"
              style={{ marginTop: '0.75rem', width: '100%' }}
            >
              {loginLoading ? 'Signing In...' : 'Access Volunteer Desk'}
            </button>
          </form>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1.5rem', background: 'var(--bg-inset)', padding: '0.6rem', borderRadius: '8px' }}>
            Default test account: <code>volunteer@fest.com</code> / <code>Volunteer@12345</code>
          </div>
        </div>
      </div>
    );
  }

  // Active Volunteer Desk View
  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.2em', color: 'var(--gold-bright)', textTransform: 'uppercase', fontWeight: '700' }}>
            Desk Operations
          </div>
          <h1 className="font-display gold-text-glow" style={{ fontSize: '2.2rem', fontWeight: '900' }}>
            VOLUNTEER CHECK-IN
          </h1>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Logged in as <strong>{user.full_name}</strong> ({user.email})
          </div>
        </div>

        <button
          onClick={() => selectedEventId && fetchEventRegistrations(selectedEventId)}
          className="neu-btn"
          style={{ fontSize: '0.8rem' }}
        >
          <RefreshCw size={15} /> Refresh Roster
        </button>
      </div>

      {/* Assigned Events Switcher */}
      {assignedEvents.length === 0 ? (
        <div className="neu-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertCircle size={36} color="#D4AF37" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Events Assigned Yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Ask the Main Admin to assign you to events from the Admin Panel.
          </p>
        </div>
      ) : (
        <div>
          {/* Event Selector Tabs */}
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
            {assignedEvents.map((ev) => (
              <button
                key={ev.id}
                onClick={() => setSelectedEventId(ev.id)}
                className={`neu-btn ${selectedEventId === ev.id ? 'active' : ''}`}
                style={{ padding: '0.75rem 1.25rem', whiteSpace: 'nowrap', textAlign: 'left' }}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{ev.title}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ev.event_type} • {ev.venue}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Quick Metrics Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}>
            <div className="neu-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} color="#D4AF37" />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Registrations</div>
                <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-white)' }}>
                  {registrations.length}
                </div>
              </div>
            </div>

            <div className="neu-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={20} color="#10B981" />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Checked-In (Present)</div>
                <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#34D399' }}>
                  {attendedCount} / {registrations.length}
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
            padding: '1rem',
            borderRadius: '14px',
            background: 'var(--bg-card)',
            boxShadow: 'var(--neu-shadow-flat)',
          }}>
            <div style={{ position: 'relative', flex: '1 1 300px' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search participant name, phone, code (e.g. ATHRA-2026), team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="neu-input"
                style={{ paddingLeft: '2.8rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['ALL', 'NOT_ATTENDED', 'PRESENT'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`neu-btn ${statusFilter === filter ? 'active' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.9rem' }}
                >
                  {filter === 'ALL' ? 'All' : filter === 'PRESENT' ? 'Checked-In' : 'Pending Check-in'}
                </button>
              ))}
            </div>
          </div>

          {/* Registrations List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gold-bright)' }}>
              Loading registrations...
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="neu-card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No registrations found matching search query.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredRegistrations.map((reg) => {
                const isPresent = reg.attendance_status === 'PRESENT';
                return (
                  <div
                    key={reg.id}
                    className="neu-card"
                    style={{
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      borderLeft: isPresent ? '4px solid #10B981' : '4px solid #D4AF37',
                    }}
                  >
                    {/* Participant Details */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                        <span className="font-mono" style={{
                          fontSize: '0.95rem',
                          fontWeight: '800',
                          color: 'var(--gold-bright)',
                          background: 'var(--bg-inset)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                        }}>
                          {reg.registration_code}
                        </span>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-white)' }}>
                          {reg.primary_name}
                        </div>
                        {reg.team_name && (
                          <div className="neu-badge neu-badge-gold">
                            Team: {reg.team_name}
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span>📞 {reg.primary_phone}</span>
                        <span>✉️ {reg.primary_email}</span>
                        <span>🏫 {reg.college_name} ({reg.department})</span>
                      </div>
                    </div>

                    {/* Actions: View Details & Mark Attendance */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        onClick={async () => {
                          const full = await api.getRegistration(reg.id);
                          setInspectRegistration(full);
                        }}
                        className="neu-btn"
                        style={{ fontSize: '0.75rem', padding: '0.55rem 0.85rem' }}
                        title="View Teammates & Info"
                      >
                        <Eye size={15} /> Details
                      </button>

                      <button
                        onClick={() => handleToggleAttendance(reg)}
                        disabled={updatingId === reg.id}
                        className={isPresent ? 'neu-btn' : 'neu-btn-gold'}
                        style={{
                          padding: '0.65rem 1.4rem',
                          fontSize: '0.8rem',
                          background: isPresent ? 'rgba(16, 185, 129, 0.15)' : undefined,
                          borderColor: isPresent ? '#10B981' : undefined,
                          color: isPresent ? '#34D399' : undefined,
                        }}
                      >
                        {updatingId === reg.id ? (
                          'Updating...'
                        ) : isPresent ? (
                          <>
                            <CheckCircle size={16} /> Present (Click to Undo)
                          </>
                        ) : (
                          <>
                            <UserCheck size={16} /> Mark Present
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Teammate & Info Inspection Modal */}
      {inspectRegistration && (
        <div className="modal-overlay" onClick={() => setInspectRegistration(null)}>
          <div className="neu-card" style={{ maxWidth: '580px', width: '100%', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 className="font-display gold-text" style={{ fontSize: '1.4rem' }}>
                Registration Details
              </h3>
              <button
                onClick={() => setInspectRegistration(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '1rem', background: 'var(--bg-inset)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code: <strong>{inspectRegistration.registration_code}</strong></div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-white)' }}>{inspectRegistration.primary_name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{inspectRegistration.college_name} ({inspectRegistration.department}, {inspectRegistration.year_of_study})</div>
            </div>

            {inspectRegistration.team_members && inspectRegistration.team_members.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--gold-bright)', marginBottom: '0.5rem' }}>
                  Team Members ({inspectRegistration.team_members.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {inspectRegistration.team_members.map((m, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-inset)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-white)' }}>{m.full_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.email} • {m.phone}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
