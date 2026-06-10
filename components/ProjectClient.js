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
    
    <p style={{ ...HN, fontSize: isMobile ? 17 : 30, lineHeight: 1.75, color: 'rgba(255,255,255,.85)', marginBottom: isMobile ? 24 : 72, fontWeight: 300, textAlign: 'center', whiteSpace: 'pre-wrap', maxWidth: isMobile ? '100%' : '80%', marginLeft: 'auto', marginRight: 'auto' }}>{block.content}</p>
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
  const preorder = project.status === 'preorder';
  // Показываем цифру-цену; призывы вроде "Make an offer" не дублируем (они на кнопке)
  const looksLikePrice = project.price && /[\d$€£₽]/.test(project.price);
  const showPrice = sold || looksLikePrice;
  return (
    <div style={{ marginTop: 18, display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
      {showPrice && (
        <span style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, letterSpacing: '-.02em', color: sold ? 'rgba(255,255,255,.4)' : '#fff' }}>
          {sold ? 'Sold' : project.price}
        </span>
      )}
      {preorder && (
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#e0a23b', border: '1px solid #e0a23b', padding: '3px 9px' }}>Pre-order</span>
      )}
      {!sold && !preorder && (
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#4caf86', border: '1px solid #4caf86', padding: '3px 9px' }}>Available</span>
      )}
    </div>
  );
}

// Форма предзаказа: собирает лид (имя, email, сообщение) и шлёт POST на /api/lead.
// company — honeypot: скрытое поле, которое заполняют только боты.
function PreorderForm({ project, isMobile }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | done | error
  const [err, setErr] = useState('');

  const inputStyle = {
    width: '100%', background: '#0a0a0a', border: '1px solid rgba(255,255,255,.15)',
    color: '#fff', padding: isMobile ? '16px 18px' : '22px 26px', fontSize: isMobile ? 18 : 28, ...HN, outline: 'none',
    borderRadius: 2, boxSizing: 'border-box',
  };

  const submit = async () => {
    if (state === 'sending') return;
    setErr('');
    if (name.trim().length < 2) { setErr('Enter your name'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('Enter a valid email'); return; }
    setState('sending');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, message, company,
          projectId: project.id,
          projectSlug: project.slug || '',
          projectTitle: project.title,
        }),
      });
      if (!res.ok) throw new Error('failed');
      setState('done');
    } catch {
      setState('error');
      setErr('Something went wrong. Please try again.');
    }
  };

  if (state === 'done') {
    return (
      <div style={{ textAlign: 'center', maxWidth: isMobile ? 460 : 720, margin: '0 auto' }}>
        <div style={{ fontSize: isMobile ? 30 : 44, fontWeight: 700, color: '#fff', marginBottom: 14, letterSpacing: '-.02em' }}>You&apos;re on the list ✓</div>
        <div style={{ fontSize: isMobile ? 17 : 24, color: 'rgba(255,255,255,.5)', lineHeight: 1.6 }}>We&apos;ll email you the moment it&apos;s available.</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: isMobile ? 460 : 720, margin: '0 auto' }}>
      <div style={{ fontSize: isMobile ? 30 : 40, fontWeight: 700, color: '#fff', marginBottom: 12, letterSpacing: '.04em', textTransform: 'uppercase', textAlign: 'center' }}>Pre-order</div>
      <div style={{ fontSize: isMobile ? 17 : 26, color: 'rgba(255,255,255,.5)', marginBottom: isMobile ? 28 : 40, lineHeight: 1.6, textAlign: 'center' }}>Leave your details and we&apos;ll get in touch as soon as it&apos;s ready.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 18 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" style={inputStyle} />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={inputStyle} />
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message (optional)" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        {/* honeypot: скрыто от людей, заполняют только боты */}
        <input value={company} onChange={e => setCompany(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
        {err && <div style={{ fontSize: isMobile ? 14 : 18, color: 'rgba(255,90,90,.9)', textAlign: 'center' }}>{err}</div>}
        <button onClick={submit} disabled={state === 'sending'} style={{ marginTop: 8, padding: isMobile ? '20px 32px' : '28px 48px', background: '#fff', color: '#000', border: 'none', fontSize: isMobile ? 17 : 24, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', cursor: state === 'sending' ? 'default' : 'pointer', opacity: state === 'sending' ? .6 : 1, ...HN }}>
          {state === 'sending' ? 'Sending...' : 'Pre-order →'}
        </button>
      </div>
    </div>
  );
}

// H1 — настоящий заголовок. Если загружен titleLogo, рисуем картинку внутри H1
// с alt = название (текст для SEO сохраняется, на экране видно лого).
function TitleHeading({ project, isMobile, fontSize }) {
  if (project.titleLogo) {
    return (
      <h1 style={{ margin: '0 auto 14px', display: 'flex', justifyContent: 'center', lineHeight: 0 }}>
        <img src={project.titleLogo} alt={project.title} style={{ maxWidth: '100%', maxHeight: isMobile ? 110 : 180, display: 'block', objectFit: 'contain' }} />
      </h1>
    );
  }
  return (
    <h1 style={{ fontSize, fontWeight: 700, letterSpacing: '-.04em', lineHeight: .92, color: '#fff', marginBottom: 14, textAlign: 'center' }}>{project.title}</h1>
  );
}

function ProjectContent({ project, seo }) {
  const isMobile = useIsMobile();
  const px = isMobile ? '20px' : '40px';

  const isSale = project.type === 'brand-for-sale' || project.type === 'shop';
  const sold = project.status === 'sold';
  const preorder = project.status === 'preorder';
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
              <TitleHeading project={project} isMobile={isMobile} fontSize={isMobile ? 'clamp(32px,9vw,52px)' : 'clamp(48px,6vw,88px)'} />
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', letterSpacing: '.05em', textTransform: 'uppercase', textAlign: 'center' }}>{project.subtitle} {project.location} {project.year}</div>
              {isSale && <SaleMeta project={project} isMobile={isMobile} />}
            </div>
          </div>
        </>
      ) : (
        <div style={{ width: '100%', padding: isMobile ? '34px 20px 24px' : '48px 40px 36px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,.07)', textAlign: 'center' }}>
          <TitleHeading project={project} isMobile={isMobile} fontSize={isMobile ? 'clamp(43px,11vw,62px)' : 'clamp(64px,8vw,120px)'} />
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
              ) : preorder ? (
                <PreorderForm project={project} isMobile={isMobile} />
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
