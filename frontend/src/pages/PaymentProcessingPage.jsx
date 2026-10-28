import React, { useState, useEffect, useRef } from 'react';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  ArrowLeft, 
  ShieldCheck, 
  Ticket, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import AsthraLogo from '../components/AsthraLogo';
import DigitalTicketPass from '../components/DigitalTicketPass';
import LoadingOverlay from '../components/LoadingOverlay';

export default function PaymentProcessingPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const isProcessRoute = window.location.pathname.startsWith('/payment/process');
  
  // Params for initiating checkout
  const sessionId = urlParams.get('session_id') || '';
  const initialOrderId = urlParams.get('order_id') || '';
  const envMode = urlParams.get('env') === 'production' ? 'production' : 'sandbox';
  const paramEventTitle = urlParams.get('event') || '';
  const paramAmount = urlParams.get('amount') || '';

  // Current stage: 'initiating' | 'verifying' | 'success' | 'failed' | 'timeout'
  const [stage, setStage] = useState(() => (isProcessRoute ? 'initiating' : 'verifying'));
  const [timeLeft, setTimeLeft] = useState(15);
  const [verifyResult, setVerifyResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [fullTicket, setFullTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [manualRetrying, setManualRetrying] = useState(false);

  const orderId = initialOrderId || (verifyResult ? verifyResult.order_id : '');
  const isMock = sessionId.startsWith('session_mock_') || initialOrderId.startsWith('MOCK_');

  // Load cached registration details from sessionStorage if available
  const [cachedDetails, setCachedDetails] = useState(() => {
    if (!initialOrderId) return null;
    try {
      const raw = sessionStorage.getItem(`payment_reg_${initialOrderId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 1. INITIATING STAGE (Opening payment gateway)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isProcessRoute || stage !== 'initiating') return;

    if (isMock) {
      // Mock mode: provide simulation option or auto-redirect
      return;
    }

    if (!sessionId) {
      setErrorMessage('Missing payment session ID. Please return to the event page and try registering again.');
      setStage('failed');
      return;
    }

    // Launch Cashfree SDK checkout with _self (full tab redirect to Cashfree)
    const timer = setTimeout(() => {
      if (window.Cashfree) {
        try {
          const cashfree = window.Cashfree({ mode: envMode });
          cashfree.checkout({
            paymentSessionId: sessionId,
            redirectTarget: '_self',
          });
        } catch (err) {
          console.error('Failed to trigger Cashfree checkout:', err);
          setErrorMessage('Could not launch payment gateway: ' + (err.message || 'SDK error'));
        }
      } else {
        setErrorMessage('Cashfree Payment Gateway SDK could not be loaded. Please check your internet connection.');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [isProcessRoute, stage, sessionId, envMode, isMock]);

  // Manual trigger for opening gateway if auto-redirect was delayed
  const handleManualOpenGateway = () => {
    if (!window.Cashfree) {
      alert('Cashfree SDK is still loading, please wait a moment.');
      return;
    }
    try {
      const cashfree = window.Cashfree({ mode: envMode });
      cashfree.checkout({
        paymentSessionId: sessionId,
        redirectTarget: '_self',
      });
    } catch (err) {
      alert('Error launching gateway: ' + err.message);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. VERIFYING STAGE (Awaiting gateway response - 15s Timer)
  // ─────────────────────────────────────────────────────────────
  const pollingRef = useRef(null);
  const timerRef = useRef(null);

  const startVerificationProcess = () => {
    if (!orderId) {
      setStage('failed');
      setErrorMessage('No Order ID found in return URL. Could not verify payment.');
      return;
    }

    setStage('verifying');
    setTimeLeft(15);
    setErrorMessage(null);

    // Countdown timer for 15 seconds
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Immediate check + polling every 2.5 seconds
    const checkPayment = async () => {
      try {
        const res = await api.verifyPayment(orderId);
        setVerifyResult(res);

        if (res.payment_status === 'SUCCESS' || res.success) {
          // Cleared! Success!
          clearInterval(timerRef.current);
          clearInterval(pollingRef.current);
          setStage('success');

          // Clear saved draft on success
          const clearEventId = urlParams.get('event_id') || cachedDetails?.event_id;
          if (clearEventId) {
            try {
              sessionStorage.removeItem(`event_form_${clearEventId}`);
            } catch (e) {}
          }

          // Fetch full ticket pass details
          if (res.registration_code) {
            try {
              const ticket = await api.getRegistrationByCode(res.registration_code);
              setFullTicket(ticket);
            } catch (tErr) {
              console.log('Ticket fetch error:', tErr);
            }
          }
        } else if (res.payment_status === 'FAILED') {
          clearInterval(timerRef.current);
          clearInterval(pollingRef.current);
          setStage('failed');
          setErrorMessage(res.message || 'Payment was declined or cancelled.');
        }
        // If PENDING, keep polling until timer hits 0
      } catch (err) {
        console.error('Verify error:', err);
      }
    };

    checkPayment();
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(checkPayment, 2500);
  };

  // Trigger verification if we are on /payment/status
  useEffect(() => {
    if (!isProcessRoute && stage === 'verifying') {
      startVerificationProcess();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isProcessRoute, initialOrderId]);

  // When timer hits 0, if still in verifying stage, transition to timeout!
  useEffect(() => {
    if (stage === 'verifying' && timeLeft === 0) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      setStage('timeout');
    }
  }, [stage, timeLeft]);

  const copyRegistrationCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRetryVerification = async () => {
    setManualRetrying(true);
    startVerificationProcess();
    setTimeout(() => setManualRetrying(false), 800);
  };

  const handleTryAgain = () => {
    const targetEventId = urlParams.get('event_id') || cachedDetails?.event_id || '';
    if (targetEventId) {
      window.location.href = `/?retry_event=${encodeURIComponent(targetEventId)}`;
    } else {
      window.location.href = '/';
    }
  };

  // Mock testing helper
  const handleSimulateMock = (success) => {
    if (success) {
      window.location.href = `/payment/status?order_id=${encodeURIComponent(orderId || 'MOCK_ORDER_101')}`;
    } else {
      setStage('failed');
      setErrorMessage('User simulated a payment failure.');
    }
  };

  const displayEventTitle = verifyResult?.event_title || paramEventTitle || cachedDetails?.event_title || 'Fest Event Registration';
  const displayAmount = verifyResult?.order_amount || paramAmount || cachedDetails?.amount || '';
  const displayRegCode = verifyResult?.registration_code || cachedDetails?.registration_code || '';
  const displayParticipant = verifyResult?.participant_name || cachedDetails?.primary_name || '';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 20%, #17151e 0%, #09090e 70%, #050508 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative',
    }}>
      {/* Loading Overlay for Manual Status Check */}
      <LoadingOverlay
        active={manualRetrying}
        message="Re-checking Payment..."
        subtext="Querying Cashfree gateway for transaction receipt..."
      />

      {/* Background Decorative Rings */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none',
      }} />

      {/* Main Container Card */}
      <div
        className="payment-card-responsive"
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'rgba(18, 17, 24, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(212, 175, 55, 0.1)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >

        {/* Fest Header */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
          <AsthraLogo size={36} />
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-bright)', fontWeight: '700' }}>
              ASTHRA 2026 FEST
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff', letterSpacing: '0.05em' }}>
              SECURE PAYMENT GATEWAY
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            STAGE 1: INITIATING (Opening payment gateway...)
           ───────────────────────────────────────────────────────────── */}
        {stage === 'initiating' && (
          <div>
            {/* Animated Pulse Icon */}
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'rgba(212, 175, 55, 0.1)',
              border: '2px solid rgba(212, 175, 55, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                inset: '-8px',
                borderRadius: '50%',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                animation: 'spin 4s linear infinite',
              }} />
              <Loader2 size={40} className="animate-spin" color="#D4AF37" />
            </div>

            <h2 className="font-display gold-text-glow" style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              Opening Payment Gateway...
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Connecting to <strong>Cashfree Secure Checkout</strong>. Please do not close or refresh this tab.
            </p>

            {/* Event & Amount Summary Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '16px',
              padding: '1.25rem',
              marginBottom: '1.75rem',
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Event</span>
                <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>{displayEventTitle}</span>
              </div>
              {displayAmount && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Amount Payable</span>
                  <span style={{ color: 'var(--gold-bright)', fontSize: '1.05rem', fontWeight: '800' }}>₹{displayAmount}</span>
                </div>
              )}
              {orderId && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Order Ref</span>
                  <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{orderId}</span>
                </div>
              )}
            </div>

            {/* Mock Mode Helper */}
            {isMock ? (
              <div style={{ padding: '1rem', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '14px', border: '1px dashed #D4AF37', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#D4AF37', fontWeight: '700', marginBottom: '0.6rem' }}>
                  MOCK TESTING MODE DETECTED
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button onClick={() => handleSimulateMock(true)} className="neu-btn-gold" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                    Simulate Success
                  </button>
                  <button onClick={() => handleSimulateMock(false)} className="neu-btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444' }}>
                    Simulate Failure
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button
                  onClick={handleManualOpenGateway}
                  className="neu-btn-gold"
                  style={{ width: '100%', padding: '0.8rem', fontSize: '0.9rem', marginBottom: '0.75rem' }}
                >
                  Click Here if Gateway Does Not Open Automatically
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Cancel & Return to Events
                </button>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <ShieldCheck size={14} color="#10b981" />
              <span>256-Bit SSL Encrypted Cashfree Payment Gateway</span>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STAGE 2: VERIFYING (Waiting for response - 15s Timer)
           ───────────────────────────────────────────────────────────── */}
        {stage === 'verifying' && (
          <div>
            {/* Countdown Circular Badge */}
            <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 1.5rem' }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="url(#goldGradient)"
                  strokeWidth="6"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * timeLeft) / 15}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F5D061" />
                    <stop offset="100%" stopColor="#D4AF37" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span className="font-mono" style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--gold-bright)' }}>
                  {timeLeft}s
                </span>
              </div>
            </div>

            <h2 className="font-display gold-text-glow" style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              Verifying Payment...
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Communicating with Cashfree to verify transaction status. Waiting for confirmation ({timeLeft}s remaining)...
            </p>

            {/* Dynamic Status Progress Bar */}
            <div style={{
              width: '100%',
              height: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '999px',
              overflow: 'hidden',
              marginBottom: '1.5rem',
            }}>
              <div style={{
                height: '100%',
                width: `${(timeLeft / 15) * 100}%`,
                background: 'linear-gradient(90deg, #D4AF37, #F5D061)',
                transition: 'width 1s linear',
              }} />
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '14px',
              padding: '1rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#F5D061' }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Checking payment status with Cashfree Gateway</span>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STAGE 3: SUCCESS (Payment Confirmed & Verified)
           ───────────────────────────────────────────────────────────── */}
        {stage === 'success' && (
          <div>
            {/* Green / Gold Celebration Badge */}
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '2px solid rgba(16, 185, 129, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.25)',
            }}>
              <CheckCircle2 size={46} color="#10b981" />
            </div>

            <div style={{
              display: 'inline-block',
              padding: '0.3rem 0.8rem',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '0.75rem',
            }}>
              Payment Confirmed
            </div>

            <h2 className="font-display gold-text-glow" style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              Registration Successful!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Your transaction has been verified by Cashfree and your festival pass is ready.
            </p>

            {/* Registration Code Showcase */}
            {displayRegCode && (
              <div style={{
                background: 'rgba(212, 175, 55, 0.08)',
                border: '1px dashed rgba(212, 175, 55, 0.4)',
                borderRadius: '16px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '700', marginBottom: '0.35rem' }}>
                  Official Registration Code
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <span className="font-mono" style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', letterSpacing: '0.05em' }}>
                    {displayRegCode}
                  </span>
                  <button
                    onClick={() => copyRegistrationCode(displayRegCode)}
                    title="Copy Registration Code"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '0.4rem',
                      cursor: 'pointer',
                      color: copiedCode ? '#10b981' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Summary Details */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '14px',
              padding: '1rem',
              marginBottom: '1.75rem',
              textAlign: 'left',
              fontSize: '0.85rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Event</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>{displayEventTitle}</span>
              </div>
              {displayParticipant && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Participant</span>
                  <span style={{ color: '#fff' }}>{displayParticipant}</span>
                </div>
              )}
              {displayAmount && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Amount Paid</span>
                  <span style={{ color: 'var(--gold-bright)', fontWeight: '700' }}>₹{displayAmount}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => setShowTicketModal(true)}
                className="neu-btn-gold"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <Ticket size={18} />
                <span>View & Print Entry Pass</span>
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="neu-btn-outline"
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem' }}
              >
                Return to Fest Portal
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STAGE 4: FAILED (Payment Declined or Cancelled)
           ───────────────────────────────────────────────────────────── */}
        {stage === 'failed' && (
          <div>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '2px solid rgba(239, 68, 68, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)',
            }}>
              <XCircle size={46} color="#ef4444" />
            </div>

            <div style={{
              display: 'inline-block',
              padding: '0.3rem 0.8rem',
              borderRadius: '999px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '0.75rem',
            }}>
              Payment Failed
            </div>

            <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', marginBottom: '0.5rem' }}>
              Transaction Unsuccessful
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              {errorMessage || 'The transaction was declined by the bank or cancelled before completion.'}
            </p>

            {orderId && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '0.85rem',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: '1.5rem',
              }}>
                Order Reference: <span className="font-mono" style={{ color: '#fff' }}>{orderId}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={handleTryAgain}
                className="neu-btn-gold"
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem' }}
              >
                Try Registering Again
              </button>
              <button
                onClick={handleRetryVerification}
                disabled={manualRetrying}
                className="neu-btn-outline"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <RefreshCw size={14} className={manualRetrying ? 'animate-spin' : ''} />
                <span>Re-Check Payment Status</span>
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STAGE 5: TIMEOUT (15s Elapsed with No Definite Gateway Result)
           ───────────────────────────────────────────────────────────── */}
        {stage === 'timeout' && (
          <div>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '2px solid rgba(245, 158, 11, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 0 30px rgba(245, 158, 11, 0.2)',
            }}>
              <Clock size={46} color="#f59e0b" />
            </div>

            <div style={{
              display: 'inline-block',
              padding: '0.3rem 0.8rem',
              borderRadius: '999px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '0.75rem',
            }}>
              Verification Timeout (15s)
            </div>

            <h2 className="font-display gold-text-glow" style={{ fontSize: '1.45rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              Status Pending Confirmation
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              We waited 15 seconds, but Cashfree has not sent a final payment confirmation yet. 
              <br /><br />
              <strong style={{ color: '#fff' }}>Did your money get deducted?</strong>
              <br />
              Don't worry! Cashfree will notify our server via asynchronous webhook, and your registration ticket will automatically be confirmed.
            </p>

            {orderId && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '0.85rem',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: '1.5rem',
              }}>
                Keep your Order ID for reference: <br />
                <span className="font-mono" style={{ color: 'var(--gold-bright)', fontWeight: '700' }}>{orderId}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={handleRetryVerification}
                disabled={manualRetrying}
                className="neu-btn-gold"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <RefreshCw size={16} className={manualRetrying ? 'animate-spin' : ''} />
                <span>Check Payment Status Again</span>
              </button>
              <button
                onClick={handleTryAgain}
                className="neu-btn-outline"
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem' }}
              >
                Return to Registration Form
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Ticket Pass Modal if user clicks 'View & Print Entry Pass' */}
      {showTicketModal && fullTicket && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div style={{ maxHeight: '90vh', overflowY: 'auto', width: '100%', maxWidth: '700px' }}>
            <DigitalTicketPass registration={fullTicket} onClose={() => setShowTicketModal(false)} />
          </div>
        </div>
      )}

    </div>
  );
}
