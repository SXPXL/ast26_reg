import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  ClipboardList,
  UserPlus,
  Users2,
  CalendarPlus,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';

export default function HamburgerDrawer({ isOpen, onClose, activeSection, onSelectSection }) {
  const { user, logout } = useAuth();
  if (!isOpen) return null;

  const isAdmin = user && (user.role === 'ADMIN' || user.id === '00000000-0000-0000-0000-000000000001');

  const menuItems = [
    {
      id: 'status',
      label: 'View Event Status',
      icon: ClipboardList,
      desc: 'Attendance roster & hall check-in',
      adminOnly: false,
    },
    {
      id: 'manual_reg',
      label: 'Register Participant',
      icon: UserPlus,
      desc: 'Spot register via Cash or Online QR',
      adminOnly: false,
    },
    {
      id: 'participants',
      label: 'View All Participants',
      icon: Users2,
      desc: 'Filter by event, payment mode & check-in',
      adminOnly: true,
    },
    {
      id: 'events',
      label: 'Create & Manage Events',
      icon: CalendarPlus,
      desc: 'Add, edit, delete, times & rules',
      adminOnly: true,
    },
    {
      id: 'stats',
      label: 'Analytics & Revenue',
      icon: BarChart3,
      desc: 'Cash vs online breakdown & turnouts',
      adminOnly: true,
    },
    {
      id: 'volunteers',
      label: 'Volunteer Accounts',
      icon: Users,
      desc: 'Create, update & assign event desks',
      adminOnly: true,
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
      desc: 'Fest attributes & payment configs',
      adminOnly: true,
    },
  ];

  const visibleItems = menuItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3, 3, 5, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '320px',
          height: '100%',
          background: 'rgba(13, 13, 20, 0.85)',
          backdropFilter: 'var(--glass-blur-lg)',
          WebkitBackdropFilter: 'var(--glass-blur-lg)',
          borderRight: '1px solid var(--glass-border)',
          boxShadow: '10px 0 35px rgba(0, 0, 0, 0.7), inset -1px 0 0 rgba(255, 255, 255, 0.05)',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles size={18} color="#F5D77F" />
              <div
                className="font-display gold-text-glow"
                style={{ fontSize: '1.25rem', fontWeight: '800' }}
              >
                Asthra 26
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'var(--bg-inset)',
                border: 'none',
                color: 'var(--text-muted)',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* User info mini-card */}
          {user && (
            <div
              style={{
                background: 'var(--bg-inset)',
                border: '1px solid rgba(212, 175, 55, 0.15)',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Signed in as
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-white)' }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--gold-bright)', marginTop: '0.15rem' }}>
                {user.role} {isAdmin && '• Full Admin Access'}
              </div>
            </div>
          )}

          {/* Menu navigation options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectSection(item.id);
                    onClose();
                  }}
                  className={`neu-btn ${isActive ? 'active' : ''}`}
                  style={{
                    padding: '0.85rem 1rem',
                    width: '100%',
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    gap: '0.85rem',
                    background: isActive ? 'var(--bg-inset)' : 'var(--bg-card)',
                    borderColor: isActive ? 'var(--gold-bright)' : 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <Icon size={18} color={isActive ? '#F5D77F' : 'var(--gold-primary)'} />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem', color: isActive ? 'var(--gold-bright)' : 'var(--text-white)' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer with Logout */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '1rem' }}>
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              color: '#F87171',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.82rem',
              fontWeight: '600',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
