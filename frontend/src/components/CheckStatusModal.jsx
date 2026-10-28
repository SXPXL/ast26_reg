import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import DigitalTicketPass from './DigitalTicketPass';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  Ticket,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Calendar,
  Building,
} from 'lucide-react';

export default function CheckStatusModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [emailInput, setEmailInput] = useState(() => {
    try {
      const raw = localStorage.getItem('asthra_user_profile');
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.primary_email || '';
      }
    } catch {
      // ignore
    }
    return '';
  });

  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState([]);
  const [recheckingId, setRecheckingId] = useState(null);
  const [selectedPass, setSelectedPass] = useState(null);

  // Auto-search if email is prefilled from localStorage on modal open
  useEffect(() => {
    if (emailInput && emailInput.trim().includes('@')) {
      handleSearch(emailInput.trim());
    }
  }, []);

  const handleSearch = async (emailToQuery) => {
    const targetEmail = (emailToQuery !== undefined ? emailToQuery : emailInput).trim();
    if (!targetEmail) {
      toastError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      const data = await api.getRegistrationsByEmail(targetEmail);
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to lookup registrations:', err);
      toastError(err.message || 'Could not fetch registration status');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecheckPayment = async (reg) => {
    try {
      setRecheckingId(reg.id);
      const res = await api.recheckRegistrationPayment(reg.id);

      if (res.success && res.payment_status === 'SUCCESS') {
        toastSuccess('Payment confirmed! Your registration pass is now active.');
        // Update local status in results list
        setResults((prev) =>
          prev.map((item) =>
            item.id === reg.id ? { ...item, payment_status: 'SUCCESS' } : item
          )
        );
      } else {
        toastInfo(res.message || `Current payment status: ${res.payment_status}`);
      }
    } catch (err) {
      console.error('Recheck payment error:', err);
      toastError(err.message || 'Failed to recheck payment with gateway');
    } finally {
      setRecheckingId(null);
    }
  };

  return (
    <div
      className="responsive-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3, 3, 5, 0.88)',
        backdropFilter: 'blur(12px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        className="responsive-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur-lg)',
          WebkitBackdropFilter: 'var(--glass-blur-lg)',
          borderRadius: '24px',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(212, 175, 55, 0.15)',
          maxWidth: selectedPass ? '680px' : '720px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '2.25rem',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={selectedPass ? () => setSelectedPass(null) : onClose}
          aria-label="Close"
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
            transition: 'all 0.2s ease',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-white)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'var(--bg-inset)';
          }}
        >
          {selectedPass ? <ArrowLeft size={18} /> : <X size={18} />}
        </button>

        {/* If a digital pass is selected to view */}
        {selectedPass ? (
          <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => setSelectedPass(null)}
                style={{
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  color: 'var(--gold-bright)',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} />
                Back to Registrations
              </button>
            </div>
            <DigitalTicketPass registration={selectedPass} onClose={() => setSelectedPass(null)} />
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h2
                className="font-display gold-text-glow"
                style={{
                  fontSize: '1.65rem',
                  fontWeight: '800',
                  margin: '0 0 0.4rem 0',
                }}
              >
                Check Registration Status
              </h2>
              <p
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Enter the email address you used during event registration to view your entry passes and payment status.
              </p>
            </div>

            {/* Email Search Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              style={{
                display: 'flex',
                gap: '0.65rem',
                marginBottom: '1.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ position: 'relative', flex: '1 1 280px' }}>
                <input
                  type="email"
                  placeholder="Enter your registered email..."
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="neu-input"
                  required
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    fontSize: '0.92rem',
                  }}
                />
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.9rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)',
                  color: '#000',
                  border: 'none',
                  padding: '0 1.6rem',
                  minHeight: '44px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 18px rgba(212, 175, 55, 0.35)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(212, 175, 55, 0.55)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.boxShadow = '0 4px 18px rgba(212, 175, 55, 0.35)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <Search size={16} />
                <span>{loading ? 'Searching...' : 'Check Status'}</span>
              </button>
            </form>

            {/* Content area */}
            {loading ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.95rem',
                }}
              >
                <div style={{ color: 'var(--gold-bright)', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Searching registrations...
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Looking up entries for {emailInput}
                </div>
              </div>
            ) : hasSearched && results.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '16px',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                }}
              >
                <AlertTriangle size={36} color="#EAB308" style={{ margin: '0 auto 0.75rem auto' }} />
                <h4 style={{ color: 'var(--text-white)', fontSize: '1.1rem', marginBottom: '0.4rem' }}>
                  No Registrations Found
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
                  We couldn't find any registrations under <strong style={{ color: 'var(--text-white)' }}>{emailInput}</strong>. Please ensure the email address matches what you entered during registration.
                </p>
              </div>
            ) : results.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: '700',
                  }}
                >
                  Found {results.length} Registration{results.length > 1 ? 's' : ''}
                </div>

                {results.map((reg) => {
                  const isSuccess = reg.payment_status === 'SUCCESS';
                  const isPending = reg.payment_status === 'PENDING';
                  const isRechecking = recheckingId === reg.id;

                  return (
                    <div
                      key={reg.id}
                      style={{
                        background: 'rgba(18, 18, 28, 0.7)',
                        borderRadius: '16px',
                        border: isSuccess
                          ? '1px solid rgba(34, 197, 94, 0.3)'
                          : '1px solid rgba(212, 175, 55, 0.25)',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Top Row: Event Title + Status Badge */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                background: 'rgba(212, 175, 55, 0.12)',
                                border: '1px solid rgba(212, 175, 55, 0.3)',
                                color: 'var(--gold-bright)',
                                fontWeight: '700',
                                fontFamily: 'monospace',
                              }}
                            >
                              {reg.registration_code}
                            </span>
                            {reg.team_name && (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '6px',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                Team: {reg.team_name}
                              </span>
                            )}
                          </div>
                          <h3
                            style={{
                              fontSize: '1.15rem',
                              fontWeight: '700',
                              color: 'var(--text-white)',
                              margin: 0,
                            }}
                          >
                            {reg.event_title || reg.event?.title || 'Fest Event'}
                          </h3>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isSuccess ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '9999px',
                                background: 'rgba(34, 197, 94, 0.15)',
                                border: '1px solid rgba(34, 197, 94, 0.4)',
                                color: '#4ADE80',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                letterSpacing: '0.04em',
                              }}
                            >
                              <CheckCircle2 size={14} />
                              Confirmed / Paid
                            </span>
                          ) : isPending ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '9999px',
                                background: 'rgba(234, 179, 8, 0.15)',
                                border: '1px solid rgba(234, 179, 8, 0.4)',
                                color: '#FACC15',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                letterSpacing: '0.04em',
                              }}
                            >
                              <Clock size={14} />
                              Payment Pending
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '9999px',
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#F87171',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                letterSpacing: '0.04em',
                              }}
                            >
                              <AlertTriangle size={14} />
                              {reg.payment_status}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info Row: College, Date, Payment Mode */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1.25rem',
                          flexWrap: 'wrap',
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Building size={14} />
                          <span>{reg.college_name || 'Marian College'}</span>
                        </div>
                        {reg.created_at && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Calendar size={14} />
                            <span>{new Date(reg.created_at).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div>
                          Mode:{' '}
                          <span style={{ color: 'var(--text-white)', fontWeight: '600' }}>
                            {reg.payment_mode || 'ONLINE'}
                          </span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '0.75rem',
                          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                          paddingTop: '0.85rem',
                        }}
                      >
                        {/* Requirement: If success, do NOT show reload button. Show digital pass button. */}
                        {isSuccess ? (
                          <button
                            type="button"
                            onClick={() => setSelectedPass(reg)}
                            style={{
                              background: 'linear-gradient(135deg, #D4AF37, #AA7C11)',
                              color: '#000',
                              border: 'none',
                              padding: '0.5rem 1.1rem',
                              borderRadius: '10px',
                              fontWeight: '700',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              boxShadow: '0 4px 14px rgba(212, 175, 55, 0.25)',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Ticket size={15} />
                            <span>View Digital Pass</span>
                            <ChevronRight size={14} />
                          </button>
                        ) : (
                          /* If NOT success, show styled Check Payment Status button */
                          <button
                            type="button"
                            disabled={isRechecking}
                            onClick={() => handleRecheckPayment(reg)}
                            style={{
                              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.16) 0%, rgba(170, 124, 17, 0.28) 100%)',
                              border: '1.5px solid rgba(212, 175, 55, 0.5)',
                              color: 'var(--gold-bright)',
                              padding: '0.55rem 1.25rem',
                              borderRadius: '12px',
                              fontWeight: '700',
                              fontSize: '0.84rem',
                              cursor: isRechecking ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.55rem',
                              opacity: isRechecking ? 0.7 : 1,
                              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35), 0 0 12px rgba(212, 175, 55, 0.15)',
                              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                              letterSpacing: '0.02em',
                            }}
                            onMouseEnter={(e) => {
                              if (!isRechecking) {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)';
                                e.currentTarget.style.color = '#000';
                                e.currentTarget.style.borderColor = 'var(--gold-bright)';
                                e.currentTarget.style.boxShadow = '0 0 22px rgba(212, 175, 55, 0.45)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isRechecking) {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.16) 0%, rgba(170, 124, 17, 0.28) 100%)';
                                e.currentTarget.style.color = 'var(--gold-bright)';
                                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.35), 0 0 12px rgba(212, 175, 55, 0.15)';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }
                            }}
                            title="Recheck payment status with Cashfree"
                          >
                            <RotateCw
                              size={15}
                              style={{
                                animation: isRechecking ? 'spin 1s linear infinite' : 'none',
                              }}
                            />
                            <span>{isRechecking ? 'Checking Payment...' : 'Check Payment Status'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

