import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Award,
  DollarSign,
  CheckCircle2,
  FileText,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function EventDetailModal({ event, onClose, onRegister }) {
  if (!event) return null;

  const isTeam = event.event_type === 'TEAM';
  const fee = parseFloat(event.registration_fee);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="neu-card"
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2.5rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'var(--bg-inset)',
            boxShadow: 'var(--neu-shadow-inset)',
            border: 'none',
            color: 'var(--text-muted)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          ✕
        </button>

        {/* Top Pill Badges */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div className={`neu-badge ${isTeam ? 'neu-badge-gold' : 'neu-badge-green'}`}>
            {isTeam ? `Team Event (${event.min_team_size} - ${event.max_team_size} members)` : 'Solo / Individual Event'}
          </div>

          <div className="neu-badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-offwhite)' }}>
            📍 {event.venue}
          </div>
        </div>

        {/* Event Title */}
        <h2 className="font-display gold-text-glow" style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1.2, marginBottom: '1rem' }}>
          {event.title}
        </h2>

        {/* Fee & Capacity Highlight Bar */}
        <div style={{
          background: 'var(--bg-inset)',
          boxShadow: 'var(--neu-shadow-inset)',
          padding: '1.25rem',
          borderRadius: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Registration Fee
            </div>
            <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: '800', color: fee > 0 ? 'var(--gold-bright)' : '#34D399' }}>
              {fee > 0 ? `₹${fee.toFixed(0)}` : 'FREE ENTRY'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Event Date
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-white)' }}>
              {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Registration Closes
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gold-light)' }}>
              {new Date(event.registration_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Spots
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {event.total_registrations || 0} Filled {event.max_capacity ? `/ ${event.max_capacity}` : ''}
            </div>
          </div>
        </div>

        {/* Full Description */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={14} /> About the Event
          </h3>
          <p style={{ color: 'var(--text-offwhite)', fontSize: '0.92rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
            {event.description}
          </p>
        </div>

        {/* Rules & Guidelines */}
        {event.rules && (
          <div style={{
            background: 'rgba(212, 175, 55, 0.04)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            borderRadius: '14px',
            padding: '1.25rem',
            marginBottom: '2rem',
          }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={15} /> Rules & Criteria
            </h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {event.rules}
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '1.25rem' }}>
          <button onClick={onClose} className="neu-btn" style={{ padding: '0.75rem 1.4rem' }}>
            Back to Events
          </button>
          <button
            onClick={() => onRegister(event)}
            className="neu-btn-gold"
            style={{ padding: '0.75rem 1.8rem' }}
          >
            <span>Register for Event</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
