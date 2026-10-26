import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import EventCard from '../components/EventCard';
import EventModal from '../components/EventModal';
import LookupTicketModal from '../components/LookupTicketModal';
import SplashLoader from '../components/SplashLoader';
import { Search, Sparkles, Ticket, Users, Layers, Filter } from 'lucide-react';

export default function ParticipantPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [lookupOpen, setLookupOpen] = useState(false);

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

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3.5rem 2rem 6rem' }}>
        {/* Top Hero Section */}
        <div style={{ marginBottom: '3.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.72rem',
                fontWeight: '700',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--gold-bright)',
                marginBottom: '0.75rem',
              }}
            >
              <Sparkles size={14} color="#D4AF37" />
              <span>Asthra 26 • Official Registration Portal</span>
            </div>

            <h1
              className="font-display gold-text-glow"
              style={{
                fontSize: 'clamp(2.8rem, 6vw, 4.5rem)',
                fontWeight: '800',
                letterSpacing: '0.04em',
                lineHeight: 1.15,
                marginBottom: '1rem',
              }}
            >
              Hello there!
            </h1>

            <p
              style={{
                fontSize: '1.05rem',
                color: 'var(--text-secondary)',
                maxWidth: '680px',
                lineHeight: 1.6,
              }}
            >
              Explore our premier flagship competitions, workshops, and team challenges.
              Register in seconds and claim your instant verified digital venue pass.
            </p>
          </div>

          {/* Quick Ticket Lookup Trigger */}
          <button
            onClick={() => setLookupOpen(true)}
            className="glass-btn"
            style={{
              padding: '0.85rem 1.4rem',
              gap: '0.65rem',
              fontSize: '0.85rem',
              color: 'var(--gold-bright)',
              borderColor: 'rgba(212, 175, 55, 0.35)',
            }}
          >
            <Ticket size={16} color="#D4AF37" />
            <span>Find My Pass</span>
          </button>
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

        {/* Find My Ticket Pass Modal */}
        {lookupOpen && (
          <LookupTicketModal onClose={() => setLookupOpen(false)} />
        )}
      </div>
    </>
  );
}
