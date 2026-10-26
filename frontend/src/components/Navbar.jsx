import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import AsthraLogo from './AsthraLogo';

export default function Navbar({ isVolunteerRoute, onNavigate }) {
  const { user, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const showVolunteerControls = isVolunteerRoute && !!user;

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(9, 9, 14, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        padding: showVolunteerControls ? '0.85rem 2rem 0.85rem 5.5rem' : '0.85rem 2rem',
        transition: 'padding 0.2s ease',
      }}
    >
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Top Left: Logo + Asthra 26 */}
        <div
          onClick={() => onNavigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <AsthraLogo size={36} />

          <div
            className="font-display gold-text-glow"
            style={{
              fontSize: '1.35rem',
              fontWeight: '800',
              letterSpacing: '0.08em',
            }}
          >
            Asthra 26
          </div>
        </div>

        {/* Top Right: Instagram Default DP Profile Option */}
        {showVolunteerControls && (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              aria-label="User Profile"
              title={`${user.full_name} (${user.role})`}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2a2a38 0%, #171722 100%)',
                border: '1.5px solid rgba(212, 175, 55, 0.4)',
                boxShadow: profileDropdownOpen
                  ? '0 0 15px rgba(212, 175, 55, 0.35)'
                  : '0 2px 8px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold-bright)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(212, 175, 55, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = profileDropdownOpen
                  ? 'var(--gold-bright)'
                  : 'rgba(212, 175, 55, 0.4)';
              }}
            >
              {/* Instagram default DP silhouette vector */}
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="11.5" r="5.5" fill="#A0A0AB" />
                <path d="M7 26.5C7 21 11 19 16 19C21 19 25 21 25 26.5" fill="#A0A0AB" />
              </svg>
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 12px)',
                  width: '260px',
                  background: 'rgba(15, 15, 23, 0.96)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.15)',
                  padding: '1.25rem',
                  zIndex: 300,
                  animation: 'fadeIn 0.15s ease-out',
                }}
              >
                {/* User Info Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2a2a38 0%, #171722 100%)',
                      border: '1.5px solid rgba(212, 175, 55, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="11.5" r="5.5" fill="#A0A0AB" />
                      <path d="M7 26.5C7 21 11 19 16 19C21 19 25 21 25 26.5" fill="#A0A0AB" />
                    </svg>
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        color: 'var(--text-white)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user.full_name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gold-bright)', marginTop: '0.1rem', fontWeight: '600' }}>
                      {user.role === 'ADMIN' ? 'Fest Administrator' : 'Event Volunteer'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.email || user.username}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '0.75rem 0' }} />

                {/* Logout Option inside profile popup */}
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.65rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#F87171',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  }}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
