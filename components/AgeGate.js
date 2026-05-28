'use client';
import { useState, useEffect } from 'react';

const HN = { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" };

const WarningIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 6L58 54H6L32 6Z" stroke="white" strokeWidth="4" strokeLinejoin="round" fill="none"/>
    <rect x="29.5" y="24" width="5" height="16" rx="2" fill="white"/>
    <rect x="29.5" y="44" width="5" height="5" rx="2" fill="white"/>
  </svg>
);

export default function AgeGate({ children }) {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const age = sessionStorage.getItem('age-verified');
    if (age === 'true') setStatus('verified');
    else setStatus('pending');
  }, []);

  const confirm = () => { sessionStorage.setItem('age-verified', 'true'); setStatus('verified'); };
  const deny = () => setStatus('denied');

  if (status === 'loading') return <div style={{ minHeight: '100vh', background: '#000' }} />;

  if (status === 'denied') return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', ...HN }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 24 }}><WarningIcon /></div>
        <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 30, fontWeight: 300, lineHeight: 1.75, margin: 0 }}>You must be 21 or older to view this content.</p>
      </div>
    </div>
  );

  if (status === 'verified') return children;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.96)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,.12)', padding: '48px 56px', maxWidth: 480, width: '90%', textAlign: 'center', ...HN }}>
        <div style={{ marginBottom: 28 }}><WarningIcon /></div>
        <div style={{ fontSize: 11, letterSpacing: '.12em', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', marginBottom: 24 }}>Age Verification</div>
        <p style={{ fontSize: 30, fontWeight: 300, lineHeight: 1.75, color: 'rgba(255,255,255,.85)', marginBottom: 36 }}>Are you 21 or older?<br /><span style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', fontWeight: 400 }}>This project contains cannabis-related content.</span></p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={confirm} style={{ padding: '12px 32px', background: '#fff', border: 'none', color: '#000', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', ...HN }}>Yes, I am 21+</button>
          <button onClick={deny} style={{ padding: '12px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.4)', fontSize: 11, cursor: 'pointer', ...HN }}>No</button>
        </div>
      </div>
    </div>
  );
}
