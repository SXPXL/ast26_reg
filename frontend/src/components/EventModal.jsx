import React, { useState } from 'react';
import { api } from '../services/api';
import DigitalTicketPass from './DigitalTicketPass';
import {
  Clock,
  MapPin,
  Users,
  CreditCard,
  Sparkles,
  Plus,
  Trash2,
  X,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

export default function EventModal({ event, onClose, onRegistered }) {
  if (!event) return null;

  const [step, setStep] = useState('details'); // 'details' | 'form' | 'ticket'
  const [ticketData, setTicketData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isTeam = event.event_type === 'TEAM';
  const fee = parseFloat(event.registration_fee || 0);

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

  const handleAddTeammate = () => {
    const maxTeammates = event.max_team_size - 1;
    if (formData.team_members.length >= maxTeammates) {
      alert(`Maximum team size is ${event.max_team_size} members.`);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isTeam) {
      const totalMembers = 1 + formData.team_members.length;
      if (totalMembers < event.min_team_size) {
        alert(`This event requires a minimum of ${event.min_team_size} members.`);
        return;
      }
      if (!formData.team_name.trim()) {
        alert('Please enter your team name.');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        event_id: event.id,
        primary_name: formData.primary_name,
        primary_email: formData.primary_email,
        primary_phone: formData.primary_phone,
        college_name: formData.college_name,
        department: formData.department,
        year_of_study: formData.year_of_study,
        team_name: isTeam ? formData.team_name : null,
        team_members: isTeam ? formData.team_members : [],
      };

      const result = await api.createRegistration(payload);

      // Verify payment order if active
      if (result.payment_status === 'PENDING' && result.payment_session) {
        try {
          const verifyRes = await api.verifyPayment(result.payment_session.order_id);
          if (verifyRes.success) {
            result.payment_status = 'SUCCESS';
          }
        } catch (vErr) {
          console.log('Payment verification check:', vErr);
        }
      }

      // Fetch the generated digital ticket pass
      const fullTicket = await api.getRegistrationByCode(result.registration_code);
      setTicketData(fullTicket);
      setStep('ticket');
      if (onRegistered) onRegistered();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date/time
  let formattedTime = '';
  try {
    const d = new Date(event.event_date);
    formattedTime = `${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} • ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } catch {
    formattedTime = event.event_date;
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3, 3, 5, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur-lg)',
          WebkitBackdropFilter: 'var(--glass-blur-lg)',
          borderRadius: '24px',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.12)',
          maxWidth: step === 'ticket' ? '680px' : '620px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2.5rem',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'var(--bg-inset)',
            border: 'none',
            color: 'var(--text-muted)',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <X size={18} />
        </button>

        {/* STEP 1: DETAILED VIEW */}
        {step === 'details' && (
          <div>
            <h2
              className="font-display gold-text-glow"
              style={{
                fontSize: '2rem',
                fontWeight: '800',
                lineHeight: 1.2,
                marginBottom: '1rem',
              }}
            >
              {event.title}
            </h2>

            {/* Quick Stats: Time & Fee */}
            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                marginBottom: '1.75rem',
                padding: '1rem 1.25rem',
                borderRadius: '14px',
                background: 'var(--bg-inset)',
                border: '1px solid rgba(212, 175, 55, 0.15)',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-white)' }}>{formattedTime}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registration Fee</div>
                <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: '800', color: fee > 0 ? 'var(--gold-bright)' : '#34D399' }}>
                  {fee > 0 ? `₹${fee.toFixed(0)}` : 'Free'}
                </div>
              </div>

              {event.venue && (
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Venue</div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-offwhite)' }}>{event.venue}</div>
                </div>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', marginBottom: '0.4rem' }}>
                  About
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {event.description}
                </p>
              </div>
            )}

            {/* Rules */}
            {event.rules && (
              <div style={{ marginBottom: '2rem', background: 'rgba(212, 175, 55, 0.04)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', marginBottom: '0.4rem' }}>
                  Rules
                </div>
                <p style={{ color: 'var(--text-offwhite)', fontSize: '0.88rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {event.rules}
                </p>
              </div>
            )}

            {/* Action Button: Register */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setStep('form')}
                className="neu-btn-gold"
                style={{ padding: '0.85rem 2rem', fontSize: '0.9rem' }}
              >
                <span>Register for Event</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: REGISTRATION FORM */}
        {step === 'form' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <button
                onClick={() => setStep('details')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold-bright)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.8rem',
                }}
              >
                <ArrowLeft size={16} /> Back
              </button>
            </div>

            <h2 className="font-display gold-text-glow" style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' }}>
              Register: {event.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Fill in your details below to secure your entry pass.
            </p>

            {error && (
              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Team Name if team event */}
              {isTeam && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--gold-bright)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Team Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your team name"
                    value={formData.team_name}
                    onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                    className="neu-input"
                    required
                  />
                </div>
              )}

              {/* Primary Contact Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Full Name *</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={formData.primary_name}
                    onChange={(e) => setFormData({ ...formData, primary_name: e.target.value })}
                    className="neu-input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Email Address *</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.primary_email}
                    onChange={(e) => setFormData({ ...formData, primary_email: e.target.value })}
                    className="neu-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={formData.primary_phone}
                    onChange={(e) => setFormData({ ...formData, primary_phone: e.target.value })}
                    className="neu-input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>College / Institution *</label>
                  <input
                    type="text"
                    placeholder="College name"
                    value={formData.college_name}
                    onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                    className="neu-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Department *</label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics / CS"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="neu-input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Year</label>
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

              {/* Teammates section if team event */}
              {isTeam && (
                <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--gold-bright)', textTransform: 'uppercase' }}>
                      Teammates ({1 + formData.team_members.length} / {event.max_team_size} members)
                    </div>

                    {1 + formData.team_members.length < event.max_team_size && (
                      <button
                        type="button"
                        onClick={handleAddTeammate}
                        className="neu-btn"
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', color: 'var(--gold-bright)' }}
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
                        padding: '1rem',
                        borderRadius: '12px',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Teammate #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTeammate(index)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
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
                          placeholder="Email *"
                          value={member.email}
                          onChange={(e) => handleTeammateChange(index, 'email', e.target.value)}
                          className="neu-input"
                          required
                        />
                        <input
                          type="tel"
                          placeholder="Phone *"
                          value={member.phone}
                          onChange={(e) => handleTeammateChange(index, 'phone', e.target.value)}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Fee</div>
                  <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--gold-bright)' }}>
                    {fee > 0 ? `₹${fee.toFixed(0)}` : 'Free'}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="neu-btn-gold"
                  style={{ padding: '0.85rem 2rem' }}
                >
                  {submitting ? 'Generating Pass...' : fee > 0 ? 'Pay & Confirm Entry' : 'Confirm Free Entry'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: DIGITAL PASS */}
        {step === 'ticket' && ticketData && (
          <div>
            <DigitalTicketPass registration={ticketData} onClose={onClose} />
          </div>
        )}
      </div>
    </div>
  );
}
