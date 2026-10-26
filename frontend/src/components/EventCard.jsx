import React from 'react';
import { Calendar, Clock, MapPin, Users, ArrowUpRight } from 'lucide-react';

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
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    formattedTime = `${timeStr} • ${dateStr}`;
  } catch {
    formattedTime = event.event_date;
  }

  return (
    <div
      onClick={() => onClick(event)}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderRadius: '20px',
        border: '1px solid var(--glass-border)',
        padding: '2rem 1.8rem',
        cursor: 'pointer',
        boxShadow: 'var(--glass-shadow)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '230px',
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
      {/* Top Badges Row */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              className="glass-badge"
              style={{
                background: isTeam ? 'rgba(212, 175, 55, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                color: isTeam ? 'var(--gold-bright)' : '#60A5FA',
                borderColor: isTeam ? 'rgba(212, 175, 55, 0.3)' : 'rgba(59, 130, 246, 0.3)',
                fontSize: '0.7rem',
                fontWeight: '600',
              }}
            >
              <Users size={12} />
              {isTeam ? `Squad (${event.min_team_size}-${event.max_team_size})` : 'Individual'}
            </span>

            {event.venue && (
              <span
                className="glass-badge"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: 'var(--text-secondary)',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  fontSize: '0.7rem',
                }}
              >
                <MapPin size={11} color="#D4AF37" />
                {event.venue}
              </span>
            )}
          </div>

          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-bright)',
            }}
          >
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* Title */}
        <h3
          className="font-display gold-text-glow"
          style={{
            fontSize: '1.65rem',
            fontWeight: '800',
            letterSpacing: '0.03em',
            lineHeight: 1.25,
            marginBottom: '0.6rem',
          }}
        >
          {event.title}
        </h3>

        {event.description && (
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.86rem',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {event.description}
          </p>
        )}
      </div>

      {/* Bottom Section: Time and Registration Fee */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        {/* Time of event */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
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
