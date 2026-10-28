import React from 'react';

export default function EventCardSkeleton() {
  return (
    <div
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderRadius: '20px',
        border: '1px solid var(--glass-border)',
        padding: '1.75rem',
        boxShadow: 'var(--glass-shadow)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '270px',
      }}
    >
      {/* 1. Heading & Icon Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '0.75rem',
          marginBottom: '0.85rem',
          height: '54px',
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {/* Title line 1 */}
          <div
            className="skeleton-rect"
            style={{ height: '22px', width: '78%', borderRadius: '7px' }}
          />
          {/* Title line 2 */}
          <div
            className="skeleton-rect"
            style={{ height: '18px', width: '48%', borderRadius: '6px' }}
          />
        </div>
        {/* Circle arrow placeholder */}
        <div
          className="skeleton-rect"
          style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, marginTop: '2px' }}
        />
      </div>

      {/* 2. Description Lines */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginBottom: '1rem',
          height: '42px',
        }}
      >
        <div
          className="skeleton-rect"
          style={{ height: '13px', width: '95%', borderRadius: '5px' }}
        />
        <div
          className="skeleton-rect"
          style={{ height: '13px', width: '62%', borderRadius: '5px' }}
        />
      </div>

      {/* 3. Divider Line */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '1rem',
        }}
      />

      {/* 4. Category & Venue Row */}
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
        {/* Category rounded rectangle */}
        <div
          className="skeleton-rect"
          style={{ height: '18px', width: '44%', borderRadius: '6px' }}
        />
        {/* Venue rounded badge */}
        <div
          className="skeleton-rect"
          style={{ height: '22px', width: '32%', borderRadius: '12px' }}
        />
      </div>

      {/* 5. Date & Time Row */}
      <div
        style={{
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        <div
          className="skeleton-rect"
          style={{ height: '14px', width: '54%', borderRadius: '6px' }}
        />
      </div>

      {/* 6. Footer: Fee & Action Button */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.85rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Fee rectangle */}
        <div
          className="skeleton-rect"
          style={{ height: '24px', width: '25%', borderRadius: '6px' }}
        />
        {/* Register button rectangle */}
        <div
          className="skeleton-rect"
          style={{ height: '36px', width: '38%', borderRadius: '10px' }}
        />
      </div>
    </div>
  );
}
