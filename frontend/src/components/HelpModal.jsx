import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, HelpCircle, ExternalLink } from 'lucide-react';

export default function HelpModal({ isOpen, onClose }) {
  // Prevent background scrolling when modal is open
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

  // Contact numbers fetched from Vite environment variables
  const rawWhatsapp = import.meta.env.VITE_HELP_WHATSAPP_NUMBER || import.meta.env.VITE_WHATSAPP_NUMBER || '+919876543210';
  const rawPhone = import.meta.env.VITE_HELP_PHONE_NUMBER || import.meta.env.VITE_CALL_NUMBER || import.meta.env.VITE_PHONE_NUMBER || '+919876543210';

  // Format clean URLs for WhatsApp and Telephone
  const cleanWaNumber = rawWhatsapp.replace(/[^0-9]/g, '');
  const cleanTelNumber = rawPhone.replace(/[^0-9+]/g, '');

  const whatsappMessage = encodeURIComponent('Hi Asthra Team, I need help regarding event registration / fest details.');
  const whatsappUrl = `https://wa.me/${cleanWaNumber}?text=${whatsappMessage}`;
  const callUrl = `tel:${cleanTelNumber}`;

  const handleWhatsAppClick = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCallClick = () => {
    window.location.href = callUrl;
  };

  // Render via React Portal directly into document.body to escape any parent sticky/backdrop-filter contexts
  return createPortal(
    <div
      className="help-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        background: 'rgba(5, 5, 8, 0.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        boxSizing: 'border-box',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          margin: '0 auto',
          background: 'linear-gradient(145deg, rgba(22, 20, 30, 0.98) 0%, rgba(13, 12, 18, 0.98) 100%)',
          border: '1.5px solid rgba(212, 175, 55, 0.5)',
          borderRadius: '24px',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(212, 175, 55, 0.2)',
          padding: '2.2rem 1.85rem',
          position: 'relative',
          textAlign: 'center',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close Help Modal"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: '#9CA3AF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
            e.currentTarget.style.borderColor = 'var(--gold-bright, #F5D77F)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9CA3AF';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
          }}
        >
          <X size={18} />
        </button>

        {/* Top Icon Badge */}
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(212, 175, 55, 0.05) 100%)',
            border: '1.5px solid rgba(212, 175, 55, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.35rem',
            color: 'var(--gold-bright, #F5D77F)',
            boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
          }}
        >
          <HelpCircle size={34} />
        </div>

        {/* Title */}
        <h3
          className="font-display gold-text-glow"
          style={{
            fontSize: '1.65rem',
            fontWeight: '800',
            color: '#FFFFFF',
            marginBottom: '0.65rem',
            letterSpacing: '0.02em',
          }}
        >
          Help & Support
        </h3>

        {/* Description */}
        <p
          style={{
            color: 'var(--text-secondary, #A7A296)',
            fontSize: '0.94rem',
            lineHeight: 1.6,
            marginBottom: '1.85rem',
            maxWidth: '380px',
            margin: '0 auto 1.85rem',
          }}
        >
          If you are having any trouble with registration or want to know more, please contact us.
        </p>

        {/* Action Buttons: WhatsApp & Call */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {/* WhatsApp Button */}
          <button
            onClick={handleWhatsAppClick}
            type="button"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.95rem 1.3rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.18) 0%, rgba(20, 100, 50, 0.15) 100%)',
              border: '1.5px solid rgba(37, 211, 102, 0.5)',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 4px 16px rgba(37, 211, 102, 0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(37, 211, 102, 0.28) 0%, rgba(20, 100, 50, 0.25) 100%)';
              e.currentTarget.style.borderColor = '#25D366';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 22px rgba(37, 211, 102, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(37, 211, 102, 0.18) 0%, rgba(20, 100, 50, 0.15) 100%)';
              e.currentTarget.style.borderColor = 'rgba(37, 211, 102, 0.5)';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 211, 102, 0.15)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              {/* WhatsApp Official Vector Logo */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#25D366',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 0 14px rgba(37, 211, 102, 0.5)',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.276-.1-.476-.15-.677.15-.2.302-.777.98-.953 1.18-.175.2-.351.226-.652.076-.301-.15-1.272-.469-2.423-1.496-.895-.799-1.5-1.786-1.675-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.351.451-.527.151-.175.201-.301.302-.501.1-.2.05-.377-.025-.527-.075-.151-.677-1.632-.928-2.235-.244-.587-.492-.507-.677-.516-.175-.009-.376-.011-.577-.011-.201 0-.527.075-.803.376-.276.301-1.053 1.03-1.053 2.511 0 1.482 1.078 2.913 1.229 3.114.15.201 2.122 3.24 5.141 4.544.718.31 1.279.496 1.716.635.722.23 1.378.197 1.898.12.579-.087 1.78-.727 2.031-1.431.251-.703.251-1.306.176-1.431-.076-.126-.276-.201-.577-.352z"
                    fill="#FFFFFF"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.174L2 22l4.98-1.396A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.163 8.163 0 01-4.223-1.17l-.303-.18-2.96.829.832-2.883-.198-.315A8.17 8.17 0 013.8 12c0-4.529 3.671-8.2 8.2-8.2s8.2 3.671 8.2 8.2c0 4.529-3.671 8.2-8.2 8.2z"
                    fill="#FFFFFF"
                  />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '800', fontSize: '1rem', color: '#FFFFFF' }}>
                  Chat on WhatsApp
                </div>
                <div style={{ fontSize: '0.76rem', color: '#86EFAC' }}>
                  {rawWhatsapp} • Instant Chat
                </div>
              </div>
            </div>
            <ExternalLink size={16} color="#86EFAC" />
          </button>

          {/* Call Button */}
          <button
            onClick={handleCallClick}
            type="button"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.95rem 1.3rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.18) 0%, rgba(35, 30, 20, 0.45) 100%)',
              border: '1.5px solid rgba(212, 175, 55, 0.5)',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 4px 16px rgba(212, 175, 55, 0.14)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.28) 0%, rgba(35, 30, 20, 0.6) 100%)';
              e.currentTarget.style.borderColor = 'var(--gold-bright, #F5D77F)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 22px rgba(212, 175, 55, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.18) 0%, rgba(35, 30, 20, 0.45) 100%)';
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(212, 175, 55, 0.14)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0B0A10',
                  flexShrink: 0,
                  boxShadow: '0 0 14px rgba(212, 175, 55, 0.4)',
                }}
              >
                <Phone size={19} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '800', fontSize: '1rem', color: '#FFFFFF' }}>
                  Call Support
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--gold-bright, #F5D77F)' }}>
                  {rawPhone} • Direct Phone Call
                </div>
              </div>
            </div>
            <Phone size={16} color="var(--gold-bright, #F5D77F)" />
          </button>
        </div>

        {/* Bottom Note */}
        <div style={{ marginTop: '1.4rem', fontSize: '0.72rem', color: '#888480' }}>
          Available during festival hours • Asthra 2026 Help Desk
        </div>
      </div>
    </div>,
    document.body
  );
}
