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
  RefreshCw,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import DigitalTicketPass from '../components/DigitalTicketPass';
import LoadingOverlay from '../components/LoadingOverlay';
import { ASTHRA_LOGO_BASE64 } from '../assets/asthraLogoBase64';

// Canvas-based horizontal ticket stub generator & downloader (Aztec Gold Theme)
const downloadPassImage = (ticket) => {
  if (!ticket || !ticket.registration_code) return;

  const renderAndDownload = (logoImg) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // High-resolution landscape ticket dimensions (880 x 340)
    canvas.width = 880;
    canvas.height = 340;

    // Background Canvas Outer Fill
    ctx.fillStyle = '#0B0A10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ticket Container Dimensions
    const tx = 20;
    const ty = 16;
    const tw = 840;
    const th = 308;
    const r = 18;

    // Rounded Ticket Background
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(tx, ty, tw, th, r);
    ctx.clip();

    // Dark Aztec Gold Gradient
    const bgGrad = ctx.createLinearGradient(tx, ty, tx + tw, ty + th);
    bgGrad.addColorStop(0, '#161420');
    bgGrad.addColorStop(0.45, '#100f18');
    bgGrad.addColorStop(1, '#1f190e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(tx, ty, tw, th);

    // Subtle Ambient Glows
    const glow1 = ctx.createRadialGradient(200, 80, 10, 200, 80, 220);
    glow1.addColorStop(0, 'rgba(212, 175, 55, 0.16)');
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(tx, ty, tw, th);

    const glow2 = ctx.createRadialGradient(700, 260, 10, 700, 260, 180);
    glow2.addColorStop(0, 'rgba(245, 158, 11, 0.12)');
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(tx, ty, tw, th);

    ctx.restore();

    // Ticket Gold Border
    ctx.save();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(tx, ty, tw, th, r);
    ctx.stroke();
    ctx.restore();

    // Perforation Divider (at x = 625)
    const px = 625;
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.65)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(px, ty + 12);
    ctx.lineTo(px, ty + th - 12);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Punch holes along perforation
    ctx.fillStyle = '#0B0A10';
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;

    // Top perforation punch hole
    ctx.beginPath();
    ctx.arc(px, ty, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bottom perforation punch hole
    ctx.beginPath();
    ctx.arc(px, ty + th, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Left Edge Semicircular Notch
    ctx.beginPath();
    ctx.arc(tx, ty + th / 2, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right Edge Scalloped Teeth
    const teethCount = 9;
    const teethStep = (th - 36) / (teethCount - 1);
    for (let i = 0; i < teethCount; i++) {
      const toothY = ty + 18 + i * teethStep;
      ctx.beginPath();
      ctx.arc(tx + tw, toothY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // ════════════════════ MAIN BODY (LEFT) ════════════════════
    // 1. Top Left: Golden Archer Logo + Fest Name + Event Title
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      ctx.drawImage(logoImg, tx + 28, ty + 18, 38, 38);
    } else {
      ctx.fillStyle = '#D4AF37';
      ctx.beginPath();
      ctx.arc(tx + 46, ty + 37, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0B0A10';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('A', tx + 46, ty + 42);
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('ASTHRA 2026 FEST', tx + 76, ty + 30);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 18px sans-serif';
    const eventTitle = (ticket.event_title || 'Fest Event').slice(0, 30);
    ctx.fillText(eventTitle, tx + 76, ty + 50);

    // Confirmed Badge on top right of main body
    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(px - 145, ty + 24, 130, 24, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4ADE80';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✓ CONFIRMED PASS', px - 80, ty + 40);

    // Dotted line under header
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(tx + 28, ty + 68);
    ctx.lineTo(px - 20, ty + 68);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Middle: Participant Name & Registration Code
    const pName = (ticket.team_name || ticket.participant_name || ticket.user_name || ticket.primary_name || 'Participant').toUpperCase();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(ticket.team_name ? 'TEAM / PARTICIPANT' : 'PARTICIPANT NAME', tx + 28, ty + 88);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 21px sans-serif';
    ctx.fillText(pName.slice(0, 24), tx + 28, ty + 114);

    // Registration Code Box
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('REGISTRATION CODE', tx + 360, ty + 88);

    ctx.fillStyle = 'rgba(212, 175, 55, 0.1)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tx + 360, ty + 94, 215, 34, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 17px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(ticket.registration_code || 'ATHRA-2026', tx + 467, ty + 117);

    // Dotted line before bottom card
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(tx + 28, ty + 144);
    ctx.lineTo(px - 20, ty + 144);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Bottom Card: Venue (replacing barcode) & Registration Fee
    const bx = tx + 28;
    const by = ty + 160;
    const bw = px - tx - 48;
    const bh = 118;

    ctx.save();
    ctx.fillStyle = '#FAF8F0';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 12);
    ctx.fill();
    ctx.restore();

    // Venue Icon & Details
    ctx.fillStyle = 'rgba(212, 175, 55, 0.18)';
    ctx.beginPath();
    ctx.arc(bx + 42, by + bh / 2, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#AA820A';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📍', bx + 42, by + bh / 2 + 6);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#777777';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('VENUE / EVENT LOCATION', bx + 78, by + bh / 2 - 12);

    ctx.fillStyle = '#111018';
    ctx.font = '900 17px sans-serif';
    const venueStr = (ticket.venue || 'Campus Main Arena').slice(0, 30);
    ctx.fillText(venueStr, bx + 78, by + bh / 2 + 10);

    // Vertical Divider inside bottom card
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx + bw - 190, by + 16);
    ctx.lineTo(bx + bw - 190, by + bh - 16);
    ctx.stroke();

    // Registration Fee
    ctx.textAlign = 'right';
    ctx.fillStyle = '#777777';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('REGISTRATION FEE', bx + bw - 24, by + bh / 2 - 14);

    const rawFee = ticket.amount_paid ?? ticket.registration_fee ?? ticket.fee ?? ticket.amount ?? 0;
    const numFee = parseFloat(rawFee);
    const feeDisplay = !isNaN(numFee) && numFee > 0 ? `₹${numFee.toFixed(0)}` : 'FREE';

    ctx.fillStyle = '#0B0A10';
    ctx.font = '900 22px monospace';
    ctx.fillText(feeDisplay, bx + bw - 24, by + bh / 2 + 10);

    ctx.fillStyle = '#16A34A';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('✓ Paid & Confirmed', bx + bw - 24, by + bh / 2 + 28);

    // ════════════════════ RIGHT SIDE (AFTER DOTTED LINES) ════════════════════
    // Centered Golden Archer Logo & Fest Name in the middle
    const sx = px + (tx + tw - px) / 2;
    const sy = ty + th / 2;

    // Archer Logo in the Middle of Right Section
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      ctx.drawImage(logoImg, sx - 35, sy - 65, 70, 70);
    } else {
      ctx.save();
      ctx.fillStyle = '#D4AF37';
      ctx.beginPath();
      ctx.arc(sx, sy - 34, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0B0A10';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('A', sx, sy - 26);
      ctx.restore();
    }

    // Fest Name in the Middle
    ctx.textAlign = 'center';
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('OFFICIAL PASS', sx, sy + 22);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 18px sans-serif';
    ctx.fillText('ASTHRA 2026', sx, sy + 42);

    // Trigger Download (Event name followed by the last 6 chars of the registration code)
    try {
      const link = document.createElement('a');
      const rawEvent = (ticket.event_title || ticket.title || 'Event').trim();
      const safeEvent = rawEvent.replace(/[\\/:*?"<>|]/g, '').trim() || 'Ticket';
      const rawCode = (ticket.registration_code || ticket.code || '').trim();
      const last6 = rawCode.length >= 6 ? rawCode.slice(-6) : (rawCode || 'PASS');
      link.download = `${safeEvent}_${last6}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn('Canvas export error:', err);
    }
  };

  let executed = false;
  const safeRenderAndDownload = (img) => {
    if (executed) return;
    executed = true;
    renderAndDownload(img);
  };

  const logo = new Image();
  logo.onload = () => safeRenderAndDownload(logo);
  logo.onerror = () => safeRenderAndDownload(null);
  logo.src = ASTHRA_LOGO_BASE64;
  if (logo.complete) {
    safeRenderAndDownload(logo);
  }
};

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

  const activePassData = fullTicket || {
    registration_code: displayRegCode,
    primary_name: displayParticipant,
    event_title: displayEventTitle,
    college_name: cachedDetails?.college_name || '',
    department: cachedDetails?.department || '',
    payment_status: 'SUCCESS',
    primary_phone: cachedDetails?.primary_phone || '',
    team_name: cachedDetails?.team_name || '',
  };

  const autoDownloadedRef = useRef(false);

  useEffect(() => {
    if (stage === 'success' && displayRegCode && !autoDownloadedRef.current) {
      autoDownloadedRef.current = true;
      setTimeout(() => {
        downloadPassImage(activePassData);
      }, 500);
    }
  }, [stage, displayRegCode, fullTicket, activePassData]);

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
          maxWidth: (stage === 'initiating' || stage === 'verifying') ? '420px' : '520px',
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

        {/* ─────────────────────────────────────────────────────────────
            STAGE 1: INITIATING (Opening payment gateway...)
           ───────────────────────────────────────────────────────────── */}
        {stage === 'initiating' && (
          <div style={{ padding: '0.5rem 0' }}>
            {/* Title: Text Payment gateway, no logo */}
            <h2
              className="font-display gold-text-glow"
              style={{
                fontSize: '1.65rem',
                fontWeight: '800',
                letterSpacing: '0.02em',
                margin: 0,
                color: 'var(--text-white)',
              }}
            >
              Payment gateway
            </h2>

            {/* Spinner between text and button area */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '2.5rem 0',
              }}
            >
              <Loader2
                size={40}
                className="animate-spin"
                color="#D4AF37"
                style={{ filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.4))' }}
              />
            </div>

            {/* Button: Click here if not redirected */}
            <button
              onClick={handleManualOpenGateway}
              className="neu-btn-gold"
              style={{
                width: '100%',
                padding: '0.85rem 1.5rem',
                fontSize: '0.92rem',
                fontWeight: '700',
                borderRadius: '12px',
              }}
            >
              Click here if not redirected
            </button>

            {/* Order Reference Info */}
            {orderId && (
              <div style={{ marginTop: '1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Order Ref: <span className="font-mono" style={{ color: 'var(--gold-bright)', fontWeight: '600' }}>{orderId}</span>
              </div>
            )}

            {/* Mock Mode Simulation helper if running in mock sandbox */}
            {isMock && (
              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <button
                  onClick={() => handleSimulateMock(true)}
                  style={{
                    background: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    color: 'var(--gold-bright)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Simulate Success
                </button>
                <button
                  onClick={() => handleSimulateMock(false)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#EF4444',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Simulate Failure
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STAGE 2: VERIFYING (Waiting for response - 15s Timer)
           ───────────────────────────────────────────────────────────── */}
        {stage === 'verifying' && (
          <div style={{ padding: '0.5rem 0' }}>
            <h2 className="font-display gold-text-glow" style={{ fontSize: '1.65rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-white)' }}>
              Verifying payment...
            </h2>

            {/* Countdown Circular Badge */}
            <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 1.5rem' }}>
              <svg width="90" height="90" viewBox="0 0 100 100">
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
                <span className="font-mono" style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--gold-bright)' }}>
                  {timeLeft}s
                </span>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 auto', maxWidth: '340px', lineHeight: 1.5 }}>
              Please wait while your transaction is being verified with Cashfree.
            </p>
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
              Your transaction has been verified and your pass is ready.
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
                  Registration code
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
                onClick={() => downloadPassImage(activePassData)}
                className="neu-btn-gold"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: '700',
                }}
              >
                <Download size={18} />
                <span>Download Pass</span>
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="neu-btn"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  color: 'var(--gold-bright)',
                  borderColor: 'rgba(212, 175, 55, 0.4)',
                  background: 'rgba(212, 175, 55, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>Go home</span>
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
          <div style={{ maxHeight: '90vh', overflowY: 'auto', width: '100%', maxWidth: '860px' }}>
            <DigitalTicketPass 
              registration={fullTicket} 
              onClose={() => setShowTicketModal(false)} 
              onDownload={() => downloadPassImage(fullTicket)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
