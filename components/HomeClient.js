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
  if (type === 'video') return <video src={src} autoPlay muted loop playsInline style={{ width: '100%', display: 'block' }} />;
  return <img src={src} alt={project.title} style={{ width: '100%', display: 'block' }} />;
}

export default function HomeClient({ projects, seo }) {
  const [filter, setFilter] = useState('all');
  const [hovered, setHovered] = useState(null);
  const [pwPrompt, setPwPrompt] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const isMobile = useIsMobile();
  const router = useRouter();
  const px = isMobile ? '20px' : '40px';

  const allCategories = Array.from(new Set(projects.flatMap((p) => p.category || [])));
  const filtered = filter === 'all' ? projects : projects.filter((p) => p.category.includes(filter));

  const handleAdminSubmit = () => {
    if (pwInput === (seo?.adminPassword || '1234')) {
      setPwPrompt(false);
      setAdminMode(true);
    } else {
      setPwError(true);
    }
  };

  const handleProjectClick = (p) => {
    if (p.ready) {
      router.push(`/project/${toSlug(p.title)}`);
    } else if (p.linkTo) {
      const linked = projects.find((pr) => String(pr.id) === String(p.linkTo));
      if (linked) router.push(`/project/${toSlug(linked.title)}`);
    }
  };

  // Admin mode - lazy load admin panel
  if (adminMode) {
    const AdminPanel = require('./AdminPanel').default;
    return <AdminPanel projects={projects} seo={seo} onBack={() => setAdminMode(false)} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', ...HN, overflowX: 'hidden' }}>
      <Nav seo={seo} onAdminClick={() => { setPwPrompt(true); setPwInput(''); setPwError(false); }} isMobile={isMobile} />

      {pwPrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setPwPrompt(false)}>
          <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,.1)', padding: '40px 48px', minWidth: 320 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 11, letterSpacing: '.1em', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', marginBottom: 28 }}>Enter password</div>
            <input autoFocus type="password" value={pwInput}
              onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminSubmit()}
              style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${pwError ? 'rgba(255,80,80,.6)' : 'rgba(255,255,255,.2)'}`, color: '#fff', fontSize: 24, fontWeight: 700, padding: '8px 0', outline: 'none', ...HN, marginBottom: 8 }} />
            {pwError && <div style={{ fontSize: 11, color: 'rgba(255,80,80,.7)', letterSpacing: '.06em', marginTop: 8 }}>Incorrect password</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
              <button onClick={handleAdminSubmit} style={{ padding: '10px 24px', background: '#fff', color: '#000', border: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', ...HN }}>Enter →</button>
              <button onClick={() => setPwPrompt(false)} style={{ padding: '10px 16px', background: 'transparent', color: 'rgba(255,255,255,.3)', border: '1px solid rgba(255,255,255,.1)', fontSize: 11, cursor: 'pointer', ...HN }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: `0 ${px} 120px` }}>
        <div style={{ padding: isMobile ? '48px 0 40px' : '48px 0 36px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <h1 style={{ fontSize: isMobile ? 'clamp(43px,11vw,62px)' : 'clamp(64px,8vw,120px)', fontWeight: 700, letterSpacing: '-.04em', lineHeight: .92, color: '#fff' }}>{seo?.tagline}</h1>
        </div>

        <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: isMobile ? 32 : 56 }}>
          {['all', ...allCategories].map((cat) => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{ padding: isMobile ? '4px 12px 4px 0' : '6px 16px 6px 0', background: 'transparent', border: 'none', color: filter === cat ? '#fff' : 'rgba(255,255,255,.35)', fontSize: 13, cursor: 'pointer', fontWeight: filter === cat ? 700 : 400, letterSpacing: '.04em', textTransform: 'uppercase', ...HN, transition: 'color .15s' }}>
              {cat}
            </button>
          ))}
        </div>

        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {filtered.map((p) => (
              <RevealCard key={p.id} delay={0} onClick={() => handleProjectClick(p)} style={{ cursor: (p.ready || p.linkTo) ? 'pointer' : 'default' }}>
                <ThumbMedia project={p} />
                <div style={{ padding: '12px 0 4px' }}>
                  <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.3 }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', letterSpacing: '.03em', textTransform: 'uppercase', marginTop: 4 }}>{p.subtitle}{p.location || p.year ? ` · ${[p.location, p.year].filter(Boolean).join(' ')}` : ''}</div>
                </div>
              </RevealCard>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {[0, 1, 2].map((col) => (
              <div key={col} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {filtered.filter((_, i) => i % 3 === col).map((p, rowIdx) => (
                  <RevealCard key={p.id} delay={col * 80 + rowIdx * 40}
                    onClick={() => handleProjectClick(p)}
                    onMouseEnter={() => (p.ready || p.linkTo) && setHovered(p.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor: (p.ready || p.linkTo) ? 'pointer' : 'default', position: 'relative' }}>
                    <div style={{ overflow: 'hidden', background: '#111' }}>
                      <div style={{ transition: 'transform .6s cubic-bezier(.16,1,.3,1)', transform: hovered === p.id ? 'scale(1.03)' : 'scale(1)' }}>
                        <ThumbMedia project={p} />
                      </div>
                    </div>
                    <div style={{ padding: '12px 0 18px', background: '#000' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.01em' }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', letterSpacing: '.05em', textTransform: 'uppercase', marginTop: 4 }}>{p.subtitle}{p.location || p.year ? ` · ${[p.location, p.year].filter(Boolean).join(' ')}` : ''}</div>
                    </div>
                  </RevealCard>
                ))}
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'rgba(255,255,255,.2)', fontSize: 13, letterSpacing: '.07em', textTransform: 'uppercase' }}>No projects in this category</div>
        )}
      </div>

      <Footer seo={seo} isMobile={isMobile} />
    </div>
  );
}
