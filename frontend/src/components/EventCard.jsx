import React from 'react';
import { Clock, MapPin, Users, ArrowUpRight } from 'lucide-react';

export default function EventCard({ event, onClick }) {
  if (!event) return null;

  const fee = parseFloat(event.registration_fee || 0);
  const isTeam = event.event_type === 'TEAM';

  // Format event date & time cleanly
  let formattedTime = '';
  try {
    const d = new Date(event.event_date);
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = event.start_time || d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    formattedTime = `${timeStr} • ${dateStr}`;
  } catch {
    formattedTime = event.event_date || 'TBA';
  }

  return (
    <div
      className="event-card"
      onClick={() => onClick(event)}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderRadius: '20px',
        border: '1px solid var(--glass-border)',
        padding: '1.75rem',
        cursor: 'pointer',
        boxShadow: 'var(--glass-shadow)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
        e.currentTarget.style.boxShadow = 'var(--glass-shadow-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--glass-border)';
        e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
      }}
    >
      {/* 1. Heading Designated Slot (fixed height to ensure exact matching alignment) */}
      <div
        style={{
          height: '54px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '0.75rem',
          marginBottom: '0.65rem',
        }}
      >
        <h3
          className="font-display gold-text-glow"
          style={{
            fontSize: '1.4rem',
            fontWeight: '800',
            letterSpacing: '0.02em',
            lineHeight: 1.25,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
          }}
        >
          {event.title}
        </h3>

        <div
          style={{
            width: '28px',
            height: '28px',
            flexShrink: 0,
            borderRadius: '50%',
            background: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold-bright)',
            marginTop: '2px',
          }}
        >
          <ArrowUpRight size={14} />
        </div>
      </div>

      {/* 2. Description Designated Slot (fixed height to align line break across all cards) */}
      <div
        style={{
          height: '42px',
          overflow: 'hidden',
          marginBottom: '1rem',
        }}
      >
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.86rem',
            lineHeight: 1.5,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {event.description || 'Participate in this signature fest challenge and showcase your talent.'}
        </p>
      </div>

      {/* 3. Single Line Break: Perfectly aligned horizontally across all cards */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '1rem',
        }}
      />

      {/* 4. Contents other than heading and description: Below the single line break */}

      {/* Row 1: Category (left, same style of time) and Highlighted Venue (right) */}
      <div
        style={{
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '0.75rem',
        }}
      >
        {/* Category */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            fontWeight: '500',
          }}
        >
          <Users size={15} color="#D4AF37" />
          <span>
            {isTeam
              ? `Group (${event.min_team_size}-${event.max_team_size} Members)`
              : 'Individual Entry'}
          </span>
        </div>

        {/* Highlighted Venue */}
        {event.venue ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.82rem',
              fontWeight: '600',
              color: 'var(--gold-bright)',
              background: 'rgba(212, 175, 55, 0.09)',
              border: '1px solid rgba(212, 175, 55, 0.38)',
              boxShadow: '0 0 12px rgba(212, 175, 55, 0.12)',
              padding: '0.25rem 0.65rem',
              borderRadius: '8px',
              maxWidth: '170px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <MapPin size={13} color="#F5D77F" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.venue}</span>
          </div>
        ) : (
          <div style={{ height: '28px' }} />
        )}
      </div>

      {/* Row 2: Event Time (left) and Registration Fee (right) */}
      <div
        style={{
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        {/* Event Time */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
          }}
        >
          <Clock size={15} color="#D4AF37" />
          <span>{formattedTime}</span>
        </div>

        {/* Registration Fee */}
        <div
          className="font-mono"
          style={{
            fontSize: '1.35rem',
            fontWeight: '800',
            color: fee > 0 ? 'var(--gold-bright)' : '#34D399',
            letterSpacing: '0.02em',
          }}
        >
          {fee > 0 ? `₹${fee.toFixed(0)}` : 'Free'}
        </div>
      </div>
    </div>
  );
}
