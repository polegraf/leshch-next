'use client';
// AdminPanel is a large component — ported from original App.js
// Full implementation in next iteration
// Includes: project CRUD, media upload, SEO settings, photography management

import { useState, useEffect } from 'react';
import { saveProjects, saveSettings, toSlug } from '@/lib/db';

const HN = { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" };
const R2_PUBLIC_URL = 'https://pub-1d609b9fa58348d39ec4c351d671a989.r2.dev';

async function uploadFile(file) {
  const ext = file.name.split('.').pop();
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: name, contentType: file.type }),
  });
  if (!res.ok) throw new Error('Failed to get upload URL');
  const { url, headers } = await res.json();
  const uploadRes = await fetch(url, { method: 'PUT', headers, body: file });
  if (!uploadRes.ok) throw new Error('Upload failed');
  return `${R2_PUBLIC_URL}/${name}`;
}

export default function AdminPanel({ projects: initialProjects, seo: initialSeo, onBack }) {
  const [projects, setProjects] = useState(initialProjects);
  const [seo, setSeo] = useState(initialSeo);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState('projects'); // 'projects' | 'seo'

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([saveProjects(projects), saveSettings(seo)]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', ...HN }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,10,.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,.08)', padding: '0 40px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', fontSize: 12, cursor: 'pointer', letterSpacing: '.06em', textTransform: 'uppercase', ...HN }}>← Back</button>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Admin</span>
        </div>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: '8px 20px', background: saved ? '#1a7a4a' : '#fff', color: saved ? '#fff' : '#000', border: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', ...HN, transition: 'background .3s' }}>
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>

      <div style={{ padding: '40px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 0, marginBottom: 40, borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          {['projects', 'seo'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '10px 24px', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? '#fff' : 'transparent'}`, color: tab === t ? '#fff' : 'rgba(255,255,255,.35)', fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', ...HN, marginBottom: -1 }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'projects' && (
          <ProjectsEditor projects={projects} setProjects={setProjects} />
        )}
        {tab === 'seo' && (
          <SeoEditor seo={seo} setSeo={setSeo} />
        )}
      </div>
    </div>
  );
}

function ProjectsEditor({ projects, setProjects }) {
  const [editId, setEditId] = useState(null);

  const addProject = () => {
    const id = Date.now();
    setProjects([...projects, { id, title: 'New Project', subtitle: '', category: [], year: new Date().getFullYear().toString(), location: '', coverType: 'image', cover: '', desc: '', blocks: [], featured: false, ready: false }]);
    setEditId(id);
  };

  const updateProject = (id, patch) => setProjects(projects.map((p) => p.id === id ? { ...p, ...patch } : p));
  const deleteProject = (id) => setProjects(projects.filter((p) => p.id !== id));
  const moveUp = (idx) => { if (idx === 0) return; const a = [...projects]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; setProjects(a); };
  const moveDown = (idx) => { if (idx === projects.length - 1) return; const a = [...projects]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; setProjects(a); };

  const inputStyle = { width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,.12)', color: '#fff', fontSize: 14, padding: '8px 12px', outline: 'none', ...HN, boxSizing: 'border-box' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>{projects.length} projects</span>
        <button onClick={addProject} style={{ padding: '8px 20px', background: '#fff', color: '#000', border: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', ...HN }}>+ Add Project</button>
      </div>

      {projects.map((p, idx) => (
        <div key={p.id} style={{ border: '1px solid rgba(255,255,255,.08)', marginBottom: 8, background: '#111' }}>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setEditId(editId === p.id ? null : p.id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', width: 20 }}>{idx + 1}</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{p.title}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', letterSpacing: '.04em', textTransform: 'uppercase' }}>{p.subtitle}</span>
              {p.ready && <span style={{ fontSize: 10, background: 'rgba(26,122,74,.3)', color: '#4ade80', padding: '2px 8px', letterSpacing: '.06em' }}>LIVE</span>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={(e) => { e.stopPropagation(); moveUp(idx); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.3)', cursor: 'pointer', fontSize: 14, ...HN }}>↑</button>
              <button onClick={(e) => { e.stopPropagation(); moveDown(idx); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.3)', cursor: 'pointer', fontSize: 14, ...HN }}>↓</button>
              <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) deleteProject(p.id); }} style={{ background: 'none', border: 'none', color: 'rgba(255,80,80,.5)', cursor: 'pointer', fontSize: 11, letterSpacing: '.04em', textTransform: 'uppercase', ...HN }}>Delete</button>
            </div>
          </div>

          {editId === p.id && (
            <div style={{ padding: '0 16px 20px', borderTop: '1px solid rgba(255,255,255,.06)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              {[['Title', 'title'], ['Subtitle', 'subtitle'], ['Year', 'year'], ['Location', 'location']].map(([label, key]) => (
                <div key={key}>
                  <label style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input value={p[key] || ''} onChange={(e) => updateProject(p.id, { [key]: e.target.value })} style={inputStyle} />
                </div>
              ))}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea value={p.desc || ''} onChange={(e) => updateProject(p.id, { desc: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: 16, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,.6)' }}>
                  <input type="checkbox" checked={p.ready || false} onChange={(e) => updateProject(p.id, { ready: e.target.checked })} />
                  Published (visible to visitors)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,.6)' }}>
                  <input type="checkbox" checked={p.featured || false} onChange={(e) => updateProject(p.id, { featured: e.target.checked })} />
                  Featured
                </label>
              </div>
              <div style={{ gridColumn: '1/-1', fontSize: 11, color: 'rgba(255,255,255,.25)', letterSpacing: '.04em' }}>
                URL: /project/{toSlug(p.title)}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SeoEditor({ seo, setSeo }) {
  const inputStyle = { width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,.12)', color: '#fff', fontSize: 14, padding: '8px 12px', outline: 'none', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", boxSizing: 'border-box' };
  const labelStyle = { fontSize: 10, color: 'rgba(255,255,255,.35)', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {[
        ['Site Name', 'siteName'], ['Tagline', 'tagline'],
        ['Meta Title', 'metaTitle'], ['Email', 'email'],
        ['Instagram URL', 'instagramUrl'], ['WhatsApp URL', 'whatsappUrl'],
        ['Behance', 'behance'], ['Admin Password', 'adminPassword'],
      ].map(([label, key]) => (
        <div key={key}>
          <label style={labelStyle}>{label}</label>
          <input value={seo?.[key] || ''} onChange={(e) => setSeo({ ...seo, [key]: e.target.value })} style={inputStyle} />
        </div>
      ))}
      <div style={{ gridColumn: '1/-1' }}>
        <label style={labelStyle}>Meta Description</label>
        <textarea value={seo?.metaDesc || ''} onChange={(e) => setSeo({ ...seo, metaDesc: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
    </div>
  );
}
