import React from 'react';
import { useAuth } from '../context/AuthContext';
import AsthraLogo from './AsthraLogo';
import {
  Menu,
  X,
  ClipboardList,
  UserPlus,
  Users2,
  CalendarPlus,
  Users,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';

export default function HamburgerDrawer({ isOpen, onClose, onToggle, activeSection, onSelectSection }) {
  const { user, logout } = useAuth();
  if (!user) return null;

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
    <>
      {/* Background Dim Backdrop when expanded */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 3, 5, 0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 140,
            animation: 'fadeIn 0.2s ease-out',
          }}
        />
      )}

      {/* Collapsible Sidebar Rail */}
      <aside
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: isOpen ? '285px' : '64px',
          background: 'rgba(11, 11, 18, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--glass-border)',
          boxShadow: isOpen
            ? '12px 0 40px rgba(0, 0, 0, 0.75), inset -1px 0 0 rgba(255, 255, 255, 0.05)'
            : '4px 0 20px rgba(0, 0, 0, 0.4)',
          zIndex: 150,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease',
          overflowX: 'hidden',
          overflowY: 'auto',
        }}
      >
        <div>
          {/* Top Header */}
          <div
            style={{
              height: '70px',
              padding: isOpen ? '0 1.25rem' : '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isOpen ? 'space-between' : 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            {/* When open: Logo & Asthra 26 title on left */}
            {isOpen && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                <AsthraLogo size={28} />
                <div
                  className="font-display gold-text-glow"
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: '800',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Asthra 26
                </div>
              </div>
            )}

            {/* Hamburger Button:
                - When closed: placed centered in the 64px rail (far left)
                - When open: present on the top right of the sidebar, clicking slides it back
            */}
            <button
              onClick={onToggle || (isOpen ? onClose : () => {})}
              aria-label={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
              title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
              style={{
                background: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: '10px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--gold-bright)',
                boxShadow: 'var(--neu-shadow-flat)',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold-bright)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(212, 175, 55, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.25)';
                e.currentTarget.style.boxShadow = 'var(--neu-shadow-flat)';
              }}
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <div
            style={{
              padding: isOpen ? '1.25rem 0.85rem' : '1rem 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: isOpen ? 'stretch' : 'center',
              gap: '0.55rem',
            }}
          >
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              if (!isOpen) {
                // Closed state: Icon-only vertically under hamburger menu
                return (
                  <button
                    key={item.id}
                    title={item.label}
                    onClick={() => onSelectSection(item.id)}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: isActive ? 'rgba(212, 175, 55, 0.18)' : 'transparent',
                      border: isActive ? '1px solid var(--gold-bright)' : '1px solid transparent',
                      color: isActive ? 'var(--gold-bright)' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isActive ? '0 0 12px rgba(212, 175, 55, 0.25)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.style.color = 'var(--gold-light)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    <Icon size={19} />
                  </button>
                );
              }

              // Open state: Icon with name and description
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectSection(item.id);
                    onClose();
                  }}
                  className={`neu-btn ${isActive ? 'active' : ''}`}
                  style={{
                    padding: '0.8rem 0.95rem',
                    width: '100%',
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    gap: '0.85rem',
                    borderRadius: '12px',
                    background: isActive ? 'var(--bg-inset)' : 'var(--bg-card)',
                    borderColor: isActive ? 'var(--gold-bright)' : 'rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <Icon size={18} color={isActive ? '#F5D77F' : 'var(--gold-primary)'} style={{ flexShrink: 0 }} />
                  <div style={{ overflow: 'hidden' }}>
                    <div
                      style={{
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        color: isActive ? 'var(--gold-bright)' : 'var(--text-white)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer (when open, show logout option) */}
        {isOpen && (
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', padding: '1rem 1.25rem' }}>
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
        )}
      </aside>
    </>
  );
}
