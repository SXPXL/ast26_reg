import React, { useState } from 'react';
import { api } from '../services/api';
import DigitalTicketPass from './DigitalTicketPass';
import { Search, X, AlertCircle, Ticket, ArrowLeft, Loader2 } from 'lucide-react';

export default function LookupTicketModal({ onClose }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ticketData, setTicketData] = useState(null);

  const handleLookup = async (e) => {
    e?.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter your registration code (e.g. ATHRA-2026-XXXXXX)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.getRegistrationByCode(cleanCode);
      setTicketData(data);
    } catch (err) {
      setError(err.message || 'Pass not found. Please verify your registration code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="modal-overlay"
      style={{
        zIndex: 1100,
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
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(212, 175, 55, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.12)',
          maxWidth: ticketData ? '680px' : '520px',
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
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FFF';
            e.currentTarget.style.borderColor = 'var(--gold-bright)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <X size={18} />
        </button>

        {ticketData ? (
          <div>
            <button
              onClick={() => {
                setTicketData(null);
                setCode('');
              }}
              className="glass-btn"
              style={{
                marginBottom: '1.5rem',
                padding: '0.45rem 0.9rem',
                fontSize: '0.78rem',
              }}
            >
              <ArrowLeft size={14} /> Search Another Pass
            </button>
            <DigitalTicketPass registration={ticketData} onClose={onClose} />
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '16px',
                  background: 'rgba(212, 175, 55, 0.12)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: 'var(--gold-bright)',
                }}
              >
                <Ticket size={24} />
              </div>
              <h2 className="font-display gold-text-glow" style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                Find Your Pass
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Enter the unique registration code you received upon booking your event ticket.
              </p>
            </div>

            <form onSubmit={handleLookup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '0.5rem' }}>
                  Registration Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ATHRA-2026-AB12CD"
                  className="glass-input font-mono"
                  style={{
                    letterSpacing: '0.08em',
                    fontSize: '1.05rem',
                    textTransform: 'uppercase',
                  }}
                  autoFocus
                />
              </div>

              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    color: '#F87171',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="glass-btn-gold"
                style={{
                  width: '100%',
                  marginTop: '0.5rem',
                  padding: '0.95rem',
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Loader2 size={16} className="animate-spin" /> Retrieving Pass...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Search size={16} /> View Official Pass
                  </span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
