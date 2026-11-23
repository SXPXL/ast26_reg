import React, { useState } from 'react';
import PolicyModal from './PolicyModal';

export default function Footer() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  const handleOpen = (tab) => {
    setActiveTab(tab);
    setModalOpen(true);
  };

  return (
    <>
      <footer
        style={{
          marginTop: 'auto',
          background: 'linear-gradient(180deg, rgba(10, 9, 16, 0.95) 0%, #050508 100%)',
          borderTop: '1px solid rgba(212, 175, 55, 0.18)',
          padding: '1.4rem 1rem 1.6rem',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
          }}
        >
          {/* Centrally aligned single row with simple text links */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '0.9rem',
              fontSize: '0.88rem',
              fontWeight: 500,
            }}
          >
            <button
              type="button"
              onClick={() => handleOpen('about')}
              style={{
                background: 'none',
                border: 'none',
                color: '#D1CDD8',
                cursor: 'pointer',
                padding: '0.2rem 0.4rem',
                fontSize: 'inherit',
                fontFamily: 'inherit',
                fontWeight: 'inherit',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#F5D77F')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#D1CDD8')}
            >
              About Us
            </button>

            <span style={{ color: 'rgba(212, 175, 55, 0.4)', userSelect: 'none' }}>•</span>

            <button
              type="button"
              onClick={() => handleOpen('policies')}
              style={{
                background: 'none',
                border: 'none',
                color: '#D1CDD8',
                cursor: 'pointer',
                padding: '0.2rem 0.4rem',
                fontSize: 'inherit',
                fontFamily: 'inherit',
                fontWeight: 'inherit',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#F5D77F')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#D1CDD8')}
            >
              Policies &amp; Guidelines
            </button>

            <span style={{ color: 'rgba(212, 175, 55, 0.4)', userSelect: 'none' }}>•</span>

            <button
              type="button"
              onClick={() => handleOpen('contact')}
              style={{
                background: 'none',
                border: 'none',
                color: '#D1CDD8',
                cursor: 'pointer',
                padding: '0.2rem 0.4rem',
                fontSize: 'inherit',
                fontFamily: 'inherit',
                fontWeight: 'inherit',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#F5D77F')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#D1CDD8')}
            >
              Contact Us
            </button>
          </div>

          {/* Subtle copyright note */}
          <div
            style={{
              fontSize: '0.78rem',
              color: '#7E7A8A',
              letterSpacing: '0.01em',
            }}
          >
            © 2026 Asthra 26 • St. Thomas College (Autonomous), Thrissur. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Detailed Modal View */}
      <PolicyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTab={activeTab}
      />
    </>
  );
}
