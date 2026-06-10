'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Nav from './Nav';
import Footer from './Footer';
import { toSlug } from '@/lib/db';

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

function useScrollReveal(ref) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.08 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

function RevealCard({ children, delay = 0, style = {}, ...props }) {
  const ref = useRef(null);
  const visible = useScrollReveal(ref);
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(28px)', transition: `opacity .55s ease ${delay}ms, transform .55s ease ${delay}ms`, ...style }} {...props}>
      {children}
    </div>
  );
}

function ThumbMedia({ project }) {
  const src = project.thumbnail || project.cover;
  const type = project.thumbnail ? (project.thumbType || 'image') : project.coverType;
  if (!src) return <div style={{ width: '100%', height: 240, background: '#111' }} />;
  if (type === 'video') return <video preload="metadata" src={src} autoPlay muted loop playsInline style={{ width: '100%', display: 'block' }} />;
  return <img src={src} alt={project.title} style={{ width: '100%', display: 'block' }} />;
}

export default function ListingClient({ projects, seo, title, subtitle }) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const px = isMobile ? '20px' : '40px';

  const go = (p) => {
    if (p.ready) router.push(`/project/${toSlug(p.title)}`);
    else if (p.linkTo) {
      const linked = projects.find((x) => String(x.id) === String(p.linkTo));
      if (linked) router.push(`/project/${toSlug(linked.title)}`);
    }
  };

  const Card = ({ p, delay }) => (
    <RevealCard delay={delay}
      onClick={() => go(p)}
      className="listing-card"
      style={{ cursor: 'pointer', position: 'relative' }}>
      <div style={{ overflow: 'hidden', background: '#111', position: 'relative' }}>
        <div className="listing-card-media" style={{ transition: 'transform .6s cubic-bezier(.16,1,.3,1)' }}>
          <ThumbMedia project={p} />
        </div>
        {p.status === 'sold' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#fff', border: '1px solid rgba(255,255,255,.6)', padding: '6px 14px' }}>Sold</span>
          </div>
        )}
      </div>
      <div style={{ padding: '12px 0 18px', background: '#000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.01em' }}>{p.title}</div>
          {p.price && <div style={{ fontSize: 13, fontWeight: 700, color: p.status === 'sold' ? 'rgba(255,255,255,.3)' : '#fff', whiteSpace: 'nowrap' }}>{p.status === 'sold' ? 'Sold' : p.price}</div>}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', letterSpacing: '.05em', textTransform: 'uppercase', marginTop: 4 }}>{p.subtitle}{p.location || p.year ? ` · ${[p.location, p.year].filter(Boolean).join(' ')}` : ''}</div>
      </div>
    </RevealCard>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', ...HN, overflowX: 'hidden' }}>
      {/* hover-zoom через чистый CSS — не вызывает перерисовку React, поэтому соседние карточки не мигают */}
      <style>{`
        .listing-card:hover .listing-card-media { transform: scale(1.03); }
      `}</style>

      <Nav seo={seo} onAdminClick={() => {}} isMobile={isMobile} />

      <div style={{ padding: `0 ${px} 120px` }}>
        <div style={{ padding: isMobile ? '48px 0 40px' : '48px 0 36px', borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: isMobile ? 32 : 56 }}>
          <h1 style={{ fontSize: isMobile ? 'clamp(43px,11vw,62px)' : 'clamp(64px,8vw,120px)', fontWeight: 700, letterSpacing: '-.04em', lineHeight: .92, color: '#fff' }}>{title}</h1>
          {subtitle && <div style={{ fontSize: isMobile ? 13 : 15, color: 'rgba(255,255,255,.45)', letterSpacing: '.03em', marginTop: 14 }}>{subtitle}</div>}
        </div>

        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'rgba(255,255,255,.2)', fontSize: 13, letterSpacing: '.07em', textTransform: 'uppercase' }}>Nothing here yet</div>
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {projects.map((p) => <Card key={p.id} p={p} delay={0} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {[0, 1, 2].map((col) => (
              <div key={col} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {projects.filter((_, i) => i % 3 === col).map((p, rowIdx) => (
                  <Card key={p.id} p={p} delay={col * 80 + rowIdx * 40} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer seo={seo} isMobile={isMobile} />
    </div>
  );
}
