import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import EventCard from '../components/EventCard';
import EventCardSkeleton from '../components/EventCardSkeleton';
import EventModal from '../components/EventModal';
import SplashLoader from '../components/SplashLoader';
export default function ParticipantPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Splash animation management - skip splash if returning for retry
  const isRetry = Boolean(new URLSearchParams(window.location.search).get('retry_event'));
  const [showSplash, setShowSplash] = useState(() => {
    if (new URLSearchParams(window.location.search).get('retry_event')) return false;
    return !sessionStorage.getItem('asthra_splash_seen');
  });
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const shouldAnimate = !sessionStorage.getItem('asthra_splash_seen') && !isRetry;
    const minSplashDuration = 3200;
    const startTime = Date.now();

    const loadInitialData = async () => {
      try {
        const data = await api.getEvents({ is_active: true });
        if (isMounted) {
          setEvents(data || []);

          // Auto-open event modal for retry if retry_event query param is present
          const urlParams = new URLSearchParams(window.location.search);
          const retryEventId = urlParams.get('retry_event');
          if (retryEventId && Array.isArray(data)) {
            const matched = data.find((e) => e.id === retryEventId || e.slug === retryEventId);
            if (matched) {
              setSelectedEvent(matched);
              window.history.replaceState({}, '', '/');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }

        if (!shouldAnimate) {
          if (isMounted) {
            setShowSplash(false);
          }
          return;
        }

        sessionStorage.setItem('asthra_splash_seen', 'true');
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minSplashDuration - elapsedTime);

        setTimeout(() => {
          if (!isMounted) return;
          setIsFadingOut(true);

          setTimeout(() => {
            if (!isMounted) return;
            setShowSplash(false);
          }, 850);
        }, remainingTime);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshEvents = async () => {
    try {
      const data = await api.getEvents({ is_active: true });
      setEvents(data || []);
    } catch (err) {
      console.error('Failed to refresh events:', err);
    }
  };

  return (
    <>
      {/* Asthra 26 Initial Splash Loader */}
      {showSplash && <SplashLoader isFadingOut={isFadingOut} />}

      <div className="page-container" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Top Description (without hero text) */}
        <div style={{ marginBottom: '2rem' }}>
          <p
            style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              maxWidth: '680px',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Browse flagship competitions, individual battles, and team squad challenges.
            Register in seconds and claim your instant verified digital entry pass.
          </p>
        </div>

        {/* Events Grid */}
        {loading && !showSplash ? (
          <div className="events-grid-responsive">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : events.length === 0 && !showSplash ? (
          <div
            className="glass-card"
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
            }}
          >
            <h3 className="font-display" style={{ fontSize: '1.4rem', color: 'var(--text-white)', marginBottom: '0.5rem' }}>
              No Events Available
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto' }}>
              There are currently no events open for registration. Please check back later.
            </p>
          </div>
        ) : (
          <div className="events-grid-responsive">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={(ev) => setSelectedEvent(ev)}
              />
            ))}
          </div>
        )}

        {/* Event Details & Registration Modal */}
        {selectedEvent && (
          <EventModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onRegistered={refreshEvents}
          />
        )}
      </div>
    </>
  );
}
