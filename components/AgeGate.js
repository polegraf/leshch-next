'use client';
import { useState, useEffect } from 'react';

const HN = { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" };

const WarningIcon = () => (
  <svg width="200" height="180" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M100 12L186 164H14L100 12Z" stroke="white" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" fill="none" style={{borderRadius: 20}}/>
    <rect x="93" y="72" width="14" height="52" rx="7" fill="white"/>
    <rect x="93" y="132" width="14" height="14" rx="7" fill="white"/>
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
      <div style={{ textAlign: 'center', padding: '0 40px', maxWidth: 480 }}>
        <div style={{ marginBottom: 48 }}><WarningIcon /></div>
        <p style={{ color: '#fff', fontSize: 'clamp(36px,8vw,64px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-.02em', textTransform: 'uppercase', margin: 0 }}>You must be 21 or older.</p>
      </div>
    </div>
  );

  if (status === 'verified') return children;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 420, width: '90%', textAlign: 'center', ...HN, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Icon */}
        <div style={{ marginBottom: 40 }}><WarningIcon /></div>

        {/* Heading */}
        <p style={{ fontSize: 'clamp(40px,9vw,72px)', fontWeight: 900, lineHeight: 1.0, color: '#fff', margin: 0, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '-.02em' }}>
          Are you 21<br />or older?
        </p>

        {/* Subtext */}
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.55)', lineHeight: 1.6, margin: 0, marginBottom: 48, fontWeight: 400 }}>
          this project contains<br />cannabis-related content
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
          <button onClick={confirm} style={{
            width: '100%', padding: '20px 32px',
            background: 'transparent',
            border: '6px solid #fff',
            color: '#fff',
            fontSize: 13, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
            cursor: 'pointer', borderRadius: 999, outline: 'none',
            ...HN
          }}>Yes, I am 21+</button>

          <button onClick={deny} style={{
            width: '100%', padding: '20px 32px',
            background: 'transparent',
            border: '6px solid #fff',
            color: '#fff',
            fontSize: 13, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
            cursor: 'pointer', borderRadius: 999, outline: 'none',
            ...HN
          }}>No</button>
        </div>

      </div>
    </div>
  );
}
