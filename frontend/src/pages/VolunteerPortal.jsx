import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle,
  Clock,
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Download,
  AlertCircle,
  Eye,
  Lock,
} from 'lucide-react';

export default function VolunteerPortal({ activeSection = 'status' }) {
  const { user, login } = useAuth();

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Volunteer & Event data
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [inspectRegistration, setInspectRegistration] = useState(null);

  // Admin section states
  const [allEvents, setAllEvents] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [stats, setStats] = useState(null);

  // Create Event Form state
  const [createEventModal, setCreateEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    slug: '',
    description: '',
    event_type: 'INDIVIDUAL',
    min_team_size: 1,
    max_team_size: 1,
    registration_fee: 0,
    max_capacity: 100,
    registration_deadline: '',
    event_date: '',
    venue: '',
    rules: '',
    is_active: true,
  });

  // Assign Volunteer Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedEventForAssign, setSelectedEventForAssign] = useState(null);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState([]);

  // Create Volunteer Form state
  const [newVolForm, setNewVolForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
  });

  const isAdmin = user && (user.role === 'ADMIN' || user.id === '00000000-0000-0000-0000-000000000001');

  useEffect(() => {
    if (user) {
      loadVolunteerData();
      if (isAdmin) {
        loadAdminData();
      }
    }
  }, [user]);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventRegistrations(selectedEventId);
    }
  }, [selectedEventId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoginLoading(true);
      setLoginError(null);
      await login(username, password);
    } catch (err) {
      setLoginError(err.message || 'Login failed. Check username and password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const loadVolunteerData = async () => {
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

  const loadAdminData = async () => {
    try {
      const [allEvs, vols, overviewStats] = await Promise.all([
        api.getEvents({ is_active: undefined }).catch(() => []),
        api.getVolunteers().catch(() => []),
        api.getOverviewStats().catch(() => null),
      ]);
      setAllEvents(allEvs || []);
      setVolunteers(vols || []);
      setStats(overviewStats);
    } catch (err) {
      console.error('Failed to load admin data:', err);
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
      setRegistrations((prev) =>
        prev.map((item) =>
          item.id === reg.id
            ? { ...item, attendance_status: updated.attendance_status, attended_at: updated.attended_at }
            : item
        )
      );
    } catch (err) {
      alert(`Attendance update error: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Event creation & editing
  const handleOpenCreateEvent = () => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      slug: '',
      description: '',
      event_type: 'INDIVIDUAL',
      min_team_size: 1,
      max_team_size: 1,
      registration_fee: 0,
      max_capacity: 100,
      registration_deadline: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 16),
      event_date: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 16),
      venue: '',
      rules: '',
      is_active: true,
    });
    setCreateEventModal(true);
  };

  const handleOpenEditEvent = (ev) => {
    setEditingEvent(ev);
    setEventForm({
      title: ev.title,
      slug: ev.slug,
      description: ev.description,
      event_type: ev.event_type,
      min_team_size: ev.min_team_size,
      max_team_size: ev.max_team_size,
      registration_fee: ev.registration_fee,
      max_capacity: ev.max_capacity || 100,
      registration_deadline: new Date(ev.registration_deadline).toISOString().slice(0, 16),
      event_date: new Date(ev.event_date).toISOString().slice(0, 16),
      venue: ev.venue,
      rules: ev.rules || '',
      is_active: ev.is_active,
    });
    setCreateEventModal(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...eventForm,
        registration_fee: parseFloat(eventForm.registration_fee),
        min_team_size: eventForm.event_type === 'INDIVIDUAL' ? 1 : parseInt(eventForm.min_team_size),
        max_team_size: eventForm.event_type === 'INDIVIDUAL' ? 1 : parseInt(eventForm.max_team_size),
        max_capacity: parseInt(eventForm.max_capacity) || null,
        registration_deadline: new Date(eventForm.registration_deadline).toISOString(),
        event_date: new Date(eventForm.event_date).toISOString(),
      };

      if (editingEvent) {
        await api.updateEvent(editingEvent.id, payload);
      } else {
        await api.createEvent(payload);
      }

      setCreateEventModal(false);
      loadAdminData();
      loadVolunteerData();
    } catch (err) {
      alert(`Failed to save event: ${err.message}`);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete/deactivate this event?')) return;
    try {
      await api.deleteEvent(eventId);
      loadAdminData();
      loadVolunteerData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Volunteer creation
  const handleCreateVolunteer = async (e) => {
    e.preventDefault();
    try {
      await api.createVolunteer(newVolForm);
      setNewVolForm({ full_name: '', email: '', phone: '', password: '' });
      alert('Volunteer created successfully!');
      loadAdminData();
    } catch (err) {
      alert(`Error creating volunteer: ${err.message}`);
    }
  };

  // Assign volunteer to event
  const handleOpenAssignModal = (ev) => {
    setSelectedEventForAssign(ev);
    const assignedIds = volunteers
      .filter((v) => v.assigned_event_ids && v.assigned_event_ids.includes(ev.id))
      .map((v) => v.id);
    setSelectedVolunteerIds(assignedIds);
    setAssignModalOpen(true);
  };

  const handleSaveVolunteerAssignment = async () => {
    if (!selectedEventForAssign) return;
    try {
      await api.assignVolunteers(selectedEventForAssign.id, selectedVolunteerIds);
      setAssignModalOpen(false);
      loadAdminData();
      loadVolunteerData();
    } catch (err) {
      alert(`Error assigning volunteers: ${err.message}`);
    }
  };

  // Filter registrations in event status view
  const filteredRegistrations = registrations.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.primary_name?.toLowerCase().includes(term) ||
      r.registration_code?.toLowerCase().includes(term) ||
      r.primary_phone?.includes(term) ||
      (r.team_name && r.team_name.toLowerCase().includes(term))
    );
  });

  const attendedCount = registrations.filter((r) => r.attendance_status === 'PRESENT').length;

  // 1. SIGN IN SCREEN IF NOT AUTHENTICATED
  if (!user) {
    return (
      <div style={{ maxWidth: '440px', margin: '5rem auto', padding: '0 1.5rem' }}>
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '24px',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            boxShadow: 'var(--neu-shadow-raised)',
            padding: '2.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'var(--bg-inset)',
              boxShadow: 'var(--neu-shadow-inset)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <Lock size={22} color="#D4AF37" />
          </div>

          <h2 className="font-display gold-text-glow" style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            Volunteer Portal
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
            Sign in with your event credentials to manage attendee check-ins.
          </p>

          {loginError && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#F87171',
                fontSize: '0.82rem',
                marginBottom: '1.25rem',
              }}
            >
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Username</label>
              <input
                type="text"
                placeholder="Username (e.g. volunteer or admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="neu-input"
                required
              />
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="neu-input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="neu-btn-gold"
              style={{ marginTop: '0.5rem', width: '100%', padding: '0.85rem' }}
            >
              {loginLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. LOGGED IN PORTAL VIEWS
  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>
      {/* SECTION: VIEW EVENT STATUS (Default for normal volunteers & admin) */}
      {activeSection === 'status' && (
        <div>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 className="font-display gold-text-glow" style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: 1.2 }}>
              Event Status
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Select your assigned event to view registrations and check in attendees.
            </p>
          </div>

          {assignedEvents.length === 0 ? (
            <div
              style={{
                padding: '3rem',
                textAlign: 'center',
                background: 'var(--bg-card)',
                borderRadius: '20px',
                border: '1px solid rgba(212, 175, 55, 0.2)',
              }}
            >
              <AlertCircle size={32} color="#D4AF37" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-white)' }}>
                No Events Assigned Yet
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Please contact the main admin to assign you to an event desk.
              </p>
            </div>
          ) : (
            <div>
              {/* Event Selector Tabs */}
              <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                {assignedEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEventId(ev.id)}
                    className={`neu-btn ${selectedEventId === ev.id ? 'active' : ''}`}
                    style={{
                      padding: '0.75rem 1.4rem',
                      whiteSpace: 'nowrap',
                      textAlign: 'left',
                      borderRadius: '14px',
                    }}
                  >
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{ev.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ev.venue}</div>
                  </button>
                ))}
              </div>

              {/* Turnout Summary Bar */}
              <div
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  padding: '1.25rem 1.5rem',
                  borderRadius: '16px',
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(212, 175, 55, 0.15)',
                  boxShadow: 'var(--neu-shadow-flat)',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registered</div>
                  <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-white)' }}>
                    {registrations.length}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Checked In</div>
                  <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#34D399' }}>
                    {attendedCount} / {registrations.length}
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search code, participant name, phone, team..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="neu-input"
                  style={{ paddingLeft: '2.8rem' }}
                />
              </div>

              {/* Attendees List */}
              {loading ? (
                <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--gold-bright)' }}>
                  Loading registrations...
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div
                  style={{
                    padding: '2.5rem',
                    textAlign: 'center',
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  No participants registered yet or no match found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {filteredRegistrations.map((reg) => {
                    const isPresent = reg.attendance_status === 'PRESENT';
                    return (
                      <div
                        key={reg.id}
                        style={{
                          background: 'var(--bg-card)',
                          borderRadius: '16px',
                          border: '1px solid rgba(212, 175, 55, 0.2)',
                          boxShadow: 'var(--neu-shadow-flat)',
                          padding: '1.25rem 1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '1rem',
                          borderLeft: isPresent ? '4px solid #10B981' : '4px solid rgba(212, 175, 55, 0.4)',
                        }}
                      >
                        {/* Participant info */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                            <span
                              className="font-mono"
                              style={{
                                fontSize: '0.9rem',
                                fontWeight: '700',
                                color: 'var(--gold-bright)',
                                background: 'var(--bg-inset)',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                              }}
                            >
                              {reg.registration_code}
                            </span>
                            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-white)' }}>
                              {reg.primary_name}
                            </span>
                            {reg.team_name && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--gold-light)', background: 'rgba(212, 175, 55, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                                Team: {reg.team_name}
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                            <span>📞 {reg.primary_phone}</span>
                            <span>🏫 {reg.college_name} ({reg.department})</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <button
                            onClick={async () => {
                              const full = await api.getRegistration(reg.id);
                              setInspectRegistration(full);
                            }}
                            className="neu-btn"
                            style={{ fontSize: '0.78rem', padding: '0.55rem 0.85rem' }}
                          >
                            <Eye size={14} /> Details
                          </button>

                          <button
                            onClick={() => handleToggleAttendance(reg)}
                            disabled={updatingId === reg.id}
                            className={isPresent ? 'neu-btn' : 'neu-btn-gold'}
                            style={{
                              padding: '0.65rem 1.35rem',
                              fontSize: '0.82rem',
                              background: isPresent ? 'rgba(16, 185, 129, 0.15)' : undefined,
                              borderColor: isPresent ? '#10B981' : undefined,
                              color: isPresent ? '#34D399' : undefined,
                            }}
                          >
                            {updatingId === reg.id ? (
                              'Updating...'
                            ) : isPresent ? (
                              <>
                                <CheckCircle size={15} /> Present (Undo)
                              </>
                            ) : (
                              'Mark Present'
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
        </div>
      )}

      {/* ADMIN SECTION: CREATE & MANAGE EVENTS */}
      {activeSection === 'events' && isAdmin && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 className="font-display gold-text-glow" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
                Manage Events
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Create, update, or assign volunteers to Asthra 26 events.
              </p>
            </div>

            <button onClick={handleOpenCreateEvent} className="neu-btn-gold">
              <Plus size={16} /> Create Event
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {allEvents.map((ev) => (
              <div
                key={ev.id}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '20px',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--neu-shadow-flat)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 className="font-display gold-text" style={{ fontSize: '1.3rem', fontWeight: '700' }}>
                      {ev.title}
                    </h3>
                    <span className="font-mono" style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--gold-bright)' }}>
                      ₹{parseFloat(ev.registration_fee || 0).toFixed(0)}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {ev.description}
                  </p>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.25rem' }}>
                    <div>📍 {ev.venue}</div>
                    <div>👥 {ev.event_type} {ev.event_type === 'TEAM' && `(${ev.min_team_size}-${ev.max_team_size})`}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', flexWrap: 'wrap' }}>
                  <button onClick={() => handleOpenAssignModal(ev)} className="neu-btn" style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem' }}>
                    Assign Volunteer
                  </button>
                  <button onClick={() => handleOpenEditEvent(ev)} className="neu-btn" style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem' }}>
                    <Edit2 size={13} /> Edit
                  </button>
                  <button onClick={() => handleDeleteEvent(ev.id)} className="neu-btn" style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem', color: '#EF4444' }}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADMIN SECTION: VOLUNTEER ACCOUNTS */}
      {activeSection === 'volunteers' && isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Create Volunteer */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid rgba(212, 175, 55, 0.2)', padding: '2rem' }}>
            <h2 className="font-display gold-text-glow" style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1rem' }}>
              Create Volunteer Account
            </h2>

            <form onSubmit={handleCreateVolunteer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Full Name *</label>
                <input
                  type="text"
                  placeholder="Volunteer Name"
                  value={newVolForm.full_name}
                  onChange={(e) => setNewVolForm({ ...newVolForm, full_name: e.target.value })}
                  className="neu-input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Email Address *</label>
                <input
                  type="email"
                  placeholder="volunteer@fest.com"
                  value={newVolForm.email}
                  onChange={(e) => setNewVolForm({ ...newVolForm, email: e.target.value })}
                  className="neu-input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="Phone"
                  value={newVolForm.phone}
                  onChange={(e) => setNewVolForm({ ...newVolForm, phone: e.target.value })}
                  className="neu-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Password *</label>
                <input
                  type="password"
                  placeholder="Password"
                  value={newVolForm.password}
                  onChange={(e) => setNewVolForm({ ...newVolForm, password: e.target.value })}
                  className="neu-input"
                  required
                />
              </div>

              <button type="submit" className="neu-btn-gold" style={{ marginTop: '0.5rem' }}>
                Register Volunteer
              </button>
            </form>
          </div>

          {/* Volunteer Roster */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid rgba(212, 175, 55, 0.2)', padding: '2rem' }}>
            <h2 className="font-display gold-text-glow" style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1rem' }}>
              Volunteers ({volunteers.length})
            </h2>

            {volunteers.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)' }}>No volunteers registered yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {volunteers.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      background: 'var(--bg-inset)',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-white)' }}>
                      {v.full_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {v.email} {v.phone && `• ${v.phone}`}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      Assigned:{' '}
                      {v.assigned_events && v.assigned_events.length > 0 ? (
                        v.assigned_events.join(', ')
                      ) : (
                        <span style={{ fontStyle: 'italic' }}>None</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN SECTION: ANALYTICS & OVERVIEW */}
      {activeSection === 'stats' && isAdmin && (
        <div>
          <h1 className="font-display gold-text-glow" style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '2rem' }}>
            Analytics & Overview
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Revenue</div>
              <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--gold-bright)', marginTop: '0.25rem' }}>
                ₹{stats ? parseFloat(stats.total_revenue || 0).toFixed(0) : '0'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Registrations</div>
              <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-white)', marginTop: '0.25rem' }}>
                {stats ? stats.total_confirmed_registrations : 0}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Checked In</div>
              <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: '800', color: '#34D399', marginTop: '0.25rem' }}>
                {stats ? stats.total_checked_in : 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT EVENT */}
      {createEventModal && (
        <div
          onClick={() => setCreateEventModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3,3,5,0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              maxWidth: '600px',
              width: '100%',
              padding: '2rem',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 className="font-display gold-text" style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h3>

            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Event Title *</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setEventForm({ ...eventForm, title, slug: editingEvent ? eventForm.slug : slug });
                  }}
                  className="neu-input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>URL Slug *</label>
                <input
                  type="text"
                  value={eventForm.slug}
                  onChange={(e) => setEventForm({ ...eventForm, slug: e.target.value })}
                  className="neu-input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Description *</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="neu-input"
                  rows={3}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Event Type</label>
                  <select
                    value={eventForm.event_type}
                    onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                    className="neu-input"
                  >
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="TEAM">Team</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Registration Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={eventForm.registration_fee}
                    onChange={(e) => setEventForm({ ...eventForm, registration_fee: e.target.value })}
                    className="neu-input"
                  />
                </div>
              </div>

              {eventForm.event_type === 'TEAM' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Min Team Size</label>
                    <input
                      type="number"
                      min="1"
                      value={eventForm.min_team_size}
                      onChange={(e) => setEventForm({ ...eventForm, min_team_size: e.target.value })}
                      className="neu-input"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Max Team Size</label>
                    <input
                      type="number"
                      min="1"
                      value={eventForm.max_team_size}
                      onChange={(e) => setEventForm({ ...eventForm, max_team_size: e.target.value })}
                      className="neu-input"
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Venue *</label>
                  <input
                    type="text"
                    placeholder="e.g. Auditorium"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    className="neu-input"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Event Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={eventForm.event_date}
                    onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                    className="neu-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setCreateEventModal(false)} className="neu-btn">
                  Cancel
                </button>
                <button type="submit" className="neu-btn-gold">
                  {editingEvent ? 'Update Event' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN VOLUNTEERS */}
      {assignModalOpen && selectedEventForAssign && (
        <div
          onClick={() => setAssignModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3,3,5,0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              maxWidth: '460px',
              width: '100%',
              padding: '2rem',
            }}
          >
            <h3 className="font-display gold-text" style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>
              Assign Volunteers
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Select volunteers for <strong>{selectedEventForAssign.title}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '250px', overflowY: 'auto', marginBottom: '1.5rem' }}>
              {volunteers.map((vol) => {
                const isChecked = selectedVolunteerIds.includes(vol.id);
                return (
                  <label
                    key={vol.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      background: 'var(--bg-inset)',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedVolunteerIds([...selectedVolunteerIds, vol.id]);
                        } else {
                          setSelectedVolunteerIds(selectedVolunteerIds.filter((id) => id !== vol.id));
                        }
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-white)' }}>{vol.full_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{vol.email}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button onClick={() => setAssignModalOpen(false)} className="neu-btn">
                Cancel
              </button>
              <button onClick={handleSaveVolunteerAssignment} className="neu-btn-gold">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT REGISTRATION / TEAM */}
      {inspectRegistration && (
        <div
          onClick={() => setInspectRegistration(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3,3,5,0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              maxWidth: '520px',
              width: '100%',
              padding: '2rem',
            }}
          >
            <h3 className="font-display gold-text" style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>
              Registration Details
            </h3>

            <div style={{ background: 'var(--bg-inset)', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Code: <strong style={{ color: 'var(--gold-bright)' }}>{inspectRegistration.registration_code}</strong>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-white)', marginTop: '0.2rem' }}>
                {inspectRegistration.primary_name}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {inspectRegistration.college_name} ({inspectRegistration.department}, {inspectRegistration.year_of_study})
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {inspectRegistration.primary_email} • {inspectRegistration.primary_phone}
              </div>
            </div>

            {inspectRegistration.team_members && inspectRegistration.team_members.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--gold-bright)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Teammates ({inspectRegistration.team_members.length})
                </div>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setInspectRegistration(null)} className="neu-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
