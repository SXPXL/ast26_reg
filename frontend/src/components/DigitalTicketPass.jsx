import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, MapPin, CheckCircle, Clock, Users, Award, Printer, Shield } from 'lucide-react';
import AsthraLogo from './AsthraLogo';

export default function DigitalTicketPass({ registration, onClose }) {
  if (!registration) return null;

  const handlePrint = () => {
    window.print();
  };

  const isAttended = registration.attendance_status === 'PRESENT';

  return (
    <div style={{ maxWidth: '650px', width: '100%', margin: '0 auto' }}>
      {/* Printable Pass Container */}
      <div className="digital-ticket-pass" style={{ padding: '2rem', position: 'relative' }}>
        {/* Pass Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px dashed rgba(212, 175, 55, 0.3)',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <AsthraLogo size={44} />
            <div>
              <div style={{
                display: 'inline-block',
                fontSize: '0.65rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'var(--gold-bright)',
                fontWeight: '700',
                marginBottom: '0.2rem',
              }}>
                ASTHRA 26 OFFICIAL ENTRY PASS
              </div>
              <h2 className="font-display gold-text-glow" style={{ fontSize: '1.6rem', fontWeight: '800' }}>
                {registration.event_title || 'Fest Event'}
              </h2>
              {registration.team_name && (
                <div style={{ fontSize: '0.95rem', color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <Award size={16} color="#D4AF37" />
                  <strong>{registration.team_name}</strong>
                </div>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Registration Code
            </div>
            <div className="font-mono" style={{
              fontSize: '1.2rem',
              fontWeight: '800',
              color: 'var(--gold-bright)',
              letterSpacing: '0.08em',
              background: 'var(--bg-inset)',
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              boxShadow: 'var(--neu-shadow-inset)',
              display: 'inline-block',
              marginTop: '0.2rem',
            }}>
              {registration.registration_code}
            </div>
          </div>
        </div>

        {/* Main Pass Content: QR & Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}>
          {/* Participant Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Participant / Leader</span>
              <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-white)' }}>
                {registration.primary_name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {registration.primary_email} • {registration.primary_phone}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Institution & Course</span>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-offwhite)' }}>
                {registration.college_name}
                {registration.course_and_semester ? ` • ${registration.course_and_semester}` : (registration.department ? ` • ${registration.department}` : '')}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
              <div className={`neu-badge ${registration.payment_status === 'SUCCESS' ? 'neu-badge-green' : 'neu-badge-red'}`}>
                {registration.payment_status === 'SUCCESS' ? 'PAID / CONFIRMED' : registration.payment_status}
              </div>

              <div className={`neu-badge ${isAttended ? 'neu-badge-green' : 'neu-badge-gold'}`}>
                {isAttended ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle size={13} /> CHECKED IN
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={13} /> NOT CHECKED IN
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* QR Code Well */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            background: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            width: 'fit-content',
            margin: '0 auto',
          }}>
            <QRCodeSVG
              value={JSON.stringify({
                code: registration.registration_code,
                name: registration.primary_name,
                event: registration.event_title,
                status: registration.payment_status,
              })}
              size={130}
              level="H"
              includeMargin={false}
            />
            <div style={{
              fontSize: '0.65rem',
              color: '#111827',
              fontWeight: '700',
              marginTop: '0.5rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              SCAN TO VERIFY AT VENUE
            </div>
          </div>
        </div>

        {/* Teammates List if present - Requirement 8: All details shown */}
        {registration.team_members && registration.team_members.length > 0 && (
          <div style={{
            background: 'var(--bg-inset)',
            padding: '1.25rem',
            borderRadius: '14px',
            boxShadow: 'var(--neu-shadow-inset)',
            marginBottom: '1.5rem',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--gold-bright)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <Users size={14} /> Teammates ({registration.team_members.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {registration.team_members.map((member, idx) => (
                <div key={idx} style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-offwhite)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '0.75rem 0.95rem',
                  borderRadius: '10px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                    <strong style={{ color: 'var(--text-white)' }}>#{idx + 2} {member.full_name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold-light)' }}>📞 {member.phone}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.3rem' }}>
                    <div>✉️ {member.email}</div>
                    <div>🏫 {member.college_name}</div>
                    {member.department && <div>🏢 {member.department}</div>}
                    {member.course_and_semester && <div>📚 {member.course_and_semester}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pass Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '1rem',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div>✨ Present this digital e-pass or printout at the desk.</div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              onClick={handlePrint}
              className="neu-btn"
              style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
            >
              <Printer size={14} /> Print Pass
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="neu-btn"
                style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
