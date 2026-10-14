'use client';
import { useEffect, useRef, useState } from 'react';

// Плитка-«встраивание» в сетке работ: живая страница в iframe (например, WebGL-интро Digital Jazz).
// Проект в админке: Thumbnail type = embed, Embed URL, постер — обычная загрузка thumbnail.
// IntroThumb — превью в плитке (iframe монтируется, только когда плитка рядом с экраном).
// IntroOverlay — та же страница на весь экран (десктоп), закрытие крестиком или Esc.
export const INTRO_SRC = '/proto/dj-intro-en/index.html';
export const INTRO_POSTER = '/proto/dj-intro-en/poster-tile.webp';

// Шаблон для кнопки «+ Digital Jazz intro» в админке и запасной вариант на главной,
// пока такой проект не создан в базе.
export const INTRO_ITEM = {
  id: 'dj-intro',
  title: 'Digital Jazz — Landing Intro',
  subtitle: 'Art direction · UI · WebGL',
  year: '2026',
  location: '',
  category: ['ui', 'motion'],
  type: 'work',
  thumbType: 'embed',
  embedUrl: INTRO_SRC,
  thumbnail: INTRO_POSTER,
  embedRatio: '4 / 5',
  coverType: 'image',
  cover: '',
  desc: '',
  blocks: [],
  featured: false,
  ready: false,
};

export const isEmbed = (p) => p && p.thumbType === 'embed' && !!p.embedUrl;

const withQuery = (url, q) => url + (url.includes('?') ? '&' : '?') + q;

export function IntroThumb({ src, poster, ratio, interactive }) {
  const box = useRef(null);
  const frame = useRef(null);
  const [live, setLive] = useState(false);
  const [hint, setHint] = useState(false);

  // Десктоп: iframe без pointer-events, поэтому передаём курсор внутрь сообщением (x, y — доли плитки 0..1)
  const sendPointer = (e, down) => {
    const w = frame.current && frame.current.contentWindow;
    if (!w || !box.current) return;
    const r = box.current.getBoundingClientRect();
    w.postMessage({ type: 'tile-pointer', x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, down: !!down }, '*');
  };

  useEffect(() => {
    if (!box.current) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { rootMargin: '200px 0px' });
    io.observe(box.current);
    return () => io.disconnect();
  }, []);

  // Подсказка «Swipe / Hover»: появляется, когда плитка ожила. На мобиле касания уходят в iframe
  // и наружу не видны, поэтому гаснет по таймеру; на десктопе — при наведении мыши.
  useEffect(() => {
    if (!live) { setHint(false); return; }
    setHint(true);
    if (!interactive) return;
    const id = setTimeout(() => setHint(false), 4500);
    return () => clearTimeout(id);
  }, [live, interactive]);

  return (
    <div
      ref={box}
      onMouseMove={interactive ? undefined : (e) => sendPointer(e)}
      onMouseEnter={interactive ? undefined : (e) => { setHint(false); sendPointer(e, true); }}
      onMouseLeave={interactive ? undefined : () => frame.current?.contentWindow?.postMessage({ type: 'tile-leave' }, '*')}
      style={{ position: 'relative', width: '100%', aspectRatio: ratio || '4 / 5', background: `#06040B ${poster ? `url(${poster}) center / cover` : ''}`, overflow: 'hidden' }}
    >
      {live && (
        <iframe
          ref={frame}
          src={withQuery(src, 'embed=1')}
          title="Preview"
          tabIndex={-1}
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, pointerEvents: interactive ? 'auto' : 'none', display: 'block' }}
        />
      )}
      <SwipeHint visible={hint} label={interactive ? 'Swipe' : 'Hover'} />
      {!interactive && <span style={{ position: 'absolute', right: 12, bottom: 12, width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.3)', backdropFilter: 'blur(8px)', color: '#fff' }} aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
      </span>}
    </div>
  );
}

// Плашка-подсказка поверх живой плитки: точка-«палец» ходит между шевронами ‹ ›.
// pointer-events: none — не мешает касаниям и клику по плитке.
function SwipeHint({ visible, label }) {
  return (
    <>
      <style>{`@keyframes lhSwipeDot{0%,100%{transform:translateX(-7px)}50%{transform:translateX(7px)}}`}</style>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', left: 12, top: 12, zIndex: 2, height: 30, padding: '0 12px 0 10px', borderRadius: 15,
          display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none',
          background: 'rgba(0,0,0,.45)', border: '1px solid rgba(255,255,255,.25)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          color: 'rgba(255,255,255,.9)', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: 11, fontWeight: 700,
          letterSpacing: '.1em', textTransform: 'uppercase', lineHeight: 1,
          opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(-4px)', transition: 'opacity .5s ease, transform .5s ease',
        }}
      >
        <span style={{ position: 'relative', width: 30, height: 14, display: 'block' }}>
          <svg width="30" height="14" viewBox="0 0 30 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', inset: 0, opacity: .55 }}>
            <path d="M5 3L1 7l4 4M25 3l4 4-4 4" />
          </svg>
          <span style={{ position: 'absolute', left: 11, top: 3, width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'lhSwipeDot 1.6s ease-in-out infinite' }} />
        </span>
        {label}
      </span>
    </>
  );
}

export function IntroOverlay({ src, title, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={title || 'Preview'} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#06040B' }}>
      <iframe src={src} title={title || 'Preview'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
      <button
        onClick={onClose}
        aria-label="Close"
        style={{ position: 'absolute', top: 24, right: 28, width: 64, height: 64, borderRadius: '50%', border: '1px solid rgba(255,255,255,.4)', background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(10px)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
  );
}
