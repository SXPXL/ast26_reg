import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  X,
  TrendingUp,
  Calendar,
  UserPlus,
  Users,
  Ticket,
  LogOut,
  User,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export default function AdminNavbar({ activeTab, setActiveTab, onSwitchToPublic }) {
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    { id: 'stats', label: 'Analytics & Overview', icon: TrendingUp, desc: 'Live revenue, registrations & attendance' },
    { id: 'events', label: 'Manage Events', icon: Calendar, desc: 'Create, update & assign volunteers' },
    { id: 'volunteers', label: 'Volunteer Accounts', icon: UserPlus, desc: 'Register volunteers & manage access' },
    { id: 'registrations', label: 'All Registrations', icon: Users, desc: 'Filter participants & export CSV' },
  ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setDrawerOpen(false);
  };

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(9, 9, 14, 0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.18)',
        padding: '0.85rem 1.5rem',
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Top Left: Hamburger Button + Logo & Name ASTHRA 26 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setDrawerOpen(true)}
              className="neu-btn"
              style={{
                padding: '0.55rem',
                borderRadius: '10px',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: 'var(--gold-bright)',
              }}
              title="Open Navigation Menu"
            >
              <Menu size={22} />
            </button>

            <div
              onClick={onSwitchToPublic}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #181824 0%, #0d0d14 100%)',
                boxShadow: 'var(--neu-shadow-flat)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Sparkles size={18} color="#F5D77F" />
              </div>

              <div>
                <div className="font-display gold-text-glow" style={{ fontSize: '1.2rem', fontWeight: '900', letterSpacing: '0.1em' }}>
                  ASTHRA ’26
                </div>
                <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Central Admin Panel
                </div>
              </div>
            </div>
          </div>

          {/* Top Right: Profile Options */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={onSwitchToPublic}
              className="neu-btn"
              style={{ fontSize: '0.75rem', padding: '0.45rem 0.9rem' }}
            >
              Participant View
            </button>

            {user && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '12px',
                background: 'var(--bg-inset)',
                boxShadow: 'var(--neu-shadow-inset)',
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ShieldCheck size={16} color="#D4AF37" />
                </div>

                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-white)' }}>
                    {user.full_name || 'Admin'}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--gold-bright)', textTransform: 'uppercase' }}>
                    {user.role}
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    marginLeft: '0.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hamburger Drawer Overlay */}
      {drawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 3, 5, 0.75)',
            backdropFilter: 'blur(10px)',
            zIndex: 200,
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setDrawerOpen(false)}
        >
          {/* Drawer Sidebar */}
          <div
            style={{
              width: '320px',
              height: '100%',
              background: '#0d0d14',
              boxShadow: '8px 0 30px rgba(0,0,0,0.8)',
              borderRight: '1px solid rgba(212, 175, 55, 0.25)',
              padding: '2rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Drawer Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <div className="font-display gold-text-glow" style={{ fontSize: '1.4rem', fontWeight: '900' }}>
                    ASTHRA ’26
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Admin Controls
                  </div>
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
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

              {/* Navigation Options List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`neu-btn ${isActive ? 'active' : ''}`}
                      style={{
                        padding: '0.85rem 1rem',
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Icon size={18} color={isActive ? '#F5D77F' : 'currentColor'} />
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{item.label}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                        </div>
                      </div>
                      <ChevronRight size={14} color={isActive ? '#F5D77F' : 'var(--text-muted)'} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '1.25rem' }}>
              <button
                onClick={logout}
                className="neu-btn"
                style={{ width: '100%', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
