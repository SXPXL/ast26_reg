import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import HamburgerDrawer from './components/HamburgerDrawer';
import ParticipantPage from './pages/ParticipantPage';
import VolunteerPortal from './pages/VolunteerPortal';

function MainApp() {
  // Current route: '/' for participants, '/volunteer' for volunteers/admins
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.pathname === '/volunteer' ? '/volunteer' : '/';
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('status'); // 'status' | 'events' | 'volunteers' | 'stats'

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname === '/volunteer' ? '/volunteer' : '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isVolunteerRoute = currentPath === '/volunteer';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Top Navbar */}
      <Navbar
        isVolunteerRoute={isVolunteerRoute}
        onOpenDrawer={() => setDrawerOpen(true)}
        onNavigate={navigateTo}
      />

      {/* Hamburger Drawer (Only available on /volunteer) */}
      {isVolunteerRoute && (
        <HamburgerDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          activeSection={activeSection}
          onSelectSection={setActiveSection}
        />
      )}

      {/* Main Page Content */}
      <main style={{ flex: '1 0 auto' }}>
        {isVolunteerRoute ? (
          <VolunteerPortal activeSection={activeSection} />
        ) : (
          <ParticipantPage />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AuthProvider>
  );
}
