'use client';
import { useState, useEffect } from 'react';
import Nav from './Nav';

const HN = { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" };

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 1024);
    fn();
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

export default function PhotoClient({ seo, photos }) {
  const [idx, setIdx] = useState(0);
  const [showRotate, setShowRotate] = useState(false);
  const isMobile = useIsMobile();
  const total = photos.length;

  useEffect(() => { if (isMobile) setShowRotate(true); }, [isMobile]);

  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  useEffect(() => {
    const fn = (e) => { if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [total]);

  if (total === 0) return (
    <div style={{ minHeight: '100vh', background: '#000', ...HN }}>
      <Nav seo={seo} onAdminClick={() => {}} isMobile={isMobile} />
      <div style={{ height: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.2)', fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase' }}>
        No photos yet
      </div>
    </div>
  );

  const photo = photos[idx];

  return (
    <div style={{ minHeight: '100vh', background: '#000', ...HN }}>
      <Nav seo={seo} onAdminClick={() => {}} isMobile={isMobile} />
      <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 56px)', overflow: 'hidden', background: '#000' }}>
        {isMobile && showRotate && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.15)', padding: '36px 40px', maxWidth: 280, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>↻</div>
              <div style={{ ...HN, fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8, letterSpacing: '-.01em' }}>Rotate your device</div>
              <div style={{ ...HN, fontSize: 13, color: 'rgba(255,255,255,.45)', lineHeight: 1.6, marginBottom: 24 }}>This section is best viewed in landscape mode</div>
              <button onClick={() => setShowRotate(false)} style={{ padding: '10px 28px', background: '#fff', color: '#000', border: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', ...HN }}>Continue anyway</button>
            </div>
          </div>
        )}

        <img src={photo.url} alt={photo.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', pointerEvents: 'none' }}>
          <button onClick={prev} style={{ pointerEvents: 'all', background: 'rgba(0,0,0,.7)', border: 'none', color: '#fff', fontSize: 20, width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', ...HN }}>←</button>
          <button onClick={next} style={{ pointerEvents: 'all', background: 'rgba(0,0,0,.7)', border: 'none', color: '#fff', fontSize: 20, width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', ...HN }}>→</button>
        </div>

        <div style={{ position: 'absolute', bottom: 24, left: 24, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {photo.date && <span style={{ background: 'rgba(0,0,0,.75)', color: '#fff', fontSize: 11, padding: '5px 10px', letterSpacing: '.06em', textTransform: 'uppercase', ...HN }}>{photo.date}</span>}
          {photo.location && <span style={{ background: 'rgba(0,0,0,.75)', color: '#fff', fontSize: 11, padding: '5px 10px', letterSpacing: '.06em', textTransform: 'uppercase', ...HN }}>{photo.location}</span>}
          {photo.caption && <span style={{ background: 'rgba(0,0,0,.75)', color: '#fff', fontSize: 11, padding: '5px 10px', letterSpacing: '.06em', ...HN }}>{photo.caption}</span>}
        </div>

        <div style={{ position: 'absolute', bottom: 24, right: 24, background: 'rgba(0,0,0,.75)', color: '#fff', fontSize: 11, padding: '5px 10px', letterSpacing: '.06em', ...HN }}>
          {idx + 1} / {total}
        </div>
      </div>
    </div>
  );
}
