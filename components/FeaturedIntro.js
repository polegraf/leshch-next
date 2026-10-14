'use client';
import { useEffect, useRef, useState } from 'react';

// Digital Jazz — заходная анимация (WebGL) как плитка в сетке работ.
// IntroThumb — превью для плитки: постер + живой iframe, пока плитка рядом с экраном.
// IntroOverlay — та же анимация на весь экран (десктоп), закрытие крестиком или Esc.
export const INTRO_SRC = '/proto/dj-intro-en/index.html';

export const INTRO_ITEM = {
  id: 'dj-intro',
  __intro: true,
  title: 'Digital Jazz — Landing Intro',
  subtitle: 'Art direction · UI · WebGL',
  year: 2026,
  ready: true,
};

export function IntroThumb({ isMobile }) {
  const box = useRef(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!box.current) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { rootMargin: '200px 0px' });
    io.observe(box.current);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={box}
      style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: '#06040B url(/proto/dj-intro-en/poster-tile.webp) center / cover', overflow: 'hidden' }}
    >
      {live && (
        <iframe
          src={`${INTRO_SRC}?embed=1`}
          title="Digital Jazz — landing intro (preview)"
          tabIndex={-1}
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, pointerEvents: 'none', display: 'block' }}
        />
      )}
      <span style={{ position: 'absolute', right: 12, bottom: 12, width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.3)', backdropFilter: 'blur(8px)', color: '#fff' }} aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
      </span>
    </div>
  );
}

export function IntroOverlay({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Digital Jazz — landing intro" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#06040B' }}>
      <iframe src={INTRO_SRC} title="Digital Jazz — landing intro" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
      <button
        onClick={onClose}
        aria-label="Close"
        style={{ position: 'absolute', top: 18, right: 22, width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,.35)', background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(10px)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
  );
}
