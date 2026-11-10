import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  Loader2,
  Download,
  Share2,
  Sparkles,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  EyeOff,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import AsthraLogo from '../components/AsthraLogo';
import { ASTHRA_LOGO_BASE64 } from '../assets/asthraLogoBase64';

// Quick Preset Contribution Amounts
const PRESET_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

// High-Resolution Aztec Gold Charity Donor Ticket Generator & Downloader
const downloadCharityPassImage = (donation) => {
  if (!donation || !donation.donation_code) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 900;
  canvas.height = 360;

  // Background Outer Fill
  ctx.fillStyle = '#08080C';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tx = 20;
  const ty = 18;
  const tw = 860;
  const th = 324;
  const r = 20;

  // Clip Rounded Card
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(tx, ty, tw, th, r);
  ctx.clip();

  // Dark Obsidian to Aztec Gold Gradient
  const bgGrad = ctx.createLinearGradient(tx, ty, tx + tw, ty + th);
  bgGrad.addColorStop(0, '#151320');
  bgGrad.addColorStop(0.5, '#0E0D15');
  bgGrad.addColorStop(1, '#1E190E');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(tx, ty, tw, th);

  // Radiant Golden Glows
  const glow1 = ctx.createRadialGradient(220, 90, 10, 220, 90, 240);
  glow1.addColorStop(0, 'rgba(212, 175, 55, 0.18)');
  glow1.addColorStop(1, 'transparent');
  ctx.fillStyle = glow1;
  ctx.fillRect(tx, ty, tw, th);

  const glow2 = ctx.createRadialGradient(720, 260, 10, 720, 260, 200);
  glow2.addColorStop(0, 'rgba(245, 158, 11, 0.14)');
  glow2.addColorStop(1, 'transparent');
  ctx.fillStyle = glow2;
  ctx.fillRect(tx, ty, tw, th);

  ctx.restore();

  // Outer Gold Border
  ctx.save();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(tx, ty, tw, th, r);
  ctx.stroke();
  ctx.restore();

  // Perforation Divider (at x = 640)
  const px = 640;
  ctx.save();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(px, ty + 14);
  ctx.lineTo(px, ty + th - 14);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Punch Holes Along Divider
  ctx.fillStyle = '#08080C';
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.arc(px, ty, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(px, ty + th, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Left Notch
  ctx.beginPath();
  ctx.arc(tx, ty + th / 2, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw Logo Image
  const drawContent = (logoImg) => {
    // 1. Header (Left Body)
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      ctx.drawImage(logoImg, tx + 30, ty + 20, 42, 42);
    } else {
      ctx.fillStyle = '#D4AF37';
      ctx.beginPath();
      ctx.arc(tx + 51, ty + 41, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('ASTHRA 2026 FEST', tx + 84, ty + 34);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 19px sans-serif';
    ctx.fillText('ASTHRA CARE INITIATIVE', tx + 84, ty + 54);

    // Donor Badge
    ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(px - 170, ty + 24, 150, 26, 13);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ OFFICIAL DONOR PASS', px - 95, ty + 41);

    // Horizontal Divider
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(tx + 30, ty + 74);
    ctx.lineTo(px - 20, ty + 74);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Donor Info
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '11px sans-serif';
    ctx.fillText('CONTRIBUTOR NAME', tx + 34, ty + 104);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px sans-serif';
    const donorName = (donation.donor_name || 'Generous Contributor').slice(0, 32);
    ctx.fillText(donorName, tx + 34, ty + 130);

    // Contribution Amount Highlight Box
    ctx.fillStyle = 'rgba(212, 175, 55, 0.1)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(tx + 34, ty + 150, 260, 76, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('CONTRIBUTION AMOUNT', tx + 48, ty + 172);

    ctx.fillStyle = '#34D399';
    ctx.font = '900 28px sans-serif';
    ctx.fillText(`₹ ${Number(donation.amount || 0).toLocaleString('en-IN')}`, tx + 48, ty + 208);

    // Donation Code Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.beginPath();
    ctx.roundRect(tx + 310, ty + 150, 290, 76, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '11px sans-serif';
    ctx.fillText('DONATION CODE', tx + 324, ty + 172);

    ctx.fillStyle = '#F3F4F6';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(donation.donation_code || 'CARE-XXXXXX', tx + 324, ty + 204);

    // Heartfelt appreciation footer
    ctx.fillStyle = '#D1D5DB';
    ctx.font = 'italic 12px sans-serif';
    ctx.fillText('“Thank you for being the spark that empowers lives and builds a brighter tomorrow.”', tx + 34, ty + 258);

    ctx.fillStyle = '#6B7280';
    ctx.font = '10px sans-serif';
    const dateStr = donation.created_at ? new Date(donation.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) : new Date().toLocaleDateString('en-IN');
    ctx.fillText(`Date: ${dateStr} • Asthra Care Welfare Fund`, tx + 34, ty + 284);

    // ════════════════════ RIGHT STUB ════════════════════
    const stubCenter = px + (tx + tw - px) / 2;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#D4AF37';
    ctx.font = '900 14px sans-serif';
    ctx.fillText('ASTHRA CARE', stubCenter, ty + 50);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '11px sans-serif';
    ctx.fillText('DONOR RECEIPT', stubCenter, ty + 70);

    // Golden decorative divider
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.beginPath();
    ctx.moveTo(stubCenter - 50, ty + 88);
    ctx.lineTo(stubCenter + 50, ty + 88);
    ctx.stroke();

    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('CONTRIBUTED', stubCenter, ty + 120);

    ctx.fillStyle = '#34D399';
    ctx.font = '900 24px sans-serif';
    ctx.fillText(`₹ ${Number(donation.amount || 0).toLocaleString('en-IN')}`, stubCenter, ty + 152);

    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(stubCenter - 65, ty + 175, 130, 28, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4ADE80';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('✓ CONFIRMED', stubCenter, ty + 193);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '10px monospace';
    ctx.fillText(donation.donation_code || '', stubCenter, ty + 235);

    ctx.fillStyle = '#6B7280';
    ctx.font = '9px sans-serif';
    ctx.fillText('ASTHRA 2026', stubCenter, ty + 255);

    // Trigger Download
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    const cleanCode = (donation.donation_code || 'PASS').replace(/[^a-zA-Z0-9_-]/g, '');
    a.download = `AsthraCare_DonorPass_${cleanCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const img = new Image();
  let executed = false;
  img.onload = () => {
    if (!executed) {
      executed = true;
      drawContent(img);
    }
  };
  img.onerror = () => {
    if (!executed) {
      executed = true;
      drawContent(null);
    }
  };
  img.src = ASTHRA_LOGO_BASE64;
  if (img.complete && img.naturalWidth > 0 && !executed) {
    executed = true;
    drawContent(img);
  }
};

export default function CharityDonationPage() {
  // Amount state
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');

  // Donor Details Modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Checkout & Stage state: 'input' | 'processing' | 'verifying' | 'success' | 'failed'
  const [stage, setStage] = useState('input');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [donationData, setDonationData] = useState(null);
  const [pendingOrderId, setPendingOrderId] = useState('');

  // Check URL parameters on mount (if Cashfree redirects back with ?order_id=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id');
    if (orderId) {
      setPendingOrderId(orderId);
      verifyOrder(orderId);
    }
  }, []);

  // Verify order with backend
  const verifyOrder = async (orderId) => {
    setStage('verifying');
    setStatusMessage('Verifying your generous contribution with Cashfree...');
    setErrorMessage('');

    try {
      const res = await api.verifyCharityPayment(orderId);
      if (res.status === 'SUCCESS' || res.success) {
        setDonationData(res);
        setStage('success');
      } else if (res.status === 'FAILED') {
        setStage('failed');
        setErrorMessage(res.message || 'Payment was unsuccessful or cancelled.');
      } else {
        // Pending: poll once more after 3 seconds
        setTimeout(async () => {
          try {
            const retryRes = await api.verifyCharityPayment(orderId);
            if (retryRes.status === 'SUCCESS' || retryRes.success) {
              setDonationData(retryRes);
              setStage('success');
            } else {
              setStage('failed');
              setErrorMessage('Payment is still pending gateway confirmation. Please check with your bank.');
            }
          } catch (err) {
            setStage('failed');
            setErrorMessage(err.message || 'Verification timed out.');
          }
        }, 3000);
      }
    } catch (err) {
      console.error('Charity payment verification failed:', err);
      setStage('failed');
      setErrorMessage(err.message || 'Unable to verify contribution status.');
    }
  };

  // Handle Preset amount click
  const handleSelectPreset = (val) => {
    setAmount(val.toString());
    setAmountError('');
  };

  // Validate amount and open details modal
  const handleProceedToDetails = (e) => {
    if (e) e.preventDefault();
    const num = parseFloat(amount);
    if (!num || isNaN(num) || num <= 0) {
      setAmountError('Please enter a valid contribution amount (minimum ₹1).');
      return;
    }
    setAmountError('');
    setDetailsModalOpen(true);
  };

  // Validate donor form fields
  const validateForm = () => {
    if (isAnonymous) {
      setFormErrors({});
      return true;
    }
    const errors = {};
    if (!donorName.trim() || donorName.trim().length < 2) {
      errors.name = 'Please enter your full name (or select Donate Anonymously).';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!donorEmail.trim() || !emailRegex.test(donorEmail.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    const phoneRegex = /^[0-9]{10,15}$/;
    const cleanPhone = donorPhone.replace(/[\s+-]/g, '');
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      errors.phone = 'Please enter a valid 10-digit phone number.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Trigger donation creation & Cashfree Checkout
  const handleInitiatePayment = async () => {
    if (!validateForm()) return;

    setDetailsModalOpen(false);
    setStage('processing');
    setStatusMessage('Initiating secure payment session...');
    setErrorMessage('');

    try {
      const payload = {
        donor_name: isAnonymous ? 'Anonymous Contributor' : (donorName.trim() || 'Anonymous Contributor'),
        donor_email: isAnonymous ? '' : donorEmail.trim().toLowerCase(),
        donor_phone: isAnonymous ? '' : donorPhone.replace(/[\s+-]/g, ''),
        amount: parseFloat(amount),
        is_anonymous: isAnonymous,
      };

      const result = await api.createCharityDonation(payload);

      // Handle mock gateway mode
      if (result.is_mock) {
        setStatusMessage('Confirming mock transaction...');
        setTimeout(() => {
          verifyOrder(result.order_id);
        }, 1000);
        return;
      }

      const sessionId = result.payment_session_id;
      const orderId = result.order_id;
      const envMode = result.environment === 'production' ? 'production' : 'sandbox';
      setPendingOrderId(orderId);

      // Launch Cashfree SDK Checkout
      if (window.Cashfree) {
        try {
          const cashfree = window.Cashfree({ mode: envMode });
          cashfree.checkout({
            paymentSessionId: sessionId,
            redirectTarget: '_modal',
          }).then((res) => {
            // Callback when modal finishes or closes
            if (res && res.paymentDetails) {
              verifyOrder(orderId);
            } else if (res && res.error) {
              setStage('failed');
              setErrorMessage(res.error.message || 'Payment window closed or cancelled.');
            } else {
              // Check status anyway
              verifyOrder(orderId);
            }
          });
        } catch (sdkErr) {
          console.warn('Cashfree modal open error, falling back to tab redirect:', sdkErr);
          // Fallback to full page redirect if modal fails
          const cashfree = window.Cashfree({ mode: envMode });
          cashfree.checkout({
            paymentSessionId: sessionId,
            redirectTarget: '_self',
          });
        }
      } else {
        throw new Error('Cashfree Payment Gateway SDK not loaded. Please refresh the page.');
      }
    } catch (err) {
      console.error('Charity checkout error:', err);
      setStage('failed');
      setErrorMessage(err.message || 'Could not initiate donation payment.');
    }
  };

  // Reset to initial input stage
  const handleReset = () => {
    setStage('input');
    setAmount('');
    setAmountError('');
    setErrorMessage('');
    setDonationData(null);
    window.history.replaceState(null, '', window.location.pathname);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#09090E',
        color: '#FFFFFF',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowX: 'hidden',
      }}
    >
      {/* Ambient Celestial Glows */}
      <div
        style={{
          position: 'fixed',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-10%',
          right: '-5%',
          width: '500px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Main Content Wrapper */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '560px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '12px' }}>
            <AsthraLogo size={58} />
          </div>

          <h3
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '13px',
              letterSpacing: '0.22em',
              color: '#D4AF37',
              margin: '0 0 4px 0',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Asthra 2026 Fest
          </h3>

          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '28px',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: '0 0 10px 0',
              lineHeight: 1.25,
            }}
          >
            Asthra Care Initiative
          </h1>

          <p
            style={{
              fontSize: '14px',
              color: '#9CA3AF',
              lineHeight: 1.6,
              maxWidth: '480px',
              margin: '0 auto',
            }}
          >
            Asthra champions more than just technology — we stand for social impact.
            Every rupee you contribute directly supports educational resources and welfare for underprivileged students.
          </p>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            STAGE 1: CONTRIBUTION AMOUNT INPUT & CHIPS
        ───────────────────────────────────────────────────────────── */}
        {stage === 'input' && (
          <div
            style={{
              width: '100%',
              background: 'rgba(18, 17, 26, 0.85)',
              border: '1px solid rgba(212, 175, 55, 0.28)',
              borderRadius: '20px',
              padding: '28px 24px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(212, 175, 55, 0.2)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Heart size={18} color="#D4AF37" fill="rgba(212, 175, 55, 0.2)" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#E5E7EB' }}>
                Select or Enter Contribution
              </span>
            </div>

            {/* Quick Amount Chips */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              {PRESET_AMOUNTS.map((val) => {
                const isSelected = amount === val.toString();
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSelectPreset(val)}
                    style={{
                      padding: '10px 0',
                      borderRadius: '12px',
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(245, 158, 11, 0.15) 100%)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected
                        ? '1.5px solid #D4AF37'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      color: isSelected ? '#FBBF24' : '#D1D5DB',
                      fontSize: '14px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 0 16px rgba(212, 175, 55, 0.2)' : 'none',
                    }}
                  >
                    ₹ {val.toLocaleString('en-IN')}
                  </button>
                );
              })}
            </div>

            {/* Custom Amount Input with -> Action Button */}
            <form onSubmit={handleProceedToDetails}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(9, 9, 14, 0.95)',
                  border: amountError ? '1.5px solid #EF4444' : '1.5px solid rgba(212, 175, 55, 0.35)',
                  borderRadius: '16px',
                  padding: '6px 8px 6px 18px',
                  boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.5)',
                  transition: 'border-color 0.2s ease',
                }}
              >
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#D4AF37',
                    marginRight: '8px',
                    userSelect: 'none',
                  }}
                >
                  ₹
                </span>

                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (amountError) setAmountError('');
                  }}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#FFFFFF',
                    fontSize: '20px',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                  }}
                />

                <button
                  type="submit"
                  aria-label="Proceed with contribution"
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #D4AF37 0%, #B89628 100%)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0B0A10',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ArrowRight size={22} strokeWidth={2.5} />
                </button>
              </div>

              {amountError && (
                <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} />
                  <span>{amountError}</span>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STAGE 2: PROCESSING / VERIFYING SPINNER
        ───────────────────────────────────────────────────────────── */}
        {(stage === 'processing' || stage === 'verifying') && (
          <div
            style={{
              width: '100%',
              background: 'rgba(18, 17, 26, 0.9)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '20px',
              padding: '48px 24px',
              textAlign: 'center',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Loader2
              size={48}
              color="#D4AF37"
              style={{ animation: 'spin 1.2s linear infinite', margin: '0 auto 20px auto' }}
            />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
              {stage === 'verifying' ? 'Verifying Contribution' : 'Connecting to Gateway'}
            </h3>
            <p style={{ fontSize: '14px', color: '#9CA3AF', margin: 0 }}>
              {statusMessage || 'Please do not refresh or close this tab.'}
            </p>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STAGE 3: PAYMENT FAILED
        ───────────────────────────────────────────────────────────── */}
        {stage === 'failed' && (
          <div
            style={{
              width: '100%',
              background: 'rgba(18, 17, 26, 0.9)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '20px',
              padding: '36px 24px',
              textAlign: 'center',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <AlertCircle size={28} color="#EF4444" />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
              Payment Incomplete
            </h3>

            <p style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '24px' }}>
              {errorMessage || 'The payment could not be confirmed. If money was debited, it will be refunded or updated shortly.'}
            </p>

            <button
              onClick={handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B89628 100%)',
                color: '#0B0A10',
                border: 'none',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={16} />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STAGE 4: SUCCESS THANK-YOU TICKET PASS
        ───────────────────────────────────────────────────────────── */}
        {stage === 'success' && donationData && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Header Success Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#4ADE80',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '16px',
              }}
            >
              <CheckCircle2 size={16} />
              <span>Contribution Confirmed • Thank You!</span>
            </div>

            {/* Ticket Card */}
            <div
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #161420 0%, #0E0D15 50%, #1A160E 100%)',
                border: '1.5px solid #D4AF37',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.8), 0 0 24px rgba(212, 175, 55, 0.15)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Ticket Top: Emblem & Fest Name */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '1px dashed rgba(212, 175, 55, 0.35)',
                  paddingBottom: '16px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AsthraLogo size={40} />
                  <div>
                    <div style={{ fontSize: '10px', color: '#D4AF37', fontWeight: 700, letterSpacing: '0.15em' }}>
                      ASTHRA 2026 FEST
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                      Asthra Care Initiative
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: 'rgba(212, 175, 55, 0.15)',
                    border: '1px solid #D4AF37',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#FBBF24',
                    letterSpacing: '0.05em',
                  }}
                >
                  DONOR PASS
                </div>
              </div>

              {/* Contributor Name */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  CONTRIBUTOR
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF' }}>
                  {donationData.donor_name || donorName}
                </div>
              </div>

              {/* Amount & Code Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  marginBottom: '18px',
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', color: '#D4AF37', fontWeight: 700 }}>
                    CONTRIBUTION AMOUNT
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#34D399' }}>
                    ₹ {Number(donationData.amount || amount).toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 700 }}>
                    DONATION CODE
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#F3F4F6', fontFamily: 'monospace' }}>
                    {donationData.donation_code}
                  </div>
                </div>
              </div>

              {/* Heartfelt Note */}
              <p
                style={{
                  fontSize: '12px',
                  fontStyle: 'italic',
                  color: '#D1D5DB',
                  margin: '0 0 16px 0',
                  textAlign: 'center',
                }}
              >
                “Thank you for your noble generosity. Your support provides hope, education, and smiles to young lives.”
              </p>

              {/* Ticket Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderTop: '1px dashed rgba(212, 175, 55, 0.25)',
                  paddingTop: '14px',
                  fontSize: '11px',
                  color: '#6B7280',
                }}
              >
                Official Contribution Receipt • Asthra Care Welfare Fund
              </div>
            </div>

            {/* Action Buttons: Download Pass & Make Another Contribution */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                width: '100%',
                marginTop: '20px',
              }}
            >
              <button
                onClick={() => downloadCharityPassImage(donationData)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #B89628 100%)',
                  color: '#0B0A10',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(212, 175, 55, 0.3)',
                }}
              >
                <Download size={16} />
                <span>Download Donor Pass</span>
              </button>

              <button
                onClick={handleReset}
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  color: '#D4AF37',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                New Donation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DONOR DETAILS MODAL (OVERLAY)
      ───────────────────────────────────────────────────────────── */}
      {detailsModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(4, 4, 7, 0.82)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setDetailsModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#12111A',
              border: '1.5px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '20px',
              padding: '28px 24px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.15)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setDetailsModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9CA3AF',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#D4AF37', fontWeight: 700, letterSpacing: '0.1em' }}>
                DONOR INFORMATION
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', margin: '4px 0 6px 0' }}>
                Your Contribution: ₹{Number(amount || 0).toLocaleString('en-IN')}
              </h2>
              <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
                You can provide your details or choose to remain completely anonymous.
              </p>
            </div>

            {/* Anonymous Toggle Option */}
            <div
              onClick={() => {
                setIsAnonymous((prev) => !prev);
                setFormErrors({});
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: isAnonymous ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: isAnonymous ? '1px solid rgba(212, 175, 55, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '16px',
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  background: isAnonymous ? '#D4AF37' : 'rgba(255, 255, 255, 0.08)',
                  border: isAnonymous ? '1px solid #D4AF37' : '1px solid rgba(255, 255, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0B0A10',
                  flexShrink: 0,
                }}
              >
                {isAnonymous && <Check size={14} strokeWidth={3} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: isAnonymous ? '#F3E8C4' : '#E5E7EB' }}>
                  Donate Anonymously
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                  Keep your identity private. No personal details will be collected or shown on the pass.
                </div>
              </div>
            </div>

            {isAnonymous ? (
              <div
                style={{
                  padding: '18px 16px',
                  borderRadius: '12px',
                  background: 'rgba(212, 175, 55, 0.06)',
                  border: '1px dashed rgba(212, 175, 55, 0.25)',
                  textAlign: 'center',
                  marginBottom: '14px',
                }}
              >
                <EyeOff size={28} color="#D4AF37" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#F3E8C4', marginBottom: '4px' }}>
                  Contributing Anonymously
                </div>
                <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>
                  Your contribution will be officially recorded under <strong>Anonymous Contributor</strong>. You will still receive an official confirmation and donor pass.
                </p>
              </div>
            ) : (
              /* Input Form */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#D1D5DB', marginBottom: '6px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: formErrors.name ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {formErrors.name && (
                    <span style={{ fontSize: '11px', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                      {formErrors.name}
                    </span>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#D1D5DB', marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. rahul@example.com"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: formErrors.email ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {formErrors.email && (
                    <span style={{ fontSize: '11px', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                      {formErrors.email}
                    </span>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#D1D5DB', marginBottom: '6px' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: formErrors.phone ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {formErrors.phone && (
                    <span style={{ fontSize: '11px', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                      {formErrors.phone}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleInitiatePayment}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '13px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B89628 100%)',
                color: '#0B0A10',
                fontWeight: 700,
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(212, 175, 55, 0.35)',
              }}
            >
              <span>
                {isAnonymous
                  ? `Donate ₹${Number(amount || 0).toLocaleString('en-IN')} Anonymously`
                  : `Donate ₹${Number(amount || 0).toLocaleString('en-IN')}`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

