import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import DigitalTicketPass from '../components/DigitalTicketPass';
import EventDetailModal from '../components/EventDetailModal';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Award,
  Sparkles,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  CreditCard,
  AlertCircle,
  Ticket,
  ChevronRight,
  ArrowDown,
} from 'lucide-react';

export default function RegistrationPage({ initialMode = 'events' }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, INDIVIDUAL, TEAM

  // Selected event for Detailed View
  const [detailedEvent, setDetailedEvent] = useState(null);

  // Selected event for Registration Form Modal
  const [registeringEvent, setRegisteringEvent] = useState(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Standalone ticket search
  const [ticketSearchCode, setTicketSearchCode] = useState('');
  const [searchedTicket, setSearchedTicket] = useState(null);
  const [searchingTicket, setSearchingTicket] = useState(false);
  const [ticketError, setTicketError] = useState(null);

  const eventsSectionRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    primary_name: '',
    primary_email: '',
    primary_phone: '',
    college_name: '',
    department: '',
    year_of_study: '1st Year',
    team_name: '',
    team_members: [],
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getEvents({ is_active: true });
      setEvents(data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not connect to FastAPI backend on port 8000. Start backend with: uvicorn app.main:app --port 8000');
    } finally {
      setLoading(false);
    }
  };

  const scrollToEvents = () => {
    if (eventsSectionRef.current) {
      eventsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCardClick = (event) => {
    setDetailedEvent(event);
  };

  const handleStartRegistration = (event) => {
    setDetailedEvent(null);
    setRegisteringEvent(event);
    setRegistrationSuccess(null);
    setError(null);
    setFormData({
      primary_name: '',
      primary_email: '',
      primary_phone: '',
      college_name: '',
      department: '',
      year_of_study: '1st Year',
      team_name: '',
      team_members: [],
    });
  };

  const handleAddTeammate = () => {
    if (!registeringEvent) return;
    const maxTeammates = registeringEvent.max_team_size - 1;
    if (formData.team_members.length >= maxTeammates) {
      alert(`Maximum team size is ${registeringEvent.max_team_size} members.`);
      return;
    }
    setFormData({
      ...formData,
      team_members: [
        ...formData.team_members,
        { full_name: '', email: '', phone: '', college_name: formData.college_name || '', roll_no: '' },
      ],
    });
  };

  const handleRemoveTeammate = (index) => {
    const updated = [...formData.team_members];
    updated.splice(index, 1);
    setFormData({ ...formData, team_members: updated });
  };

  const handleTeammateChange = (index, field, value) => {
    const updated = [...formData.team_members];
    updated[index][field] = value;
    setFormData({ ...formData, team_members: updated });
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    if (!registeringEvent) return;

    if (registeringEvent.event_type === 'TEAM') {
      const totalMembers = 1 + formData.team_members.length;
      if (totalMembers < registeringEvent.min_team_size) {
        alert(`This event requires a minimum of ${registeringEvent.min_team_size} members.`);
        return;
      }
      if (!formData.team_name.trim()) {
        alert('Please provide a team name.');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        event_id: registeringEvent.id,
        primary_name: formData.primary_name,
        primary_email: formData.primary_email,
        primary_phone: formData.primary_phone,
        college_name: formData.college_name,
        department: formData.department,
        year_of_study: formData.year_of_study,
        team_name: registeringEvent.event_type === 'TEAM' ? formData.team_name : null,
        team_members: registeringEvent.event_type === 'TEAM' ? formData.team_members : [],
      };

      const result = await api.createRegistration(payload);

      if (result.payment_status === 'PENDING' && result.payment_session) {
        try {
          const verifyRes = await api.verifyPayment(result.payment_session.order_id);
          if (verifyRes.success) {
            result.payment_status = 'SUCCESS';
          }
        } catch (vErr) {
          console.log('Payment verification note:', vErr);
        }
      }

      const fullTicket = await api.getRegistrationByCode(result.registration_code);
      setRegistrationSuccess(fullTicket);
      fetchEvents();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearchTicket = async (e) => {
    e.preventDefault();
    if (!ticketSearchCode.trim()) return;

    try {
      setSearchingTicket(true);
      setTicketError(null);
      setSearchedTicket(null);
      const data = await api.getRegistrationByCode(ticketSearchCode.trim());
      setSearchedTicket(data);
    } catch (err) {
      setTicketError('No registration pass found for code: ' + ticketSearchCode.toUpperCase());
    } finally {
      setSearchingTicket(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || ev.event_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      {/* 1. CINEMATIC HERO SECTION */}
      {initialMode === 'events' && (
        <section style={{
          position: 'relative',
          minHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '4rem 1.5rem',
          background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.08) 0%, rgba(9, 9, 14, 0.95) 70%)',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(212, 175, 55, 0.12)',
        }}>
          {/* Ambient Gold Halo */}
          <div style={{
            position: 'absolute',
            width: 'min(90vw, 550px)',
            height: 'min(90vw, 550px)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 215, 127, 0.18) 0%, rgba(212, 175, 55, 0.04) 50%, transparent 70%)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }} />

          {/* Top Tagline */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1.25rem',
            borderRadius: '9999px',
            background: 'var(--bg-inset)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            boxShadow: 'var(--neu-shadow-inset)',
            color: 'var(--gold-bright)',
            fontSize: '0.75rem',
            fontWeight: '700',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            marginBottom: '1.5rem',
            zIndex: 2,
          }}>
            <Sparkles size={14} /> Official Festival Portal
          </div>

          {/* Majestic Hero Typography: ASTHRA ’26 */}
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(3.2rem, 9vw, 6.5rem)',
              fontWeight: '900',
              letterSpacing: '0.08em',
              lineHeight: 1,
              marginBottom: '1.25rem',
              zIndex: 2,
              filter: 'drop-shadow(0 0 25px rgba(212, 175, 55, 0.35))',
            }}
          >
            <span className="gold-text-glow">ASTHRA</span>{' '}
            <span style={{
              background: 'linear-gradient(135deg, #FFF4D0 0%, #F5D77F 40%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              ’26
            </span>
          </h1>

          <p style={{
            maxWidth: '650px',
            margin: '0 auto 2.5rem',
            color: 'var(--text-secondary)',
            fontSize: '1.05rem',
            lineHeight: 1.6,
            zIndex: 2,
          }}>
            National Mathematics & Technical Festival. Think, solve, compete, and explore. Form your team and claim your spot now.
          </p>

          {/* Prominent CTA: VIEW EVENTS */}
          <button
            onClick={scrollToEvents}
            className="neu-btn-gold"
            style={{
              padding: '1rem 2.8rem',
              fontSize: '0.95rem',
              letterSpacing: '0.15em',
              zIndex: 2,
            }}
          >
            <span>VIEW EVENTS</span>
            <ArrowDown size={18} />
          </button>
        </section>
      )}

      {/* 2. MAIN CONTENT AREA */}
      <div ref={eventsSectionRef} style={{ maxWidth: '1280px', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        {/* If Mode is Ticket Lookup */}
        {initialMode === 'ticket-lookup' ? (
          <div style={{ maxWidth: '650px', margin: '0 auto' }}>
            <div className="neu-card" style={{ padding: '2.5rem', textAlign: 'center', marginBottom: '2rem' }}>
              <Ticket size={40} color="#D4AF37" style={{ marginBottom: '1rem' }} />
              <h2 className="font-display gold-text" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
                Find Your Digital Pass
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Enter your unique 10-character registration code (e.g. ATHRA-2026-X8K9L) to view or print your pass.
              </p>

              <form onSubmit={handleSearchTicket} style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Enter Registration Code..."
                  value={ticketSearchCode}
                  onChange={(e) => setTicketSearchCode(e.target.value.toUpperCase())}
                  className="neu-input font-mono"
                  style={{ textAlign: 'center', letterSpacing: '0.15em', fontSize: '1.1rem', fontWeight: '700' }}
                  required
                />
                <button
                  type="submit"
                  disabled={searchingTicket}
                  className="neu-btn-gold"
                  style={{ minWidth: '130px' }}
                >
                  {searchingTicket ? 'Searching...' : 'Find Pass'}
                </button>
              </form>

              {ticketError && (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171',
                  fontSize: '0.85rem',
                }}>
                  {ticketError}
                </div>
              )}
            </div>

            {searchedTicket && (
              <DigitalTicketPass registration={searchedTicket} onClose={() => setSearchedTicket(null)} />
            )}
          </div>
        ) : (
          /* Events Section */
          <div>
            {/* Section Heading & Filter Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem',
              marginBottom: '2.5rem',
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', letterSpacing: '0.2em', color: 'var(--gold-bright)', textTransform: 'uppercase', fontWeight: '700' }}>
                  EXPLORE COMPETITIONS
                </div>
                <h2 className="font-display gold-text-glow" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
                  FESTIVAL EVENTS
                </h2>
              </div>

              {/* Search & Category Filter */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', minWidth: '240px' }}>
                  <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="neu-input"
                    style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {['ALL', 'INDIVIDUAL', 'TEAM'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`neu-btn ${filterType === type ? 'active' : ''}`}
                      style={{ fontSize: '0.75rem', padding: '0.55rem 0.9rem' }}
                    >
                      {type === 'ALL' ? 'All' : type === 'INDIVIDUAL' ? 'Solo' : 'Team'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Banner if Backend is offline */}
            {error && (
              <div style={{
                padding: '1.25rem',
                borderRadius: '14px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#F87171',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <AlertCircle size={24} />
                <div>
                  <div style={{ fontWeight: '700' }}>Backend Connection Required</div>
                  <div style={{ fontSize: '0.85rem' }}>{error}</div>
                </div>
              </div>
            )}

            {/* Event Cards Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--gold-bright)' }}>
                <div className="animate-shimmer" style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                  Loading Asthra Events...
                </div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="neu-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No events found matching your search.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '2rem',
              }}>
                {filteredEvents.map((event) => {
                  const fee = parseFloat(event.registration_fee);
                  const isTeam = event.event_type === 'TEAM';

                  return (
                    <div
                      key={event.id}
                      onClick={() => handleCardClick(event)}
                      className="neu-card neu-card-hover"
                      style={{
                        padding: '1.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '260px',
                      }}
                    >
                      <div>
                        {/* Title at the Top */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <h3 className="font-display gold-text" style={{ fontSize: '1.35rem', fontWeight: '800', lineHeight: 1.25 }}>
                            {event.title}
                          </h3>
                          <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: '800', color: fee > 0 ? 'var(--gold-bright)' : '#34D399', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                            {fee > 0 ? `₹${fee.toFixed(0)}` : 'FREE'}
                          </span>
                        </div>

                        {/* Category & Venue Badges */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                          <span className={`neu-badge ${isTeam ? 'neu-badge-gold' : 'neu-badge-green'}`} style={{ fontSize: '0.7rem' }}>
                            {isTeam ? `Team (${event.min_team_size}-${event.max_team_size})` : 'Individual'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            📍 {event.venue}
                          </span>
                        </div>

                        {/* Small Description Inside */}
                        <p style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                          marginBottom: '1.25rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {event.description}
                        </p>
                      </div>

                      {/* Card Footer prompt */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        paddingTop: '0.85rem',
                        fontSize: '0.75rem',
                        color: 'var(--gold-bright)',
                        fontWeight: '600',
                      }}>
                        <span>Click for rules & details</span>
                        <ChevronRight size={15} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. DETAILED EVENT MODAL */}
      {detailedEvent && (
        <EventDetailModal
          event={detailedEvent}
          onClose={() => setDetailedEvent(null)}
          onRegister={handleStartRegistration}
        />
      )}

      {/* 4. REGISTRATION FORM MODAL */}
      {registeringEvent && (
        <div className="modal-overlay" onClick={() => !submitting && setRegisteringEvent(null)}>
          <div
            className="neu-card"
            style={{ maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            {registrationSuccess ? (
              /* Success E-Pass State */
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                  }}>
                    <CheckCircle size={30} color="#10B981" />
                  </div>
                  <h2 className="font-display gold-text-glow" style={{ fontSize: '1.8rem' }}>
                    Registration Successful!
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Your spot is confirmed. Present this pass at the entrance on event day.
                  </p>
                </div>

                <DigitalTicketPass
                  registration={registrationSuccess}
                  onClose={() => {
                    setRegisteringEvent(null);
                    setRegistrationSuccess(null);
                  }}
                />
              </div>
            ) : (
              /* Form */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-bright)' }}>
                      Registering For
                    </span>
                    <h2 className="font-display gold-text" style={{ fontSize: '1.7rem', fontWeight: '800' }}>
                      {registeringEvent.title}
                    </h2>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Fee: <strong>{registeringEvent.registration_fee > 0 ? `₹${registeringEvent.registration_fee}` : 'FREE'}</strong> • Type: <strong>{registeringEvent.event_type}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => setRegisteringEvent(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>

                {error && (
                  <div style={{
                    padding: '0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#F87171',
                    fontSize: '0.85rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitRegistration}>
                  {/* Team Name if Team Event */}
                  {registeringEvent.event_type === 'TEAM' && (
                    <div style={{ marginBottom: '1.5rem', background: 'var(--bg-inset)', padding: '1.25rem', borderRadius: '14px', boxShadow: 'var(--neu-shadow-inset)' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--gold-bright)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                        Team Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CyberKnights"
                        value={formData.team_name}
                        onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                        className="neu-input"
                        required
                      />
                    </div>
                  )}

                  {/* Primary Contact Details */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-offwhite)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {registeringEvent.event_type === 'TEAM' ? 'Team Leader / Primary Contact' : 'Participant Details'}
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Full Name *</label>
                        <input
                          type="text"
                          value={formData.primary_name}
                          onChange={(e) => setFormData({ ...formData, primary_name: e.target.value })}
                          className="neu-input"
                          placeholder="Your Full Name"
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Email Address *</label>
                        <input
                          type="email"
                          value={formData.primary_email}
                          onChange={(e) => setFormData({ ...formData, primary_email: e.target.value })}
                          className="neu-input"
                          placeholder="name@college.edu"
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Phone Number *</label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]{10}"
                          maxLength={10}
                          value={formData.primary_phone}
                          onChange={(e) => setFormData({ ...formData, primary_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          className="neu-input"
                          placeholder="10-digit mobile"
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>College / University *</label>
                        <input
                          type="text"
                          value={formData.college_name}
                          onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                          className="neu-input"
                          placeholder="College Name"
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Department *</label>
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="neu-input"
                          placeholder="e.g. Mathematics / CS"
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Year of Study</label>
                        <select
                          value={formData.year_of_study}
                          onChange={(e) => setFormData({ ...formData, year_of_study: e.target.value })}
                          className="neu-input"
                          style={{ cursor: 'pointer' }}
                        >
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                          <option value="Postgraduate">Postgraduate</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Teammates Section if Team Event */}
                  {registeringEvent.event_type === 'TEAM' && (
                    <div style={{ marginBottom: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--gold-bright)', textTransform: 'uppercase' }}>
                            Teammates ({1 + formData.team_members.length} / {registeringEvent.max_team_size} members)
                          </h4>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Min: {registeringEvent.min_team_size} • Max: {registeringEvent.max_team_size}
                          </div>
                        </div>

                        {1 + formData.team_members.length < registeringEvent.max_team_size && (
                          <button
                            type="button"
                            onClick={handleAddTeammate}
                            className="neu-btn"
                            style={{ fontSize: '0.75rem', padding: '0.45rem 0.9rem', color: 'var(--gold-bright)' }}
                          >
                            <Plus size={14} /> Add Teammate
                          </button>
                        )}
                      </div>

                      {formData.team_members.map((member, index) => (
                        <div
                          key={index}
                          style={{
                            background: 'var(--bg-inset)',
                            padding: '1.25rem',
                            borderRadius: '12px',
                            boxShadow: 'var(--neu-shadow-inset)',
                            marginBottom: '1rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-offwhite)' }}>
                              Teammate #{index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTeammate(index)}
                              style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                            <input
                              type="text"
                              placeholder="Full Name *"
                              value={member.full_name}
                              onChange={(e) => handleTeammateChange(index, 'full_name', e.target.value)}
                              className="neu-input"
                              required
                            />
                            <input
                              type="email"
                              placeholder="Email Address *"
                              value={member.email}
                              onChange={(e) => handleTeammateChange(index, 'email', e.target.value)}
                              className="neu-input"
                              required
                            />
                            <input
                              type="tel"
                              inputMode="numeric"
                              pattern="[0-9]{10}"
                              maxLength={10}
                              placeholder="10-digit phone *"
                              value={member.phone}
                              onChange={(e) => handleTeammateChange(index, 'phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                              className="neu-input"
                              required
                            />
                            <input
                              type="text"
                              placeholder="College / Roll No"
                              value={member.college_name}
                              onChange={(e) => handleTeammateChange(index, 'college_name', e.target.value)}
                              className="neu-input"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Fee</div>
                      <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--gold-bright)' }}>
                        {registeringEvent.registration_fee > 0 ? `₹${registeringEvent.registration_fee}` : 'FREE'}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="neu-btn-gold"
                      style={{ padding: '0.9rem 2.2rem' }}
                    >
                      {submitting ? (
                        'Processing Registration...'
                      ) : registeringEvent.registration_fee > 0 ? (
                        <>
                          <CreditCard size={17} /> Pay & Confirm Pass
                        </>
                      ) : (
                        <>
                          <Sparkles size={17} /> Generate Free Pass
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
