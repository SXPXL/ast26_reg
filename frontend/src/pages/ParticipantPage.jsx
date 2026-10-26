import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import EventCard from '../components/EventCard';
import EventModal from '../components/EventModal';
import SplashLoader from '../components/SplashLoader';
import { Search, Sparkles, Users, Layers, Filter } from 'lucide-react';

export default function ParticipantPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'INDIVIDUAL' | 'TEAM' | 'FREE'

  // Splash animation management
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('asthra_splash_seen');
  });
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const shouldAnimate = !sessionStorage.getItem('asthra_splash_seen');
    const minSplashDuration = 3200;
    const startTime = Date.now();

    const loadInitialData = async () => {
      try {
        const data = await api.getEvents({ is_active: true });
        if (isMounted) {
          setEvents(data || []);
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

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        ev.title?.toLowerCase().includes(query) ||
        ev.description?.toLowerCase().includes(query) ||
        ev.venue?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // Filter category
      if (activeFilter === 'INDIVIDUAL') return ev.event_type === 'INDIVIDUAL';
      if (activeFilter === 'TEAM') return ev.event_type === 'TEAM';
      if (activeFilter === 'FREE') return parseFloat(ev.registration_fee || 0) === 0;

      return true;
    });
  }, [events, searchQuery, activeFilter]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: events.length,
      individual: events.filter((e) => e.event_type === 'INDIVIDUAL').length,
      team: events.filter((e) => e.event_type === 'TEAM').length,
      free: events.filter((e) => parseFloat(e.registration_fee || 0) === 0).length,
    };
  }, [events]);

  return (
    <>
      {/* Asthra 26 Initial Splash Loader */}
      {showSplash && <SplashLoader isFadingOut={isFadingOut} />}

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>
        {/* Top Description (without hero text) */}
        <div style={{ marginBottom: '1.75rem' }}>
          <p
            style={{
              fontSize: '1.02rem',
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


        {/* Filter and Search Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            marginBottom: '2.5rem',
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            padding: '1.25rem 1.5rem',
            borderRadius: '18px',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 320px',
              maxWidth: '460px',
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event title, venue, or keyword..."
              className="glass-input"
              style={{
                paddingLeft: '2.75rem',
                fontSize: '0.88rem',
              }}
            />
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`glass-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
              style={{ padding: '0.55rem 1rem', fontSize: '0.78rem' }}
            >
              All Events ({counts.all})
            </button>

            <button
              onClick={() => setActiveFilter('INDIVIDUAL')}
              className={`glass-btn ${activeFilter === 'INDIVIDUAL' ? 'active' : ''}`}
              style={{ padding: '0.55rem 1rem', fontSize: '0.78rem' }}
            >
              Solo ({counts.individual})
            </button>

            <button
              onClick={() => setActiveFilter('TEAM')}
              className={`glass-btn ${activeFilter === 'TEAM' ? 'active' : ''}`}
              style={{ padding: '0.55rem 1rem', fontSize: '0.78rem' }}
            >
              Squads ({counts.team})
            </button>

            <button
              onClick={() => setActiveFilter('FREE')}
              className={`glass-btn ${activeFilter === 'FREE' ? 'active' : ''}`}
              style={{ padding: '0.55rem 1rem', fontSize: '0.78rem' }}
            >
              Free Entry ({counts.free})
            </button>
          </div>
        </div>

        {/* Events Grid */}
        {loading && !showSplash ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '2rem',
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="glass-card animate-shimmer"
                style={{
                  height: '240px',
                  background: 'rgba(18, 18, 27, 0.4)',
                }}
              />
            ))}
          </div>
        ) : filteredEvents.length === 0 && !showSplash ? (
          <div
            className="glass-card"
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: 'var(--gold-bright)',
              }}
            >
              <Search size={22} />
            </div>
            <h3 className="font-display" style={{ fontSize: '1.4rem', color: 'var(--text-white)', marginBottom: '0.5rem' }}>
              No Events Found
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              We couldn't find any events matching your filter criteria. Try clearing your search query.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('ALL');
              }}
              className="glass-btn"
              style={{ padding: '0.6rem 1.4rem' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '2rem',
            }}
          >
            {filteredEvents.map((event) => (
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
