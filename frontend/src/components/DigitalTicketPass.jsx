import React from 'react';
import { MapPin, Printer, Download, CheckCircle2 } from 'lucide-react';
import { ASTHRA_LOGO_BASE64 } from '../assets/asthraLogoBase64';

export default function DigitalTicketPass({ registration, onClose, onDownload }) {
  if (!registration) return null;

  const handlePrint = () => {
    window.print();
  };

  const regCode = registration.registration_code || registration.code || 'ATHRA-2026';
  const eventTitle = registration.event_title || registration.event?.title || 'Fest Event';
  const participantName = registration.participant_name || registration.user_name || registration.name || 'Participant';
  const teamName = registration.team_name || registration.team;
  const venue = registration.venue || registration.event?.venue || 'Campus Main Arena';

  const rawFee = registration.amount_paid ?? registration.registration_fee ?? registration.fee ?? 0;
  const numFee = parseFloat(rawFee);
  const feeDisplay = !isNaN(numFee) && numFee > 0 ? `₹${numFee.toFixed(0)}` : 'FREE';

  return (
    <div style={{ maxWidth: '820px', width: '100%', margin: '0 auto', fontFamily: 'inherit' }}>
      {/* Action Bar (Top Right) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1rem' }} className="no-print">
        {onDownload && (
          <button
            onClick={onDownload}
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
              color: '#0B0A10',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.25)',
              transition: 'all 0.2s ease',
            }}
          >
            <Download size={14} /> Download Pass
          </button>
        )}
        <button
          onClick={handlePrint}
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 1rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: '600',
            background: 'rgba(212, 175, 55, 0.1)',
            color: 'var(--gold-bright, #F5D77F)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Printer size={14} /> Print Pass
        </button>
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: '600',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#9CA3AF',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        )}
      </div>

      {/* Ticket Container with horizontal scroll wrapper for mobile */}
      <div style={{ overflowX: 'auto', paddingBottom: '0.5rem', WebkitOverflowScrolling: 'touch' }}>
        <div
          className="digital-ticket-card"
          style={{
            minWidth: '720px',
            maxWidth: '780px',
            margin: '0 auto',
            display: 'flex',
            position: 'relative',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #161420 0%, #100f18 45%, #1f190e 100%)',
            border: '1.5px solid rgba(212, 175, 55, 0.5)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(212, 175, 55, 0.15)',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Ambient Aztec Radial Highlights */}
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              left: '15%',
              width: '260px',
              height: '260px',
              background: 'radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-30px',
              right: '25%',
              width: '220px',
              height: '220px',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.09) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Left Edge Semicircular Notch */}
          <div
            style={{
              position: 'absolute',
              left: '-16px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#0B0A10',
              border: '1.5px solid rgba(212, 175, 55, 0.5)',
              boxShadow: 'inset -3px 0 6px rgba(0, 0, 0, 0.8)',
              zIndex: 3,
            }}
          />

          {/* ══════════ MAIN TICKET BODY (LEFT ~72%) ══════════ */}
          <div
            style={{
              flex: '1 1 72%',
              padding: '1.6rem 2rem 1.6rem 2.2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {/* Top Row: Fest Logo, Fest Name & Event Title */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <img
                    src={ASTHRA_LOGO_BASE64}
                    alt="Asthra Logo"
                    style={{
                      width: '44px',
                      height: '44px',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.45))',
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#D4AF37', fontWeight: '800' }}>
                      ASTHRA 2026 FEST
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#FFFFFF', letterSpacing: '0.02em', lineHeight: 1.2 }}>
                      {eventTitle}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '9999px',
                      background: 'rgba(34, 197, 94, 0.12)',
                      border: '1px solid rgba(34, 197, 94, 0.35)',
                      color: '#4ADE80',
                      fontSize: '0.65rem',
                      fontWeight: '800',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <CheckCircle2 size={11} /> Confirmed Pass
                  </span>
                </div>
              </div>

              {/* Dotted Divider Line */}
              <div
                style={{
                  borderTop: '1px dotted rgba(212, 175, 55, 0.35)',
                  margin: '0.75rem 0',
                }}
              />
            </div>

            {/* Middle Section: Participant / Team Name & Registration Code */}
            <div style={{ margin: '0.4rem 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr', gap: '1rem', alignItems: 'center' }}>
                {/* Participant / Team */}
                <div>
                  <div style={{ fontSize: '0.62rem', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: '800', marginBottom: '0.15rem' }}>
                    {teamName ? 'TEAM / PARTICIPANT' : 'PARTICIPANT NAME'}
                  </div>
                  <div
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: '900',
                      color: '#FFFFFF',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {teamName ? `${teamName}` : participantName}
                  </div>
                  {teamName && (
                    <div style={{ fontSize: '0.72rem', color: '#B8A780', marginTop: '0.1rem' }}>
                      Lead: {participantName}
                    </div>
                  )}
                </div>

                {/* Registration Code */}
                <div>
                  <div style={{ fontSize: '0.62rem', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: '800', marginBottom: '0.15rem' }}>
                    REGISTRATION CODE
                  </div>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: '900',
                      color: '#FFFFFF',
                      letterSpacing: '0.08em',
                      background: 'rgba(212, 175, 55, 0.08)',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px dashed rgba(212, 175, 55, 0.4)',
                      display: 'inline-block',
                    }}
                  >
                    {regCode}
                  </div>
                </div>
              </div>

              {/* Dotted Divider Line */}
              <div
                style={{
                  borderTop: '1px dotted rgba(212, 175, 55, 0.35)',
                  margin: '0.75rem 0',
                }}
              />
            </div>

            {/* Bottom Card: Venue (replacing barcode) & Registration Fee */}
            <div
              style={{
                background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 244, 232, 0.96) 100%)',
                borderRadius: '12px',
                padding: '0.75rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)',
              }}
            >
              {/* Venue Placed Here */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'rgba(212, 175, 55, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#AA820A',
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.58rem', fontWeight: '800', color: '#777', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    VENUE / EVENT LOCATION
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#111018', letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
                    {venue}
                  </div>
                </div>
              </div>

              {/* Registration Fee */}
              <div style={{ textAlign: 'right', paddingLeft: '1.5rem', borderLeft: '1px solid rgba(0, 0, 0, 0.1)' }}>
                <div style={{ fontSize: '0.58rem', fontWeight: '800', color: '#777', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  REGISTRATION FEE
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#111018', fontFamily: 'monospace' }}>
                  {feeDisplay}
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem' }}>
                  <CheckCircle2 size={11} /> Paid & Confirmed
                </div>
              </div>
            </div>
          </div>

          {/* ══════════ PERFORATION DIVIDER (VERTICAL DOTTED LINE) ══════════ */}
          <div
            style={{
              position: 'relative',
              width: '1px',
              borderLeft: '2px dotted rgba(212, 175, 55, 0.65)',
              margin: '0.6rem 0',
              zIndex: 3,
            }}
          >
            {/* Top Circular Punch Hole */}
            <div
              style={{
                position: 'absolute',
                top: '-16px',
                left: '-10px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#0B0A10',
                border: '1.5px solid rgba(212, 175, 55, 0.5)',
              }}
            />
            {/* Bottom Circular Punch Hole */}
            <div
              style={{
                position: 'absolute',
                bottom: '-16px',
                left: '-10px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#0B0A10',
                border: '1.5px solid rgba(212, 175, 55, 0.5)',
              }}
            />
          </div>

          {/* ══════════ RIGHT SIDE (AFTER DOTTED LINES: LOGO & NAME IN MIDDLE) ══════════ */}
          <div
            style={{
              flex: '0 0 28%',
              maxWidth: '28%',
              background: 'linear-gradient(135deg, rgba(20, 18, 28, 0.95) 0%, rgba(30, 24, 14, 0.98) 100%)',
              padding: '1.6rem 1.2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
              <img
                src={ASTHRA_LOGO_BASE64}
                alt="Asthra Festival Emblem"
                style={{
                  width: '76px',
                  height: '76px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 16px rgba(212, 175, 55, 0.6))',
                }}
              />
              <div>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#D4AF37', fontWeight: '800' }}>
                  OFFICIAL PASS
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#FFFFFF', letterSpacing: '0.06em', marginTop: '0.2rem' }}>
                  ASTHRA 2026
                </div>
              </div>
            </div>
          </div>

          {/* Right Edge Serrated / Scalloped Tear Teeth */}
          <div
            style={{
              position: 'absolute',
              right: '-6px',
              top: 0,
              bottom: 0,
              width: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              zIndex: 4,
              pointerEvents: 'none',
            }}
          >
            {[...Array(11)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#0B0A10',
                  boxShadow: 'inset 2px 0 3px rgba(0, 0, 0, 0.7)',
                  margin: '3px 0',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .digital-ticket-card, .digital-ticket-card * {
            visibility: visible;
          }
          .digital-ticket-card {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) scale(1.05);
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
