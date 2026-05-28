'use client';
import { useState, useEffect } from 'react';

const HN = { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" };

export default function AgeGate({ children }) {
  const [verified, setVerified] = useState(null);

  useEffect(() => {
    const age = sessionStorage.getItem('age-verified');
    setVerified(age === 'true');
  }, []);

  const confirm = () => { sessionStorage.setItem('age-verified', 'true'); setVerified(true); };
  const deny = () => { setVerified(false); };

  if (verified === null) return null;

  if (verified === false) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', ...HN }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 14, letterSpacing: '.04em' }}>You must be 21 or older to view this content.</p>
      </div>
    </div>
  );

  if (verified === true) return children;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.96)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,.12)', padding: '48px 56px', maxWidth: 420, width: '90%', textAlign: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: '.12em', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', marginBottom: 32 }}>Age Verification</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.03em', color: '#fff', marginBottom: 12, lineHeight: 1.2 }}>Are you 21 or older?</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 1.7, marginBottom: 36 }}>This project contains content related to cannabis. You must be of legal age to view it.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={confirm} style={{ padding: '12px 32px', background: '#fff', border: 'none', color: '#000', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', ...HN }}>Yes, I am 21+</button>
          <button onClick={deny} style={{ padding: '12px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.4)', fontSize: 11, cursor: 'pointer', ...HN }}>No</button>
        </div>
      </div>
    </div>
  );
}
