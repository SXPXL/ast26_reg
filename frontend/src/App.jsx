import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import HamburgerDrawer from './components/HamburgerDrawer';
import ParticipantPage from './pages/ParticipantPage';
import VolunteerPortal from './pages/VolunteerPortal';
import PaymentProcessingPage from './pages/PaymentProcessingPage';

function MainApp() {
  // Current route: '/' for participants, '/volunteer' for volunteers/admins, or '/payment/*'
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.pathname;
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(() => {
    const validSections = ['status', 'manual_reg', 'participants', 'events', 'stats', 'volunteers', 'settings'];
    const hash = window.location.hash.replace('#', '');
    if (hash && validSections.includes(hash)) {
      return hash;
    }
    const saved = localStorage.getItem('asthra_active_section');
    if (saved && validSections.includes(saved)) {
      return saved;
    }
    return 'status';
  });

  const handleSelectSection = (section) => {
    setActiveSection(section);
    localStorage.setItem('asthra_active_section', section);
    if (window.location.pathname === '/volunteer') {
      window.history.replaceState(null, '', `/volunteer#${section}`);
    }
  };

  // Sync section if hash changes (browser back/forward or deep links)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validSections = ['status', 'manual_reg', 'participants', 'events', 'stats', 'volunteers', 'settings'];
      if (hash && validSections.includes(hash)) {
        setActiveSection(hash);
        localStorage.setItem('asthra_active_section', hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
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

  // Dedicated Cashfree payment gateway flow & verification routes
  if (currentPath.startsWith('/payment/')) {
    return <PaymentProcessingPage />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Top Navbar */}
      <Navbar
        isVolunteerRoute={isVolunteerRoute}
        onNavigate={navigateTo}
        onToggleDrawer={() => setDrawerOpen((prev) => !prev)}
        drawerOpen={drawerOpen}
      />

      {/* Hamburger Drawer (Only available on /volunteer) */}
      {isVolunteerRoute && (
        <HamburgerDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onToggle={() => setDrawerOpen((prev) => !prev)}
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
        />
      )}

      {/* Main Page Content */}
      <main style={{ flex: '1 0 auto' }}>
        {isVolunteerRoute ? (
          <VolunteerPortal activeSection={activeSection} onSelectSection={handleSelectSection} />
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
