import React, { useEffect, useRef, useState } from 'react';

// Shared image cache so /assets/logo.png is decoded once
let cachedLogo = null;
let logoLoadingPromise = null;

function getLogoImage() {
  if (cachedLogo && cachedLogo.complete && cachedLogo.naturalWidth > 0) {
    return Promise.resolve(cachedLogo);
  }
  if (logoLoadingPromise) return logoLoadingPromise;

  logoLoadingPromise = new Promise((resolve) => {
    const img = new Image();
    img.src = '/assets/logo.png';
    img.onload = () => {
      cachedLogo = img;
      resolve(img);
    };
    img.onerror = () => {
      resolve(null);
    };
  });
  return logoLoadingPromise;
}

/**
 * AsthraLogo component
 * Renders the Asthra 26 festival logo with a slow metallic shine.
 * 
 * Uses HTML5 Canvas with 'source-atop' composite mode to guarantee that the shine
 * only applies to the visible non-transparent pixels of the emblem.
 * Transparent areas remain 100% untouched with zero square/box artifact.
 */
export default function AsthraLogo({ size = 36, style = {}, className = '' }) {
  const canvasRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const numSize = typeof size === 'number' ? size : parseInt(size, 10) || 36;

  useEffect(() => {
    let animId;
    let isCancelled = false;

    getLogoImage().then((img) => {
      if (isCancelled || !img) return;
      setImageLoaded(true);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = numSize * dpr;
      canvas.height = numSize * dpr;

      const cycleDuration = 5000; // 5.0s full cycle
      const sweepDuration = 1500; // 1.5s active shine sweep, 3.5s quiet pause
      const startTime = performance.now();

      const render = () => {
        if (isCancelled) return;

        const now = performance.now();
        const elapsed = (now - startTime) % cycleDuration;

        // Reset transform & clear all pixels to 100% transparency
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, numSize, numSize);

        // 1. Draw base logo emblem onto transparent canvas
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, 0, 0, numSize, numSize);

        // 2. Animate shine sweep strictly over existing opaque pixels using 'source-atop'
        if (elapsed < sweepDuration) {
          const progress = elapsed / sweepDuration; // 0.0 -> 1.0
          // Beam travels from left to right diagonally across the logo
          const beamX = -numSize * 0.7 + progress * (numSize * 2.4);

          ctx.save();
          // MATHEMATICAL GUARANTEE: 'source-atop' composites ONLY where destination alpha > 0.
          // Transparent pixels are never drawn or altered under any circumstances.
          ctx.globalCompositeOperation = 'source-atop';

          // Angled beam (25 degrees)
          const angle = (25 * Math.PI) / 180;
          const halfBeamWidth = numSize * 0.32;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          const x0 = beamX - halfBeamWidth * cos;
          const y0 = numSize * 0.5 - halfBeamWidth * sin;
          const x1 = beamX + halfBeamWidth * cos;
          const y1 = numSize * 0.5 + halfBeamWidth * sin;

          const grad = ctx.createLinearGradient(x0, y0, x1, y1);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          grad.addColorStop(0.3, 'rgba(255, 244, 208, 0.25)');
          grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
          grad.addColorStop(0.7, 'rgba(245, 215, 127, 0.45)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, numSize, numSize);
          ctx.restore();
        }

        animId = requestAnimationFrame(render);
      };

      animId = requestAnimationFrame(render);
    });

    return () => {
      isCancelled = true;
      if (animId) cancelAnimationFrame(animId);
    };
  }, [numSize]);

  return (
    <div
      className={className}
      style={{
        width: `${numSize}px`,
        height: `${numSize}px`,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.4))',
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: `${numSize}px`,
          height: `${numSize}px`,
          display: 'block',
          background: 'transparent',
        }}
      />
      {!imageLoaded && (
        <img
          src="/assets/logo.png"
          alt="Asthra 26 Logo"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      )}
    </div>
  );
}
