'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Nav from './Nav';
import Footer from './Footer';
import AgeGate from './AgeGate';

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
      <video preload="metadata" src={project.cover} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
  return (
    <div style={{ ...style, overflow: 'hidden' }}>
      <img loading="lazy" src={project.cover} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}

function MediaSlot({ src, type, caption, ratio, autoplay }) {
  if (!src) return <div style={{ width: '100%', aspectRatio: ratio, background: '#111' }} />;
  if (type === 'video') return (
    <div style={{ width: '100%', aspectRatio: ratio, background: '#111', overflow: 'hidden' }}>
      {autoplay
        ? <video preload="metadata" src={src} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <video preload="metadata" src={src} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
    </div>
  );
  return (
    <div style={{ width: '100%', aspectRatio: ratio, background: '#111', overflow: 'hidden' }}>
      <img loading="lazy" src={src} alt={caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

function SaleMeta({ project, isMobile }) {
  const sold = project.status === 'sold';
  if (!project.price && !sold) return null;
  return (
    <div style={{ marginTop: 18, display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
      <span style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, letterSpacing: '-.02em', color: sold ? 'rgba(255,255,255,.4)' : '#fff' }}>
        {sold ? 'Sold' : project.price}
      </span>
      {!sold && (
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#4caf86', border: '1px solid #4caf86', padding: '3px 9px' }}>Available</span>
      )}
    </div>
  );
}

function ProjectContent({ project, seo }) {
  const isMobile = useIsMobile();
  const px = isMobile ? '20px' : '40px';

  const isSale = project.type === 'brand-for-sale' || project.type === 'shop';
  const sold = project.status === 'sold';
  const backHref = project.type === 'brand-for-sale' ? '/brands-for-sale' : project.type === 'shop' ? '/shop' : '/';
  const backLabel = project.type === 'brand-for-sale' ? '← Back to Brands' : project.type === 'shop' ? '← Back to Shop' : '← Back to Work';
  const buyLabel = project.type === 'brand-for-sale' ? 'Make an offer →' : 'Buy →';

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
              {isSale && <SaleMeta project={project} isMobile={isMobile} />}
            </div>
          </div>
        </>
      ) : (
        <div style={{ width: '100%', padding: isMobile ? '34px 20px 24px' : '48px 40px 36px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,.07)', textAlign: 'center' }}>
          <h1 style={{ fontSize: isMobile ? 'clamp(43px,11vw,62px)' : 'clamp(64px,8vw,120px)', fontWeight: 700, letterSpacing: '-.04em', lineHeight: .92, color: '#fff', textAlign: 'center', marginBottom: 14 }}>{project.title}</h1>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', letterSpacing: '.05em', textTransform: 'uppercase', textAlign: 'center' }}>{project.subtitle} {project.location} {project.year}</div>
          {isSale && <SaleMeta project={project} isMobile={isMobile} />}
        </div>
      )}

      <div style={{ padding: isMobile ? '32px 20px 100px' : `96px ${px} 140px`, textAlign: 'center' }}>
        <div style={{ width: '100%' }}>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 56 }}>
              <Link href={backHref} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.4)', fontSize: 12, padding: 0, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '.06em', textTransform: 'uppercase', ...HN, textDecoration: 'none' }}>{backLabel}</Link>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(project.category || []).map((c) => (
                  <span key={c} style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', border: '1px solid rgba(255,255,255,.15)', padding: '4px 12px' }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          <p style={{ ...HN, fontSize: isMobile ? 17 : 30, fontWeight: 700, lineHeight: 1.75, color: '#fff', letterSpacing: '-.01em', marginBottom: isMobile ? 12 : 16, textAlign: 'center' }}>{project.desc}</p>

          {(project.blocks || []).map((b) => (
            <ContentBlock key={b.id} block={b} isMobile={isMobile} />
          ))}

          <div style={{ marginTop: 80, paddingTop: 48, borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            {isSale ? (
              sold ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 32px', background: 'transparent', color: 'rgba(255,255,255,.4)', border: '1px solid rgba(255,255,255,.15)', fontSize: 13, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', ...HN }}>Sold</span>
              ) : project.buyUrl ? (
                <a href={project.buyUrl} target="_blank" rel="nofollow sponsored noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 32px', background: '#fff', color: '#000', border: 'none', fontSize: 13, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none', ...HN }}>{buyLabel}</a>
              ) : (
                <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 32px', background: '#fff', color: '#000', border: 'none', fontSize: 13, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none', ...HN }}>Inquire →</Link>
              )
            ) : (
              <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 32px', background: '#fff', color: '#000', border: 'none', fontSize: 13, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none', ...HN }}>Start a project →</Link>
            )}
          </div>
        </div>
      </div>

      <Footer seo={seo} isMobile={isMobile} />
    </div>
  );
}

export default function ProjectClient({ project, seo }) {
  if (project.ageGate) {
    return (
      <AgeGate>
        <ProjectContent project={project} seo={seo} />
      </AgeGate>
    );
  }
  return <ProjectContent project={project} seo={seo} />;
}
