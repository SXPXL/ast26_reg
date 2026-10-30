import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AdminNavbar from '../components/AdminNavbar';
import {
  ShieldCheck,
  TrendingUp,
  Calendar,
  UserPlus,
  Users,
  Download,
  Plus,
  Edit2,
  Trash2,
  Lock,
  DollarSign,
  CheckCircle,
  Eye,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function AdminPage({ onBackToHome }) {
  const { user, login } = useAuth();

  // Login form state
  const [email, setEmail] = useState('admin@fest.com');
  const [password, setPassword] = useState('Admin@12345');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Admin View state
  const [activeAdminTab, setActiveAdminTab] = useState('stats'); // 'stats' | 'events' | 'volunteers' | 'registrations'
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Event Modal state (Create / Edit)
  const [eventModalOpen, setEventModalOpen] = useState(false);
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

  // Assign Volunteer Modal
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

  // Registrations Filter state
  const [regFilterEventId, setRegFilterEventId] = useState('');
  const [inspectRegistration, setInspectRegistration] = useState(null);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.id === '00000000-0000-0000-0000-000000000001')) {
      loadAdminData();
    }
  }, [user]);

  const handleAdminLogin = async (e) => {
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

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, eventsData, volunteersData, regsData] = await Promise.all([
        api.getOverviewStats().catch(() => null),
        api.getEvents({ include_inactive: true }).catch(() => []),
        api.getVolunteers().catch(() => []),
        api.getRegistrations().catch(() => []),
      ]);
      setStats(statsData);
      setEvents(eventsData || []);
      setVolunteers(volunteersData || []);
      setRegistrations(regsData || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Event Handlers
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
    setEventModalOpen(true);
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
    setEventModalOpen(true);
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

      setEventModalOpen(false);
      loadAdminData();
    } catch (err) {
      alert(`Failed to save event: ${err.message}`);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to deactivate this event?')) return;
    try {
      await api.deleteEvent(eventId);
      loadAdminData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Volunteer Handlers
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

  const handleOpenAssignModal = (ev) => {
    setSelectedEventForAssign(ev);
    // Pre-check already assigned volunteers
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
    } catch (err) {
      alert(`Error assigning volunteers: ${err.message}`);
    }
  };

  // Login View if not admin
  if (!user || (user.role !== 'ADMIN' && user.id !== '00000000-0000-0000-0000-000000000001')) {
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
            <ShieldCheck size={26} color="#D4AF37" />
          </div>

          <h2 className="font-display gold-text-glow" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
            Main Admin Console
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
            Sign in with administrator credentials to manage events, volunteers, and portal analytics.
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

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="neu-input"
                placeholder="admin@fest.com"
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
              {loginLoading ? 'Authenticating...' : 'Access Admin Dashboard'}
            </button>
          </form>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1.5rem', background: 'var(--bg-inset)', padding: '0.6rem', borderRadius: '8px' }}>
            Default test account: <code>admin@fest.com</code> / <code>Admin@12345</code>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard Main View
  return (
    <div>
      <AdminNavbar
        activeTab={activeAdminTab}
        setActiveTab={setActiveAdminTab}
        onSwitchToPublic={onBackToHome || (() => window.location.reload())}
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Sub-Header Breadcrumb */}
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
              Management Console
            </div>
            <h1 className="font-display gold-text-glow" style={{ fontSize: '2.2rem', fontWeight: '900' }}>
              {activeAdminTab === 'stats'
                ? 'ANALYTICS & OVERVIEW'
                : activeAdminTab === 'events'
                ? 'FESTIVAL EVENTS'
                : activeAdminTab === 'volunteers'
                ? 'VOLUNTEER ACCOUNTS'
                : 'REGISTRATIONS ROSTER'}
            </h1>
          </div>

          {/* Quick tab switcher buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'stats', label: 'Stats', icon: TrendingUp },
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'volunteers', label: 'Volunteers', icon: UserPlus },
              { id: 'registrations', label: 'Registrations', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveAdminTab(tab.id)}
                  className={`neu-btn ${activeAdminTab === tab.id ? 'active' : ''}`}
                  style={{ fontSize: '0.78rem', padding: '0.55rem 0.95rem' }}
                >
                  <Icon size={14} color={activeAdminTab === tab.id ? '#F5D77F' : 'currentColor'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      {/* TAB 1: ANALYTICS & STATS */}
      {activeAdminTab === 'stats' && (
        <div>
          {/* Top Metric Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}>
            <div className="neu-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Revenue</span>
                <DollarSign size={20} color="#D4AF37" />
              </div>
              <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--gold-bright)' }}>
                ₹{stats ? parseFloat(stats.total_revenue).toFixed(2) : '0.00'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Confirmed payments
              </div>
            </div>

            <div className="neu-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Registrations</span>
                <Users size={20} color="#3B82F6" />
              </div>
              <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-white)' }}>
                {stats ? stats.total_confirmed_registrations : 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {stats ? stats.total_participants : 0} total participants (with teammates)
              </div>
            </div>

            <div className="neu-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Checked-In (Present)</span>
                <CheckCircle size={20} color="#10B981" />
              </div>
              <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: '900', color: '#34D399' }}>
                {stats ? stats.total_checked_in : 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {stats && stats.total_confirmed_registrations > 0
                  ? `${((stats.total_checked_in / stats.total_confirmed_registrations) * 100).toFixed(1)}% Turnout rate`
                  : '0% Turnout'}
              </div>
            </div>

            <div className="neu-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Events</span>
                <Calendar size={20} color="#D4AF37" />
              </div>
              <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-white)' }}>
                {events.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {volunteers.length} registered volunteers
              </div>
            </div>
          </div>

          {/* Event-wise Analytics Cards */}
          <div className="neu-card" style={{ padding: '2rem' }}>
            <h3 className="font-display gold-text" style={{ fontSize: '1.3rem', marginBottom: '1.25rem' }}>
              Event-Wise Performance Metrics
            </h3>

            {stats && stats.event_stats && stats.event_stats.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {stats.event_stats.map((es) => (
                  <div key={es.event_id} style={{ background: 'var(--bg-inset)', padding: '1.25rem', borderRadius: '14px', boxShadow: 'var(--neu-shadow-inset)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-white)' }}>
                        {es.event_title}
                      </div>
                      <span className="neu-badge neu-badge-gold">{es.event_type}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      <span>Registrations: <strong>{es.confirmed_paid_registrations}</strong></span>
                      <span>Revenue: <strong>₹{parseFloat(es.total_revenue).toFixed(0)}</strong></span>
                      <span>Checked-In: <strong>{es.total_attended_count}</strong></span>
                    </div>

                    {/* Attendance Progress Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        <span>Check-In Rate</span>
                        <span>{es.attendance_rate}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(es.attendance_rate, 100)}%`, height: '100%', background: 'var(--gold-gradient)', borderRadius: '9999px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                No event data available yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EVENTS MANAGEMENT */}
      {activeAdminTab === 'events' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 className="font-display gold-text" style={{ fontSize: '1.3rem' }}>
              Fest Events ({events.length})
            </h3>
            <button onClick={handleOpenCreateEvent} className="neu-btn-gold">
              <Plus size={16} /> Create Event
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {events.map((ev) => (
              <div key={ev.id} className="neu-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span className="neu-badge neu-badge-gold">{ev.event_type}</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--gold-bright)' }}>
                      ₹{parseFloat(ev.registration_fee).toFixed(0)}
                    </span>
                  </div>

                  <h4 className="font-display" style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-white)', marginBottom: '0.4rem' }}>
                    {ev.title}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                    {ev.description}
                  </p>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
                    <div>📍 Venue: {ev.venue}</div>
                    <div>👥 Limits: {ev.min_team_size} - {ev.max_team_size} members</div>
                    <div>⏳ Date: {new Date(ev.event_date).toLocaleDateString()}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', flexWrap: 'wrap' }}>
                  <button onClick={() => handleOpenAssignModal(ev)} className="neu-btn" style={{ fontSize: '0.72rem', padding: '0.45rem 0.8rem' }}>
                    <UserPlus size={13} /> Assign Volunteers
                  </button>
                  <button onClick={() => handleOpenEditEvent(ev)} className="neu-btn" style={{ fontSize: '0.72rem', padding: '0.45rem 0.8rem' }}>
                    <Edit2 size={13} /> Edit
                  </button>
                  <button onClick={() => handleDeleteEvent(ev.id)} className="neu-btn" style={{ fontSize: '0.72rem', padding: '0.45rem 0.8rem', color: '#EF4444' }}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VOLUNTEERS */}
      {activeAdminTab === 'volunteers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Create Volunteer Form */}
          <div className="neu-card" style={{ padding: '2rem' }}>
            <h3 className="font-display gold-text" style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>
              Create Volunteer Account
            </h3>
            <form onSubmit={handleCreateVolunteer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Full Name *</label>
                <input
                  type="text"
                  value={newVolForm.full_name}
                  onChange={(e) => setNewVolForm({ ...newVolForm, full_name: e.target.value })}
                  className="neu-input"
                  placeholder="Volunteer Name"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Email Address *</label>
                <input
                  type="email"
                  value={newVolForm.email}
                  onChange={(e) => setNewVolForm({ ...newVolForm, email: e.target.value })}
                  className="neu-input"
                  placeholder="volunteer@fest.com"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Phone Number</label>
                <input
                  type="tel"
                  value={newVolForm.phone}
                  onChange={(e) => setNewVolForm({ ...newVolForm, phone: e.target.value })}
                  className="neu-input"
                  placeholder="10-digit phone"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Password *</label>
                <input
                  type="password"
                  value={newVolForm.password}
                  onChange={(e) => setNewVolForm({ ...newVolForm, password: e.target.value })}
                  className="neu-input"
                  placeholder="Password"
                  required
                />
              </div>

              <button type="submit" className="neu-btn-gold" style={{ marginTop: '0.5rem' }}>
                <UserPlus size={16} /> Register Volunteer
              </button>
            </form>
          </div>

          {/* Volunteers List */}
          <div className="neu-card" style={{ padding: '2rem' }}>
            <h3 className="font-display gold-text" style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>
              Registered Volunteers ({volunteers.length})
            </h3>

            {volunteers.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)' }}>No volunteers registered yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {volunteers.map((vol) => (
                  <div key={vol.id} style={{ background: 'var(--bg-inset)', padding: '1rem', borderRadius: '12px', boxShadow: 'var(--neu-shadow-inset)' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-white)' }}>
                      {vol.full_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {vol.email} {vol.phone ? `• ${vol.phone}` : ''}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Assigned Events:{' '}
                      {vol.assigned_events && vol.assigned_events.length > 0 ? (
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                          {vol.assigned_events.map((evName, idx) => (
                            <span key={idx} className="neu-badge neu-badge-gold">
                              {evName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontStyle: 'italic' }}>None assigned</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ALL REGISTRATIONS & CSV EXPORT */}
      {activeAdminTab === 'registrations' && (
        <div className="neu-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 className="font-display gold-text" style={{ fontSize: '1.3rem' }}>
              Registrations & Participants Roster ({registrations.length})
            </h3>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                value={regFilterEventId}
                onChange={(e) => setRegFilterEventId(e.target.value)}
                className="neu-input"
                style={{ width: '220px', fontSize: '0.8rem', padding: '0.55rem' }}
              >
                <option value="">All Events</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>

              {regFilterEventId && (
                <a
                  href={api.getExportUrl(regFilterEventId)}
                  download
                  className="neu-btn-gold"
                  style={{ fontSize: '0.75rem', padding: '0.55rem 1rem', textDecoration: 'none' }}
                >
                  <Download size={14} /> Export Event CSV
                </a>
              )}
            </div>
          </div>

          {registrations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              No registrations recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--gold-bright)' }}>
                    <th style={{ padding: '0.75rem' }}>Code</th>
                    <th style={{ padding: '0.75rem' }}>Event</th>
                    <th style={{ padding: '0.75rem' }}>Participant / Team</th>
                    <th style={{ padding: '0.75rem' }}>Contact</th>
                    <th style={{ padding: '0.75rem' }}>College</th>
                    <th style={{ padding: '0.75rem' }}>Payment</th>
                    <th style={{ padding: '0.75rem' }}>Attendance</th>
                    <th style={{ padding: '0.75rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations
                    .filter((r) => !regFilterEventId || r.event_id === regFilterEventId)
                    .map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td className="font-mono" style={{ padding: '0.75rem', color: 'var(--gold-light)', fontWeight: '700' }}>
                          {r.registration_code}
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: '600' }}>{r.event_title}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-white)' }}>{r.primary_name}</div>
                          {r.team_name && <div style={{ fontSize: '0.72rem', color: 'var(--gold-bright)' }}>Team: {r.team_name}</div>}
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                          <div>{r.primary_phone}</div>
                          <div style={{ fontSize: '0.72rem' }}>{r.primary_email}</div>
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                          {r.college_name} ({r.department})
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`neu-badge ${r.payment_status === 'SUCCESS' ? 'neu-badge-green' : 'neu-badge-red'}`}>
                            {r.payment_status} (₹{parseFloat(r.total_amount).toFixed(0)})
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`neu-badge ${r.attendance_status === 'PRESENT' ? 'neu-badge-green' : 'neu-badge-gold'}`}>
                            {r.attendance_status === 'PRESENT' ? 'PRESENT' : 'NOT ATTENDED'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <button
                            onClick={() => {
                              setInspectRegistration(r);
                            }}
                            className="neu-btn"
                            style={{ fontSize: '0.72rem', padding: '0.4rem 0.7rem' }}
                          >
                            <Eye size={13} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* EVENT CREATE/EDIT MODAL */}
      {eventModalOpen && (
        <div className="modal-overlay" onClick={() => setEventModalOpen(false)}>
          <div className="neu-card" style={{ maxWidth: '640px', width: '100%', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 className="font-display gold-text" style={{ fontSize: '1.4rem' }}>
                {editingEvent ? 'Edit Event' : 'Create New Fest Event'}
              </h3>
              <button onClick={() => setEventModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
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
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Min Team Size</label>
                  <input
                    type="number"
                    min="1"
                    disabled={eventForm.event_type === 'INDIVIDUAL'}
                    value={eventForm.event_type === 'INDIVIDUAL' ? 1 : eventForm.min_team_size}
                    onChange={(e) => setEventForm({ ...eventForm, min_team_size: parseInt(e.target.value) || 1 })}
                    className="neu-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Max Team Size</label>
                  <input
                    type="number"
                    min="1"
                    disabled={eventForm.event_type === 'INDIVIDUAL'}
                    value={eventForm.event_type === 'INDIVIDUAL' ? 1 : eventForm.max_team_size}
                    onChange={(e) => setEventForm({ ...eventForm, max_team_size: parseInt(e.target.value) || 1 })}
                    className="neu-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={eventForm.registration_fee}
                    onChange={(e) => setEventForm({ ...eventForm, registration_fee: e.target.value })}
                    className="neu-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Max Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={eventForm.max_capacity}
                    onChange={(e) => setEventForm({ ...eventForm, max_capacity: e.target.value })}
                    className="neu-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Venue *</label>
                  <input
                    type="text"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    className="neu-input"
                    placeholder="Auditorium / Lab"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Registration Deadline *</label>
                  <input
                    type="datetime-local"
                    value={eventForm.registration_deadline}
                    onChange={(e) => setEventForm({ ...eventForm, registration_deadline: e.target.value })}
                    className="neu-input"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Event Date *</label>
                  <input
                    type="datetime-local"
                    value={eventForm.event_date}
                    onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                    className="neu-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Rules & Guidelines</label>
                <textarea
                  value={eventForm.rules}
                  onChange={(e) => setEventForm({ ...eventForm, rules: e.target.value })}
                  className="neu-input"
                  rows={2}
                  placeholder="1. Max team size is 4..."
                />
              </div>

              <button type="submit" className="neu-btn-gold" style={{ marginTop: '0.5rem' }}>
                {editingEvent ? 'Update Event' : 'Create Event'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN VOLUNTEERS MODAL */}
      {assignModalOpen && selectedEventForAssign && (
        <div className="modal-overlay" onClick={() => setAssignModalOpen(false)}>
          <div className="neu-card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display gold-text" style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>
              Assign Volunteers
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
              Select volunteers to grant check-in access for <strong>{selectedEventForAssign.title}</strong>.
            </p>

            {volunteers.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No volunteers registered. Create some first.</div>
            ) : (
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
                        borderRadius: '8px',
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
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button onClick={() => setAssignModalOpen(false)} className="neu-btn">
                Cancel
              </button>
              <button onClick={handleSaveVolunteerAssignment} className="neu-btn-gold">
                Save Assignments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT REGISTRATION MODAL */}
      {inspectRegistration && (
        <div className="modal-overlay" onClick={() => setInspectRegistration(null)}>
          <div className="neu-card" style={{ maxWidth: '560px', width: '100%', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 className="font-display gold-text" style={{ fontSize: '1.3rem' }}>
                Registration Pass
              </h3>
              <button onClick={() => setInspectRegistration(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>
                ×
              </button>
            </div>

            <div style={{ background: 'var(--bg-inset)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code: <strong style={{ color: 'var(--gold-bright)' }}>{inspectRegistration.registration_code}</strong></div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-white)', marginTop: '0.2rem' }}>{inspectRegistration.primary_name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{inspectRegistration.college_name} ({inspectRegistration.department}, {inspectRegistration.year_of_study})</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{inspectRegistration.primary_email} • {inspectRegistration.primary_phone}</div>
            </div>

            {inspectRegistration.team_members && inspectRegistration.team_members.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--gold-bright)', marginBottom: '0.5rem' }}>
                  Team Members ({inspectRegistration.team_members.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {inspectRegistration.team_members.map((m, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-inset)', padding: '0.65rem', borderRadius: '8px', fontSize: '0.8rem' }}>
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
    </div>
  );
}

