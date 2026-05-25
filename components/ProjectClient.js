'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Nav from './Nav';
import Footer from './Footer';

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

function CoverMedia({ project, style }) {
  if (!project.cover) return <div style={style} />;
  if (project.coverType === 'video') return (
    <div style={{ ...style, overflow: 'hidden' }}>
      <video src={project.cover} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
  return (
    <div style={{ ...style, overflow: 'hidden' }}>
      <img src={project.cover} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}

function MediaSlot({ src, type, caption, ratio, autoplay }) {
  if (!src) return <div style={{ width: '100%', aspectRatio: ratio, background: '#111' }} />;
  if (type === 'video') return (
    <div style={{ width: '100%', aspectRatio: ratio, background: '#111', overflow: 'hidden' }}>
      {autoplay
        ? <video src={src} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <video src={src} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
    </div>
  );
  return (
    <div style={{ width: '100%', aspectRatio: ratio, background: '#111', overflow: 'hidden' }}>
      <img src={src} alt={caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}

function ContentBlock({ block, isMobile }) {
  if (block.type === 'text') return (
    <p style={{ ...HN, fontSize: isMobile ? 17 : 30, lineHeight: 1.75, color: 'rgba(255,255,255,.85)', marginBottom: isMobile ? 24 : 72, fontWeight: 300, textAlign: 'center', whiteSpace: 'pre-wrap' }}>{block.content}</p>
  );

  if (block.type === 'quote') return (
    <blockquote style={{ margin: isMobile ? '0 0 40px' : '0 0 168px', padding: 0, textAlign: 'center' }}>
      <p style={{ ...HN, fontSize: isMobile ? 24 : 48, fontWeight: 700, lineHeight: 1.25, color: '#fff', letterSpacing: '-.03em' }}>{block.content}</p>
    </blockquote>
  );

  if (block.type === 'image' || block.type === 'video') {
    const layout = block.layout || 'wide';
    const type = block.type;
    const autoplay = block.autoplay;

    const getRatio = () => {
      if (layout === 'three-vertical' || layout === 'four-vertical') return '9/16';
      if (layout === 'two-square' || layout === 'three-square') return '1/1';
      return '16/9';
    };

    const slots = {
      'wide': [block.src],
      'two-square': [block.src, block.src2],
      'three-square': [block.src, block.src2, block.src3],
      'three-vertical': [block.src, block.src2, block.src3],
      'four-vertical': [block.src, block.src2, block.src3, block.src4],
    }[layout] || [block.src];

    if (isMobile) {
      return (
        <div style={{ marginBottom: 24, marginLeft: 'calc(-100vw * 0.1)', marginRight: 'calc(-100vw * 0.1)', width: 'calc(100% + 100vw * 0.2)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {slots.map((s, i) => (
              <MediaSlot key={i} src={s} type={type} ratio={getRatio()} autoplay={autoplay} />
            ))}
          </div>
        </div>
      );
    }

    const gap = 8;
    const gridCols = {
      'wide': '1fr',
      'two-square': '1fr 1fr',
      'three-square': '1fr 1fr 1fr',
      'three-vertical': '1fr 1fr 1fr',
      'four-vertical': '1fr 1fr 1fr 1fr',
    }[layout];

    return (
      <div style={{ marginBottom: 72, display: 'grid', gridTemplateColumns: gridCols, gap }}>
        {slots.map((s, i) => (
          <MediaSlot key={i} src={s} type={type} ratio={getRatio()} autoplay={autoplay} />
        ))}
      </div>
    );
  }

  return null;
}

export default function ProjectClient({ project, seo }) {
  const isMobile = useIsMobile();
  const px = isMobile ? '20px' : '40px';

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', ...HN, overflowX: 'hidden' }}>
      <Nav seo={seo} onAdminClick={() => {}} isMobile={isMobile} />

      {project.cover ? (
        <>
          <div style={{ width: '100%', height: isMobile ? '30vh' : '44vh', overflow: 'hidden' }}>
            <CoverMedia project={project} style={{ width: '100%', height: '100%' }} />
          </div>
          <div style={{ padding: isMobile ? '28px 20px 0' : '48px 40px 0', textAlign: 'center' }}>
            <div style={{ width: '100%', maxWidth: isMobile ? '100%' : '80%', margin: '0 auto' }}>
              <h1 style={{ fontSize: isMobile ? 'clamp(32px,9vw,52px)' : 'clamp(48px,6vw,88px)', fontWeight: 700, letterSpacing: '-.04em', lineHeight: .93, color: '#fff', marginBottom: 14, textAlign: 'center' }}>{project.title}</h1>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', letterSpacing: '.05em', textTransform: 'uppercase', textAlign: 'center' }}>{project.subtitle} {project.location} {project.year}</div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ width: '100%', padding: isMobile ? '34px 20px 24px' : '48px 40px 36px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,.07)', textAlign: 'center' }}>
          <h1 style={{ fontSize: isMobile ? 'clamp(43px,11vw,62px)' : 'clamp(64px,8vw,120px)', fontWeight: 700, letterSpacing: '-.04em', lineHeight: .92, color: '#fff', textAlign: 'center', marginBottom: 14 }}>{project.title}</h1>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', letterSpacing: '.05em', textTransform: 'uppercase', textAlign: 'center' }}>{project.subtitle} {project.location} {project.year}</div>
        </div>
      )}

      <div style={{ padding: isMobile ? '32px 20px 100px' : `96px ${px} 140px`, textAlign: 'center' }}>
        <div style={{ width: '100%' }}>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 56 }}>
              <Link href="/" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.4)', fontSize: 12, padding: 0, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '.06em', textTransform: 'uppercase', ...HN, textDecoration: 'none' }}>← Back to Work</Link>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {project.category.map((c) => (
                  <span key={c} style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', border: '1px solid rgba(255,255,255,.15)', padding: '4px 12px' }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          <p style={{ ...HN, fontSize: isMobile ? 17 : 30, fontWeight: 700, lineHeight: 1.75, color: '#fff', letterSpacing: '-.01em', marginBottom: isMobile ? 12 : 16, textAlign: 'center' }}>{project.desc}</p>

          {(project.blocks || []).map((b) => (
            <ContentBlock key={b.id} block={b} isMobile={isMobile} />
          ))}

          <div style={{ marginTop: 80, paddingTop: 48, borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', justifyContent: 'center' }}>
            <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 32px', background: '#fff', color: '#000', border: 'none', fontSize: 13, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none', ...HN }}>Start a project →</Link>
          </div>
        </div>
      </div>

      <Footer seo={seo} isMobile={isMobile} />
    </div>
  );
}
