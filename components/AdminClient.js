'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { verifyAdmin } from '@/lib/db';

const AdminPanel = dynamic(() => import('./AdminPanel'), { ssr: false });

const HN = { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" };

export default function AdminClient({ projects, seo }) {
  const [authed, setAuthed] = useState(false);
  const [adminPw, setAdminPw] = useState('');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);
  const [checking, setChecking] = useState(false);
  const router = useRouter();

  const submit = async () => {
    if (checking) return;
    setChecking(true);
    const ok = await verifyAdmin(pwInput);
    setChecking(false);
    if (ok) {
      setAdminPw(pwInput);
      setAuthed(true);
    } else {
      setPwError(true);
    }
  };

  if (authed) {
    return (
      <AdminPanel
        projects={projects}
        seo={seo}
        adminPassword={adminPw}
        onBack={() => router.push('/')}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', ...HN, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,.1)', padding: '40px 48px', minWidth: 320, maxWidth: 380, width: '100%' }}>
        <div style={{ fontSize: 11, letterSpacing: '.1em', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', marginBottom: 28 }}>Enter password</div>
        <input autoFocus type="password" value={pwInput}
          onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${pwError ? 'rgba(255,80,80,.6)' : 'rgba(255,255,255,.2)'}`, color: '#fff', fontSize: 24, fontWeight: 700, padding: '8px 0', outline: 'none', ...HN, marginBottom: 8, boxSizing: 'border-box' }} />
        {pwError && <div style={{ fontSize: 11, color: 'rgba(255,80,80,.7)', letterSpacing: '.06em', marginTop: 8 }}>Incorrect password</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
          <button onClick={submit} disabled={checking} style={{ padding: '10px 24px', background: '#fff', color: '#000', border: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', cursor: checking ? 'default' : 'pointer', opacity: checking ? .6 : 1, ...HN }}>{checking ? 'Checking…' : 'Enter →'}</button>
          <button onClick={() => router.push('/')} style={{ padding: '10px 16px', background: 'transparent', color: 'rgba(255,255,255,.3)', border: '1px solid rgba(255,255,255,.1)', fontSize: 11, cursor: 'pointer', ...HN }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
