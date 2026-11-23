import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Building2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';

export default function PolicyModal({ isOpen, onClose, initialTab = 'about' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Fetch phone numbers and contact details from environment variables
  const contactPhone = import.meta.env.VITE_CONTACT_PHONE_NUMBER || '+917356336812';
  const helpPhone = import.meta.env.VITE_HELP_PHONE_NUMBER || '+919876543210';
  const helpWhatsapp = import.meta.env.VITE_HELP_WHATSAPP_NUMBER || '+919876543210';
  const emailAddress = 'asthrastc.26@gmail.com';

  const cleanContactNumber = contactPhone.replace(/[^0-9+]/g, '');
  const cleanHelpNumber = helpPhone.replace(/[^0-9+]/g, '');
  const cleanWaNumber = helpWhatsapp.replace(/[^0-9]/g, '');

  // Sync activeTab when initialTab changes on open
  useEffect(() => {
    if (isOpen && initialTab) {
      if (initialTab === 'policies') {
        setActiveTab('refund');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, initialTab]);

  // Lock background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(5, 5, 8, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        boxSizing: 'border-box',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(145deg, #12111b 0%, #0a0910 100%)',
          border: '1.5px solid rgba(212, 175, 55, 0.35)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(212, 175, 55, 0.15)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(18, 17, 27, 0.7)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#D4AF37', fontWeight: 600 }}>
              Asthra 26 • St. Thomas College (Autonomous), Thrissur
            </div>
            <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.25rem', color: '#FAF9F6', fontWeight: 700 }}>
              {activeTab === 'about' && 'About Us — Asthra 26'}
              {activeTab === 'contact' && 'Contact Us — Support & Coordination'}
              {activeTab === 'refund' && 'Refund & Cancellation Policy'}
              {activeTab === 'privacy' && 'Privacy Policy'}
              {activeTab === 'terms' && 'Terms & Conditions'}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close Modal"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#A7A296',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFF';
              e.currentTarget.style.borderColor = '#D4AF37';
              e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#A7A296';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(10, 9, 16, 0.9)',
            padding: '0.5rem 1rem 0',
            gap: '0.35rem',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 0.9rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'about' ? '2.5px solid #D4AF37' : '2.5px solid transparent',
              color: activeTab === 'about' ? '#F5D77F' : '#A7A296',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Info size={15} color={activeTab === 'about' ? '#F5D77F' : '#A7A296'} />
            About Us
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 0.9rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'contact' ? '2.5px solid #D4AF37' : '2.5px solid transparent',
              color: activeTab === 'contact' ? '#F5D77F' : '#A7A296',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Phone size={15} color={activeTab === 'contact' ? '#F5D77F' : '#A7A296'} />
            Contact Us
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('refund')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 0.9rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'refund' ? '2.5px solid #D4AF37' : '2.5px solid transparent',
              color: activeTab === 'refund' ? '#F5D77F' : '#A7A296',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <AlertTriangle size={15} color={activeTab === 'refund' ? '#F5D77F' : '#A7A296'} />
            Refund Policy
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 0.9rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'privacy' ? '2.5px solid #D4AF37' : '2.5px solid transparent',
              color: activeTab === 'privacy' ? '#F5D77F' : '#A7A296',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <ShieldCheck size={15} color={activeTab === 'privacy' ? '#F5D77F' : '#A7A296'} />
            Privacy Policy
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 0.9rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'terms' ? '2.5px solid #D4AF37' : '2.5px solid transparent',
              color: activeTab === 'terms' ? '#F5D77F' : '#A7A296',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <FileText size={15} color={activeTab === 'terms' ? '#F5D77F' : '#A7A296'} />
            Terms &amp; Conditions
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div
          style={{
            flex: '1 1 auto',
            overflowY: 'auto',
            padding: '1.5rem',
            color: '#D1CDD8',
            fontSize: '0.9rem',
            lineHeight: 1.65,
          }}
        >
          {/* ──────────────── ABOUT US TAB ──────────────── */}
          {activeTab === 'about' && (
            <div>
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(212, 175, 55, 0.03) 100%)',
                  border: '1.5px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '14px',
                  padding: '1.25rem 1.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <Sparkles size={18} color="#D4AF37" />
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#D4AF37', fontWeight: 700 }}>
                    College Fest
                  </span>
                </div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', color: '#FAF9F6', fontWeight: 800 }}>
                  Asthra 26
                </h3>
                <p style={{ margin: 0, color: '#E7E4DC', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  Conducted by the <strong>Department of Mathematics</strong>, St. Thomas College (Autonomous), Thrissur.
                </p>
              </div>

              <h3 style={{ color: '#F5D77F', fontSize: '1.05rem', margin: '1.25rem 0 0.5rem' }}>About the Fest</h3>
              <p>
                Asthra 26 is an intercollegiate festival organized by the Department of Mathematics at St. Thomas College (Autonomous), Thrissur. The fest brings together students from various colleges to participate in diverse academic and interactive events, competitions, and collaborative activities.
              </p>

              <h3 style={{ color: '#F5D77F', fontSize: '1.05rem', margin: '1.25rem 0 0.5rem' }}>Organizing Department</h3>
              <p>
                The <strong>Department of Mathematics</strong> at St. Thomas College (Autonomous) coordinates and hosts the various events and competitive sessions of Asthra 26, creating a welcoming and engaging platform for student participants.
              </p>

              <h3 style={{ color: '#F5D77F', fontSize: '1.05rem', margin: '1.25rem 0 0.5rem' }}>Venue &amp; Location</h3>
              <p>
                St. Thomas College (Autonomous), Keerankulangara, Thrissur, Kerala 680005.
              </p>

              {/* Coordinator contact box in About Us */}
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '0.9rem 1.1rem',
                  background: 'rgba(212, 175, 55, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(212, 175, 55, 0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.6rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.86rem', color: '#FAF9F6', fontWeight: 600 }}>Fest Coordination Desk</div>
                  <div style={{ fontSize: '0.78rem', color: '#A7A296' }}>For enquiries regarding events and fest participation</div>
                </div>
                <a
                  href={`tel:${cleanContactNumber}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: '#F5D77F',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    padding: '0.35rem 0.8rem',
                    background: 'rgba(212, 175, 55, 0.15)',
                    borderRadius: '8px',
                    border: '1px solid rgba(212, 175, 55, 0.35)',
                  }}
                >
                  <Phone size={14} />
                  {contactPhone}
                </a>
              </div>
            </div>
          )}

          {/* ──────────────── CONTACT US TAB ──────────────── */}
          {activeTab === 'contact' && (
            <div>
              <p style={{ marginTop: 0, marginBottom: '1.25rem', color: '#B3AFBE' }}>
                For queries regarding registrations, event details, or general assistance:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* Physical College Address Card */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    borderRadius: '14px',
                    padding: '1.2rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <MapPin size={20} color="#D4AF37" />
                    <h4 style={{ margin: 0, color: '#FAF9F6', fontSize: '0.95rem' }}>College Address</h4>
                  </div>
                  <div style={{ color: '#D1CDD8', fontSize: '0.88rem', lineHeight: 1.5 }}>
                    <strong>St. Thomas College (Autonomous), Thrissur</strong><br />
                    Keerankulangara, Thrissur,<br />
                    Kerala 680005, India
                  </div>
                </div>

                {/* Email Support Card */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    borderRadius: '14px',
                    padding: '1.2rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <Mail size={20} color="#D4AF37" />
                    <h4 style={{ margin: 0, color: '#FAF9F6', fontSize: '0.95rem' }}>Email</h4>
                  </div>
                  <div style={{ color: '#D1CDD8', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '0.6rem' }}>
                    Official fest communications:
                  </div>
                  <a
                    href={`mailto:${emailAddress}`}
                    style={{
                      color: '#F5D77F',
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    {emailAddress}
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* Phone Contacts */}
              <div
                style={{
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  borderRadius: '14px',
                  padding: '1.2rem 1.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                  <Phone size={20} color="#D4AF37" />
                  <h4 style={{ margin: 0, color: '#FAF9F6', fontSize: '1rem' }}>Phone Lines</h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#FAF9F6', fontSize: '0.95rem' }}>{contactPhone}</div>
                      <div style={{ fontSize: '0.78rem', color: '#A7A296' }}>Fest Coordination &amp; Enquiries</div>
                    </div>
                    <a
                      href={`tel:${cleanContactNumber}`}
                      style={{
                        padding: '0.45rem 1rem',
                        background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                        color: '#0D0C12',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        borderRadius: '8px',
                        textDecoration: 'none',
                      }}
                    >
                      Call
                    </a>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#FAF9F6', fontSize: '0.95rem' }}>{helpPhone}</div>
                      <div style={{ fontSize: '0.78rem', color: '#A7A296' }}>Support &amp; Helpline</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a
                        href={`tel:${cleanHelpNumber}`}
                        style={{
                          padding: '0.45rem 0.85rem',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#FAF9F6',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                        }}
                      >
                        Call
                      </a>
                      <a
                        href={`https://wa.me/${cleanWaNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '0.45rem 0.85rem',
                          background: 'rgba(37, 211, 102, 0.2)',
                          color: '#86EFAC',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          border: '1px solid rgba(37, 211, 102, 0.4)',
                        }}
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── REFUND & CANCELLATION TAB ──────────────── */}
          {activeTab === 'refund' && (
            <div>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1.5px solid rgba(239, 68, 68, 0.45)',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                }}
              >
                <AlertTriangle size={22} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ margin: '0 0 0.25rem', color: '#FCA5A5', fontSize: '0.98rem', fontWeight: 700 }}>
                    Strict No-Refund &amp; No-Cancellation Policy
                  </h4>
                  <p style={{ margin: 0, color: '#FECACA', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    <strong>There is strictly NO REFUND and NO CANCELLATION available</strong> for any event registration, competition pass, or festival ticket once booked and payment is processed.
                  </p>
                </div>
              </div>

              <h3 style={{ color: '#F5D77F', fontSize: '1.05rem', margin: '1.25rem 0 0.5rem' }}>1. All Registrations Are Final</h3>
              <p>
                Once an attendee or team has completed registration and payment for any event or competition under <strong>Asthra 26</strong>, organized by the Department of Mathematics, St. Thomas College (Autonomous), Thrissur, the registration fee is strictly non-refundable and non-transferable under any circumstances.
              </p>

              <h3 style={{ color: '#F5D77F', fontSize: '1.05rem', margin: '1.25rem 0 0.5rem' }}>2. No Cancellation Policy</h3>
              <p>
                Participants cannot cancel, exchange, or downgrade their registration passes after payment has been completed. Registration passes are tied directly to the registered student/participant and cannot be transferred to another individual.
              </p>

              <h3 style={{ color: '#F5D77F', fontSize: '1.05rem', margin: '1.25rem 0 0.5rem' }}>3. Duplicate Payments &amp; Payment Verification</h3>
              <p>
                In case of duplicate transaction debits caused by network interruptions where an excess payment is captured, the participant must contact our finance desk at{' '}
                <a href={`mailto:${emailAddress}`} style={{ color: '#D4AF37', textDecoration: 'underline' }}>{emailAddress}</a> or call{' '}
                <a href={`tel:${cleanContactNumber}`} style={{ color: '#D4AF37', textDecoration: 'underline' }}>{contactPhone}</a> with their transaction reference number (UTR) and payment timestamp within 48 hours for verification with the payment gateway partner.
              </p>
            </div>
          )}

          {/* ──────────────── PRIVACY POLICY TAB ──────────────── */}
          {activeTab === 'privacy' && (
            <div>
              <h3 style={{ color: '#F5D77F', fontSize: '1.05rem', margin: '0 0 0.5rem' }}>1. Overview</h3>
              <p>
                St. Thomas College (Autonomous), Thrissur and the organizing committee of <strong>Asthra 26</strong> are committed to safeguarding participant privacy. This policy outlines how information is collected, processed, and maintained during fest registrations.
              </p>

              <h3 style={{ color: '#F5D77F', fontSize: '1.05rem', margin: '1.25rem 0 0.5rem' }}>2. Information We Collect</h3>
              <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0' }}>
                <li>Participant name, valid email address, and active 10-digit mobile number.</li>
                <li>College/institution name, department, semester, and student identification details.</li>
                <li>Unique digital ticket pass identifiers, registration codes, and event attendance check-in timestamps.</li>
              </ul>

              <h3 style={{ color: '#F5D77F', fontSize: '1.05rem', margin: '1.25rem 0 0.5rem' }}>3. How Your Information Is Used</h3>
              <p>
                Collected details are utilized exclusively for issuing official festival admission passes, verifying identities at campus security checkpoints, communicating event schedules or venue changes, and dispatching certificates of participation or merit.
              </p>

              <h3 style={{ color: '#F5D77F', fontSize: '1.05rem', margin: '1.25rem 0 0.5rem' }}>4. Data Protection &amp; Payment Security</h3>
              <p>
                We do not sell, rent, or trade your personal data with third-party marketing entities. All financial transactions are securely processed via authorized payment aggregators utilizing industry-standard 256-bit encryption. We do not store credit/debit card numbers or UPI MPINs on our servers.
              </p>
            </div>
          )}

          {/* ──────────────── TERMS & CONDITIONS TAB ──────────────── */}
          {activeTab === 'terms' && (
            <div>
              <h3 style={{ color: '#F5D77F', fontSize: '1.05rem', margin: '0 0 0.5rem' }}>1. Campus Entry &amp; Identification</h3>
              <p>
                All attendees, participants, and visitors must produce a valid physical college ID card alongside their Asthra 26 Digital Pass QR code at the St. Thomas College (Autonomous) entrance gates. Entry will be denied without valid student identification.
              </p>

              <h3 style={{ color: '#F5D77F', fontSize: '1.05rem', margin: '1.25rem 0 0.5rem' }}>2. Pass Validity &amp; Non-Transferability</h3>
              <p>
                Each digital entry pass QR code is cryptographically unique and strictly designated for the registered individual. Attempted duplication, tampering, or sharing of tickets will lead to immediate confiscation and cancellation of entry privileges without refund.
              </p>

              <h3 style={{ color: '#F5D77F', fontSize: '1.05rem', margin: '1.25rem 0 0.5rem' }}>3. Campus Discipline &amp; Code of Conduct</h3>
              <p>
                St. Thomas College (Autonomous) enforces discipline regarding campus decorum, anti-ragging policies, and institutional regulations on college premises. The organizing committee reserves the right to disqualify violators from events.
              </p>

              <h3 style={{ color: '#F5D77F', fontSize: '1.05rem', margin: '1.25rem 0 0.5rem' }}>4. Organizer Rights</h3>
              <p>
                The Asthra 26 organizing team reserves the right to make necessary adjustments to event timings, rulebooks, or judging criteria if operational circumstances demand. The decisions of the event judges and fest conveners are final and binding.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(12, 11, 18, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#888496' }}>
            St. Thomas College (Autonomous), Thrissur • Keerankulangara, Thrissur, Kerala 680005
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
              color: '#0D0C12',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
