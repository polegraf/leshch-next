'use client';
import { useState, useEffect } from 'react';

const HN = { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" };

const WarningIcon = () => (
  <svg width="128" height="128" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 6L58 54H6L32 6Z" stroke="white" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" fill="none" rx="4"/>
    <rect x="29.5" y="24" width="5" height="16" rx="2.5" fill="white"/>
    <rect x="29.5" y="44" width="5" height="5" rx="2.5" fill="white"/>
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
        <div style={{ marginBottom: '3.5rem' }}><WarningIcon /></div>
        <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 30, fontWeight: 300, lineHeight: 1.75, margin: 0 }}>You must be 21 or older to view this content.</p>
      </div>
    </div>
  );

  if (status === 'verified') return children;

  const gap = 30 * 1.75 * 2;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.96)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 480, width: '90%', textAlign: 'center', ...HN }}>
        <div style={{ marginBottom: gap }}><WarningIcon /></div>
        <p style={{ fontSize: 30, fontWeight: 300, lineHeight: 1.75, color: 'rgba(255,255,255,.85)', margin: 0, marginBottom: gap * 0.5 }}>Are you 21 or older?</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 1.7, margin: 0, marginBottom: gap }}>This project contains cannabis-related content.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={confirm} style={{ padding: '12px 32px', background: 'transparent', border: '4px solid #fff', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 8, outline: 'none', ...HN }}>Yes, I am 21+</button>
          <button onClick={deny} style={{ padding: '12px 20px', background: 'transparent', border: '4px solid rgba(255,255,255,.3)', color: 'rgba(255,255,255,.4)', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 8, outline: 'none', ...HN }}>No</button>
        </div>
      </div>
    </div>
  );
}
