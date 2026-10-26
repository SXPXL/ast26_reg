import React from 'react';
import { Sparkles } from 'lucide-react';
import AsthraLogo from './AsthraLogo';

export default function SplashLoader({ isFadingOut }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#040404',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isFadingOut ? 0 : 1,
        transform: isFadingOut ? 'scale(1.02)' : 'scale(1)',
        transition: 'opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isFadingOut ? 'none' : 'auto',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background aura */}
      <div
        style={{
          position: 'absolute',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 215, 127, 0.16) 0%, rgba(212, 175, 55, 0.04) 50%, transparent 70%)',
          filter: 'blur(75px)',
          animation: 'splashAuraPulse 3s infinite ease-in-out',
          pointerEvents: 'none',
        }}
      />

      {/* Main Logo & Text Presentation Container */}
      <div
        className="splash-content"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          padding: '2rem 3rem',
          borderRadius: '24px',
        }}
      >
        {/* Logo */}
        <AsthraLogo size={80} />

        {/* Gold Asthra 26 Text with text-only shine sweep */}
        <div
          className="font-display splash-text-sweep"
          style={{
            fontSize: 'clamp(2.8rem, 7.5vw, 4.4rem)',
            fontWeight: '900',
            letterSpacing: '0.08em',
            textAlign: 'center',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          Asthra 26
        </div>
      </div>
    </div>
  );
}
