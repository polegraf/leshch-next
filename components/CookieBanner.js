'use client';
import { useState, useEffect } from 'react';

const HN = { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" };

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => { localStorage.setItem('cookie-consent', 'accepted'); setVisible(false); };
  const decline = () => { localStorage.setItem('cookie-consent', 'declined'); setVisible(false); };

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, left: 24, right: 24, zIndex: 9999, display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,.12)', padding: '20px 28px', maxWidth: 600, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <p style={{ ...HN, fontSize: 12, color: 'rgba(255,255,255,.6)', lineHeight: 1.6, margin: 0, flex: 1 }}>
          This site uses cookies to improve your experience. By continuing, you agree to our use of cookies.
        </p>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={decline} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.4)', fontSize: 11, cursor: 'pointer', ...HN, letterSpacing: '.06em', textTransform: 'uppercase' }}>Decline</button>
          <button onClick={accept} style={{ padding: '8px 16px', background: '#fff', border: 'none', color: '#000', fontSize: 11, fontWeight: 700, cursor: 'pointer', ...HN, letterSpacing: '.06em', textTransform: 'uppercase' }}>Accept</button>
        </div>
      </div>
    </div>
  );
}
