'use client';
import { useState, useEffect } from 'react';
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

export default function ContactClient({ seo }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const isMobile = useIsMobile();

  const handleSend = () => {
    if (form.name && form.email && form.message) {
      setSent(true);
      setTimeout(() => { setSent(false); setForm({ name: '', email: '', message: '' }); }, 3000);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', ...HN }}>
      <Nav seo={seo} onAdminClick={() => {}} isMobile={isMobile} />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '64px 20px 100px' : '112px 40px 160px' }}>
        <h1 style={{ fontSize: isMobile ? 'clamp(48px,11vw,72px)' : 'clamp(64px,8vw,112px)', fontWeight: 700, letterSpacing: '-.04em', lineHeight: .92, color: '#fff', marginBottom: isMobile ? 56 : 80 }}>Let's work<br />together.</h1>
        {sent ? (
          <div style={{ padding: '40px 0' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Message sent.</div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,.5)' }}>I'll get back to you within 24 hours.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[{ k: 'name', l: 'Name' }, { k: 'email', l: 'Email' }].map((f) => (
              <div key={f.k} style={{ borderTop: '1px solid rgba(255,255,255,.12)', padding: '22px 0' }}>
                <label style={{ display: 'block', fontSize: 11, letterSpacing: '.08em', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', marginBottom: 10 }}>{f.l}</label>
                <input value={form[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                  style={{ width: '100%', background: 'transparent', border: 'none', fontSize: isMobile ? 20 : 26, fontWeight: 700, color: '#fff', ...HN, outline: 'none', letterSpacing: '-.02em' }} />
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,.12)', borderBottom: '1px solid rgba(255,255,255,.12)', padding: '22px 0' }}>
              <label style={{ display: 'block', fontSize: 11, letterSpacing: '.08em', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', marginBottom: 10 }}>Message</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5}
                style={{ width: '100%', background: 'transparent', border: 'none', fontSize: isMobile ? 20 : 26, fontWeight: 700, color: '#fff', ...HN, outline: 'none', resize: 'none', letterSpacing: '-.02em' }} />
            </div>
            <button onClick={handleSend} style={{ marginTop: 32, alignSelf: 'flex-start', padding: '15px 36px', background: '#fff', color: '#000', border: 'none', fontSize: 13, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', cursor: 'pointer', ...HN }}>Send →</button>
          </div>
        )}
        <div style={{ marginTop: 80, display: 'flex', gap: isMobile ? 36 : 56, flexWrap: 'wrap' }}>
          {[['Email', seo?.email], ['Behance', seo?.behance]].map(([k, v]) => v ? (
            <div key={k}>
              <div style={{ fontSize: 11, letterSpacing: '.08em', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', marginBottom: 8 }}>{k}</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,.75)', fontWeight: 500 }}>{v}</div>
            </div>
          ) : null)}
        </div>
      </div>
      <Footer seo={seo} isMobile={isMobile} />
    </div>
  );
}
