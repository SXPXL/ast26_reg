import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, Sparkles, LogOut, User } from 'lucide-react';

export default function Navbar({ isVolunteerRoute, onOpenDrawer, onNavigate }) {
  const { user, logout } = useAuth();

  const showVolunteerControls = isVolunteerRoute && !!user;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(9, 9, 14, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        padding: '1rem 2rem',
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
        {/* Top Left: Hamburger (volunteers only) + Logo + Asthra 26 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {showVolunteerControls && (
            <button
              onClick={onOpenDrawer}
              aria-label="Open Navigation Menu"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '10px',
                padding: '0.5rem',
                cursor: 'pointer',
                color: 'var(--gold-bright)',
                boxShadow: 'var(--neu-shadow-flat)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold-bright)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(212, 175, 55, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                e.currentTarget.style.boxShadow = 'var(--neu-shadow-flat)';
              }}
            >
              <Menu size={20} />
            </button>
          )}

          {/* Logo & Asthra 26 Name */}
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
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #181824 0%, #0d0d14 100%)',
                boxShadow: 'var(--neu-shadow-flat)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} color="#F5D77F" />
            </div>

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
        </div>

        {/* Top Right: Profile Option (Only visible for volunteers/admins on /volunteer) */}
        {showVolunteerControls && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.45rem 0.95rem',
                borderRadius: '12px',
                background: 'var(--bg-card)',
                boxShadow: 'var(--neu-shadow-flat)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
              }}
            >
              <User size={15} color="#D4AF37" />
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-white)' }}>
                {user.full_name}
              </span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '0.5rem 0.85rem',
                cursor: 'pointer',
                color: '#F87171',
                boxShadow: 'var(--neu-shadow-flat)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                fontWeight: '600',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-card)';
              }}
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
