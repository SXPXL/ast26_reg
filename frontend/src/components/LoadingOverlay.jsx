import React from 'react';

export default function LoadingOverlay({
  active = false,
  fullScreen = true,
  blurAmount = '12px',
}) {
  if (!active) return null;

  return (
    <div
      style={{
        position: fullScreen ? 'fixed' : 'absolute',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(5, 5, 9, 0.75)',
        backdropFilter: `blur(${blurAmount})`,
        WebkitBackdropFilter: `blur(${blurAmount})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeInOverlay 0.2s ease-out forwards',
        pointerEvents: 'all',
      }}
    >
      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes orbitalSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orbitalCounterSpin {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>

      {/* Gold Themed Minimalist Orbital Spinner Rings */}
      <div
        style={{
          position: 'relative',
          width: '76px',
          height: '76px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Subtle Ambient Gold Glow */}
        <div
          style={{
            position: 'absolute',
            inset: '-12px',
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0) 70%)',
            borderRadius: '50%',
            filter: 'blur(8px)',
          }}
        />

        {/* Outer Orbital Ring */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2.5px solid transparent',
            borderTopColor: '#F5D77F',
            borderRightColor: 'rgba(212, 175, 55, 0.45)',
            boxShadow: '0 0 16px rgba(212, 175, 55, 0.35)',
            animation: 'orbitalSpin 1.2s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite',
          }}
        />

        {/* Middle Dashed Ring */}
        <div
          style={{
            position: 'absolute',
            inset: '8px',
            borderRadius: '50%',
            border: '1.5px dashed rgba(255, 244, 208, 0.55)',
            animation: 'orbitalCounterSpin 2.2s linear infinite',
          }}
        />

        {/* Inner Gold Ring */}
        <div
          style={{
            position: 'absolute',
            inset: '16px',
            borderRadius: '50%',
            border: '2px solid transparent',
            borderBottomColor: '#D4AF37',
            borderLeftColor: 'rgba(245, 215, 127, 0.7)',
            boxShadow: '0 0 10px rgba(212, 175, 55, 0.3)',
            animation: 'orbitalSpin 0.9s linear infinite',
          }}
        />
      </div>
    </div>
  );
}
