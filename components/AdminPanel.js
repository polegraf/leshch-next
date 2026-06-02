'use client';
import { useState, useRef, useEffect } from 'react';
import { saveProjects, saveSettings, toSlug } from '@/lib/db';

const HN = { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" };
const R2_PUBLIC_URL = 'https://pub-1d609b9fa58348d39ec4c351d671a989.r2.dev';

const CATEGORIES = ["all", "brand", "logo", "packaging", "ui", "photo", "motion", "print", "illustration"];
const BLOCK_TYPES = ["text", "quote", "image", "video"];
const LAYOUTS = ["wide", "two-square", "three-square", "three-vertical", "four-vertical"];
const LAYOUT_LABELS = { "wide": "1 wide (16:9)", "two-square": "2 square (1:1)", "three-square": "3 square (1:1)", "three-vertical": "3 vertical (9:16)", "four-vertical": "4 vertical (9:16)" };

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

function CoverMedia({ project, style }) {
  if (!project.cover) return <div style={style} />;
  if (project.coverType === 'video') return (
    <div style={{ ...style, overflow: 'hidden' }}>
      <video src={project.cover} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
  return (
    <div style={{ ...style, overflow: 'hidden' }}>
      <img src={project.cover} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}

function ThumbMedia({ project }) {
  const src = project.thumbnail || project.cover;
  const type = project.thumbnail ? (project.thumbType || 'image') : project.coverType;
  if (!src) return <div style={{ width: '100%', height: '100%', background: '#111' }} />;
  if (type === 'video') return <video src={src} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  return <img src={src} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
}

function BlockEditor({ block, onChange, onDelete, onUp, onDown }) {
  const refs = [useRef(), useRef(), useRef(), useRef()];
  const inputStyle = { width: '100%', background: '#111', border: '1px solid rgba(255,255,255,.12)', color: '#fff', padding: '8px 12px', fontSize: 13, ...HN, outline: 'none', borderRadius: 2, boxSizing: 'border-box' };
  const labelStyle = { fontSize: 10, letterSpacing: '.08em', color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', display: 'block', marginBottom: 6 };

  const handleFile = (key) => async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const url = await uploadFile(f);
      onChange({ ...block, [key]: url });
    } catch { alert('Upload failed, try again'); }
  };

  const slotCount = block.layout === 'wide' ? 1 : block.layout === 'two-square' ? 2 : block.layout === 'four-vertical' ? 4 : 3;
  const slotKeys = ['src', 'src2', 'src3', 'src4'];
  const slotLabels = {
    'wide': ['File (16:9)'],
    'two-square': ['Left (1:1)', 'Right (1:1)'],
    'three-square': ['Left (1:1)', 'Center (1:1)', 'Right (1:1)'],
    'three-vertical': ['Left (9:16)', 'Center (9:16)', 'Right (9:16)'],
    'four-vertical': ['1 (9:16)', '2 (9:16)', '3 (9:16)', '4 (9:16)'],
  };

  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,.08)', borderRadius: 4, padding: 16, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', ...HN }}>{block.type}{block.layout ? ` / ${block.layout}` : ''}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['↑', onUp], ['↓', onDown], ['✕', onDelete]].map(([l, fn]) => (
            <button key={l} onClick={fn} style={{ background: 'none', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.4)', fontSize: 11, width: 24, height: 24, cursor: 'pointer', ...HN, borderRadius: 2 }}>{l}</button>
          ))}
        </div>
      </div>

      {(block.type === 'text' || block.type === 'quote') && (
        <textarea value={block.content || ''} onChange={e => onChange({ ...block, content: e.target.value })} rows={block.type === 'quote' ? 3 : 4} style={{ ...inputStyle, resize: 'vertical' }} />
      )}

      {(block.type === 'image' || block.type === 'video') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Layout</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {LAYOUTS.map(l => (
                <button key={l} onClick={() => onChange({ ...block, layout: l })}
                  style={{ padding: '5px 12px', background: block.layout === l ? '#fff' : 'transparent', color: block.layout === l ? '#000' : 'rgba(255,255,255,.4)', border: '1px solid rgba(255,255,255,.15)', fontSize: 10, cursor: 'pointer', ...HN, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', borderRadius: 2 }}>
                  {LAYOUT_LABELS[l]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: slotCount === 1 ? '1fr' : slotCount === 2 ? '1fr 1fr' : slotCount === 4 ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr', gap: 8 }}>
            {Array.from({ length: slotCount }).map((_, i) => {
              const key = slotKeys[i];
              return (
                <div key={i}>
                  <label style={labelStyle}>{(slotLabels[block.layout] || [])[i] || `File ${i + 1}`}</label>
                  <input ref={refs[i]} type="file" accept={block.type === 'video' ? 'video/*' : 'image/*'} style={{ display: 'none' }} onChange={handleFile(key)} />
                  <button onClick={() => refs[i].current?.click()} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,.15)', color: block[key] ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.3)', fontSize: 11, cursor: 'pointer', ...HN, borderRadius: 2 }}>
                    {block[key] ? '✓ Loaded' : 'Upload'}
                  </button>
                  {block[key] && <button onClick={() => onChange({ ...block, [key]: '' })} style={{ background: 'none', border: 'none', color: 'rgba(255,80,80,.6)', fontSize: 10, cursor: 'pointer', ...HN, padding: '4px 0', display: 'block' }}>Remove</button>}
                </div>
              );
            })}
          </div>
          <div>
            <label style={labelStyle}>Caption (optional)</label>
            <input value={block.caption || ''} onChange={e => onChange({ ...block, caption: e.target.value })} style={inputStyle} />
          </div>
          {block.type === 'video' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={block.autoplay || false} onChange={e => onChange({ ...block, autoplay: e.target.checked })} />
              <span style={{ fontSize: 10, color: block.autoplay ? '#fff' : 'rgba(255,255,255,.4)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Autoplay (muted loop)</span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}

function PhotoAdminEditor({ photos, onChange, inputStyle, labelStyle }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ url: '', date: '', location: '', caption: '' });
  const fileRef = useRef();

  const addPhoto = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const url = await uploadFile(f);
      setDraft(d => ({ ...d, url }));
    } catch { alert('Upload failed'); }
  };

  const save = () => {
    if (!draft.url) return;
    onChange([...photos, { ...draft, id: Date.now() }]);
    setDraft({ url: '', date: '', location: '', caption: '' });
    setAdding(false);
  };

  const remove = (id) => onChange(photos.filter(p => p.id !== id));
  const moveUp = (i) => { if (i === 0) return; const a = [...photos]; [a[i-1], a[i]] = [a[i], a[i-1]]; onChange(a); };
  const moveDown = (i) => { if (i === photos.length - 1) return; const a = [...photos]; [a[i], a[i+1]] = [a[i+1], a[i]]; onChange(a); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {photos.map((p, i) => (
        <div key={p.id} style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,.08)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 64, height: 40, overflow: 'hidden', flexShrink: 0, background: '#111' }}>
            {p.url && <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.location || p.caption || '—'}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>{p.date}</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => moveUp(i)} style={{ background: 'none', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.4)', fontSize: 11, width: 24, height: 24, cursor: 'pointer', ...HN }}>↑</button>
            <button onClick={() => moveDown(i)} style={{ background: 'none', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.4)', fontSize: 11, width: 24, height: 24, cursor: 'pointer', ...HN }}>↓</button>
            <button onClick={() => remove(p.id)} style={{ background: 'none', border: '1px solid rgba(255,50,50,.2)', color: 'rgba(255,80,80,.5)', fontSize: 11, width: 24, height: 24, cursor: 'pointer', ...HN }}>✕</button>
          </div>
        </div>
      ))}
      {adding ? (
        <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,.12)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={addPhoto} />
          <button onClick={() => fileRef.current?.click()} style={{ padding: '8px', background: 'transparent', border: '1px dashed rgba(255,255,255,.2)', color: draft.url ? '#4caf86' : 'rgba(255,255,255,.4)', fontSize: 11, cursor: 'pointer', ...HN }}>
            {draft.url ? '✓ Photo uploaded' : 'Upload photo'}
          </button>
          {[['date', 'Date (e.g. May 2024)'], ['location', 'Location'], ['caption', 'Caption (optional)']].map(([k, l]) => (
            <div key={k}>
              <label style={labelStyle}>{l}</label>
              <input value={draft[k]} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))} style={inputStyle} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} style={{ padding: '8px 20px', background: '#fff', color: '#000', border: 'none', fontSize: 10, fontWeight: 700, cursor: 'pointer', ...HN }}>Add</button>
            <button onClick={() => setAdding(false)} style={{ padding: '8px 14px', background: 'transparent', color: 'rgba(255,255,255,.4)', border: '1px solid rgba(255,255,255,.1)', fontSize: 10, cursor: 'pointer', ...HN }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ padding: '9px 0', background: 'transparent', border: '1px dashed rgba(255,255,255,.15)', color: 'rgba(255,255,255,.4)', fontSize: 10, cursor: 'pointer', ...HN, letterSpacing: '.06em', textTransform: 'uppercase' }}>+ Add photo</button>
      )}
    </div>
  );
}

export default function AdminPanel({ projects: initialProjects, seo: initialSeo, onBack, adminPassword }) {
  const [projects, setProjects] = useState(initialProjects);
  const [seo, setSeo] = useState(initialSeo);
  const [tab, setTab] = useState('projects');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(null);
  const [seoForm, setSeoForm] = useState({ ...initialSeo });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const coverRef = useRef();
  const thumbRef = useRef();

  const inputStyle = { width: '100%', background: '#111', border: '1px solid rgba(255,255,255,.12)', color: '#fff', padding: '9px 12px', fontSize: 13, ...HN, outline: 'none', borderRadius: 2, boxSizing: 'border-box' };
  const labelStyle = { fontSize: 10, letterSpacing: '.08em', color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', display: 'block', marginBottom: 6 };

  const startEdit = p => { setForm({ ...p, categoryStr: (p.category || []).join(', ') }); setEditId(p.id); };
  const startNew = () => {
    const id = Date.now();
    setForm({ id, title: '', subtitle: '', categoryStr: '', year: String(new Date().getFullYear()), location: '', coverType: 'image', cover: '', desc: '', blocks: [], featured: false, ready: false });
    setEditId(id);
  };

  const saveProject = async () => {
    const updated = { ...form, category: form.categoryStr.split(',').map(s => s.trim()).filter(Boolean) };
    const newProjects = projects.find(p => p.id === form.id)
      ? projects.map(p => p.id === form.id ? updated : p)
      : [...projects, updated];
    setProjects(newProjects);
    setSaving(true);
    try {
      await saveProjects(newProjects, adminPassword);
      setEditId(null); setForm(null);
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
    setSaving(false);
  };

  const del = async id => {
    if (!window.confirm('Delete this project?')) return;
    const newProjects = projects.filter(p => p.id !== id);
    setProjects(newProjects);
    try {
      await saveProjects(newProjects, adminPassword);
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  const addBlock = type => setForm({ ...form, blocks: [...(form.blocks || []), { id: String(Date.now()), type, layout: 'wide', content: '', src: '', src2: '', src3: '', src4: '', caption: '' }] });
  const updateBlock = (id, updated) => setForm({ ...form, blocks: form.blocks.map(b => b.id === id ? updated : b) });
  const deleteBlock = id => setForm({ ...form, blocks: form.blocks.filter(b => b.id !== id) });
  const moveBlock = (id, dir) => {
    const arr = [...form.blocks]; const i = arr.findIndex(b => b.id === id);
    const ni = i + dir; if (ni < 0 || ni >= arr.length) return;
    [arr[i], arr[ni]] = [arr[ni], arr[i]]; setForm({ ...form, blocks: arr });
  };

  const handleCover = async e => {
    const f = e.target.files[0]; if (!f) return;
    setSaving(true);
    try { const url = await uploadFile(f); setForm(prev => ({ ...prev, cover: url })); }
    catch { alert('Upload failed, try again'); }
    setSaving(false);
  };

  const handleThumb = async e => {
    const f = e.target.files[0]; if (!f) return;
    setSaving(true);
    try { const url = await uploadFile(f); setForm(prev => ({ ...prev, thumbnail: url })); }
    catch { alert('Upload failed, try again'); }
    setSaving(false);
  };

  const moveProject = async (id, dir) => {
    const arr = [...projects];
    const i = arr.findIndex(p => p.id === id);
    const ni = i + dir;
    if (ni < 0 || ni >= arr.length) return;
    if (!window.confirm('Save new order?')) return;
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    setProjects(arr);
    try {
      await saveProjects(arr, adminPassword);
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
  };

  const saveSeo = async () => {
    setSaving(true);
    try {
      await saveSettings(seoForm, adminPassword);
      setSeo(seoForm);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
    setSaving(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', ...HN }}>
      {/* Top bar */}
      <div style={{ background: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,.08)', padding: '0 32px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)' }}>Admin</span>
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,.1)' }} />
          {[['projects', 'Projects'], ['seo', 'SEO'], ['contacts', 'Contacts']].map(([k, l]) => (
            <button key={k} onClick={() => { setTab(k); setEditId(null); setForm(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: tab === k ? '#fff' : 'rgba(255,255,255,.3)', ...HN, padding: '4px 0', borderBottom: tab === k ? '1px solid #fff' : '1px solid transparent' }}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {saving && <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', letterSpacing: '.06em' }}>Saving...</span>}
          <button onClick={onBack} style={{ background: 'none', border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.5)', fontSize: 10, padding: '5px 14px', cursor: 'pointer', ...HN, letterSpacing: '.06em', textTransform: 'uppercase', borderRadius: 2 }}>← Site</button>
        </div>
      </div>

      <div style={{ padding: '32px 40px' }}>

        {/* ── PROJECTS LIST ── */}
        {tab === 'projects' && !editId && (
          <div style={{ maxWidth: 780 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
              <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.03em' }}>Projects <span style={{ fontSize: 13, color: 'rgba(255,255,255,.25)', fontWeight: 400 }}>({projects.length})</span></h2>
              <button onClick={startNew} style={{ padding: '9px 20px', background: '#fff', color: '#000', border: 'none', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', ...HN }}>+ New</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {projects.map(p => (
                <div key={p.id} style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,.06)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 56, height: 38, overflow: 'hidden', flexShrink: 0, background: '#111' }}>
                    <ThumbMedia project={p} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}>{p.title || <span style={{ color: 'rgba(255,255,255,.2)' }}>Untitled</span>}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 2, letterSpacing: '.04em', textTransform: 'uppercase' }}>{p.subtitle} · {p.year} · {p.blocks?.length || 0} blocks</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', marginTop: 2 }}>/project/{toSlug(p.title)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {p.featured && <span style={{ fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', border: '1px solid rgba(255,255,255,.1)', padding: '3px 7px' }}>Featured</span>}
                    {p.ready && <span style={{ fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase', color: '#4caf86', border: '1px solid #4caf86', padding: '3px 7px' }}>Live</span>}
                    <button onClick={() => moveProject(p.id, -1)} style={{ padding: '6px 10px', border: '1px solid rgba(255,255,255,.1)', background: 'transparent', color: 'rgba(255,255,255,.4)', fontSize: 12, cursor: 'pointer', ...HN }}>↑</button>
                    <button onClick={() => moveProject(p.id, 1)} style={{ padding: '6px 10px', border: '1px solid rgba(255,255,255,.1)', background: 'transparent', color: 'rgba(255,255,255,.4)', fontSize: 12, cursor: 'pointer', ...HN }}>↓</button>
                    <button onClick={() => startEdit(p)} style={{ padding: '6px 14px', border: '1px solid rgba(255,255,255,.15)', background: 'transparent', color: 'rgba(255,255,255,.6)', fontSize: 10, cursor: 'pointer', ...HN }}>Edit</button>
                    <button onClick={() => del(p.id)} style={{ padding: '6px 12px', border: '1px solid rgba(255,50,50,.2)', background: 'transparent', color: 'rgba(255,80,80,.5)', fontSize: 10, cursor: 'pointer', ...HN }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PROJECT EDIT ── */}
        {tab === 'projects' && editId && form && (
          <div style={{ maxWidth: 720 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
              <button onClick={() => { setEditId(null); setForm(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.4)', fontSize: 10, padding: 0, ...HN, letterSpacing: '.07em', textTransform: 'uppercase' }}>← Back</button>
              <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em' }}>{projects.find(p => p.id === form.id) ? 'Edit project' : 'New project'}</h2>
            </div>

            {/* Thumbnail */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Thumbnail — index grid</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {['image', 'video'].map(t => (
                  <button key={t} onClick={() => setForm({ ...form, thumbType: t })}
                    style={{ padding: '5px 14px', background: (form.thumbType || 'image') === t ? '#fff' : 'transparent', color: (form.thumbType || 'image') === t ? '#000' : 'rgba(255,255,255,.4)', border: '1px solid rgba(255,255,255,.15)', fontSize: 10, cursor: 'pointer', ...HN, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', borderRadius: 2 }}>{t}</button>
                ))}
              </div>
              <input ref={thumbRef} type="file" accept={(form.thumbType || 'image') === 'video' ? 'video/*' : 'image/*'} style={{ display: 'none' }} onChange={handleThumb} />
              <div style={{ width: '100%', height: 160, background: '#0a0a0a', border: '1px dashed rgba(255,255,255,.1)', cursor: 'pointer', overflow: 'hidden' }} onClick={() => thumbRef.current?.click()}>
                {form.thumbnail
                  ? <CoverMedia project={{ ...form, cover: form.thumbnail, coverType: form.thumbType || 'image' }} style={{ width: '100%', height: '100%' }} />
                  : <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <div style={{ fontSize: 22, color: 'rgba(255,255,255,.15)' }}>+</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', letterSpacing: '.07em', textTransform: 'uppercase' }}>Upload thumbnail</div>
                    </div>}
              </div>
              {form.thumbnail && <button onClick={() => setForm({ ...form, thumbnail: '' })} style={{ background: 'none', border: 'none', color: 'rgba(255,80,80,.5)', fontSize: 10, cursor: 'pointer', ...HN, marginTop: 6 }}>Remove</button>}
            </div>

            {/* Cover */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Cover — project page</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {['image', 'video'].map(t => (
                  <button key={t} onClick={() => setForm({ ...form, coverType: t })}
                    style={{ padding: '5px 14px', background: form.coverType === t ? '#fff' : 'transparent', color: form.coverType === t ? '#000' : 'rgba(255,255,255,.4)', border: '1px solid rgba(255,255,255,.15)', fontSize: 10, cursor: 'pointer', ...HN, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', borderRadius: 2 }}>{t}</button>
                ))}
              </div>
              <input ref={coverRef} type="file" accept={form.coverType === 'video' ? 'video/*' : 'image/*'} style={{ display: 'none' }} onChange={handleCover} />
              <div style={{ width: '100%', height: 200, background: '#0a0a0a', border: '1px dashed rgba(255,255,255,.1)', cursor: 'pointer', overflow: 'hidden' }} onClick={() => coverRef.current?.click()}>
                {form.cover
                  ? <CoverMedia project={form} style={{ width: '100%', height: '100%' }} />
                  : <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <div style={{ fontSize: 22, color: 'rgba(255,255,255,.15)' }}>+</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', letterSpacing: '.07em', textTransform: 'uppercase' }}>Upload cover</div>
                    </div>}
              </div>
              {form.cover && <button onClick={() => setForm({ ...form, cover: '' })} style={{ background: 'none', border: 'none', color: 'rgba(255,80,80,.5)', fontSize: 10, cursor: 'pointer', ...HN, marginTop: 6 }}>Remove</button>}
            </div>

            {/* Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {[{ k: 'title', l: 'Title' }, { k: 'subtitle', l: 'Subtitle' }, { k: 'year', l: 'Year' }, { k: 'location', l: 'Location' }].map(({ k, l }) => (
                <div key={k}><label style={labelStyle}>{l}</label><input value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} style={inputStyle} /></div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Categories (comma-separated)</label>
              <input value={form.categoryStr || ''} onChange={e => setForm({ ...form, categoryStr: e.target.value })} placeholder="brand, logo, print..." style={inputStyle} />
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', marginTop: 4 }}>Options: {CATEGORIES.slice(1).join(', ')}</div>
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Description</label>
              <textarea value={form.desc || ''} onChange={e => setForm({ ...form, desc: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            {/* Content blocks */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ ...labelStyle, marginBottom: 12 }}>Content blocks ({form.blocks?.length || 0})</label>
              {(form.blocks || []).map(b => (
                <BlockEditor key={b.id} block={b}
                  onChange={updated => updateBlock(b.id, updated)}
                  onDelete={() => deleteBlock(b.id)}
                  onUp={() => moveBlock(b.id, -1)}
                  onDown={() => moveBlock(b.id, 1)} />
              ))}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                {BLOCK_TYPES.map(t => (
                  <button key={t} onClick={() => addBlock(t)} style={{ padding: '7px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.5)', fontSize: 10, cursor: 'pointer', ...HN, letterSpacing: '.06em', textTransform: 'uppercase', borderRadius: 2 }}>+ {t}</button>
                ))}
              </div>
            </div>

            {/* Flags */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 28 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.featured || false} onChange={e => setForm({ ...form, featured: e.target.checked })} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.04em' }}>Featured</span>
              </label> 
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
  <input type="checkbox" checked={form.ageGate || false} onChange={e => setForm({ ...form, ageGate: e.target.checked })} />
  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.04em' }}>Age verification (21+)</span>
</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.ready || false} onChange={e => setForm({ ...form, ready: e.target.checked })} />
                <span style={{ fontSize: 11, color: form.ready ? '#fff' : 'rgba(255,255,255,.45)', letterSpacing: '.04em', fontWeight: form.ready ? 700 : 400 }}>Ready ✓</span>
              </label>
            </div>

            {/* Link to project */}
            {!form.ready && (
              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>Link to ready project (optional)</label>
                <select value={form.linkTo || ''} onChange={e => setForm({ ...form, linkTo: e.target.value || null })}
                  style={{ width: '100%', background: '#111', border: '1px solid rgba(255,255,255,.12)', color: '#fff', padding: '9px 12px', fontSize: 13, ...HN, outline: 'none', borderRadius: 2 }}>
                  <option value="">— none —</option>
                  {projects.filter(p => p.ready && p.id !== form.id).map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveProject} style={{ padding: '11px 28px', background: '#fff', color: '#000', border: 'none', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', ...HN }}>
                {saving ? 'Saving...' : 'Save project'}
              </button>
              <button onClick={() => { setEditId(null); setForm(null); }} style={{ padding: '11px 20px', background: 'transparent', color: 'rgba(255,255,255,.4)', border: '1px solid rgba(255,255,255,.1)', fontSize: 10, cursor: 'pointer', ...HN, borderRadius: 2 }}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── SEO ── */}
        {tab === 'seo' && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.03em' }}>SEO & Meta</h2>
              {saved && <span style={{ fontSize: 10, color: '#4caf86', letterSpacing: '.07em', textTransform: 'uppercase' }}>✓ Saved</span>}
            </div>
            <div style={{ background: '#fff', borderRadius: 4, padding: 18, marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: '#999', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 10 }}>Google preview</div>
              <div style={{ fontSize: 17, color: '#1a0dab', marginBottom: 3, fontFamily: 'Arial, sans-serif' }}>{seoForm.metaTitle || 'Your title'}</div>
              <div style={{ fontSize: 12, color: '#006621', marginBottom: 3, fontFamily: 'Arial, sans-serif' }}>leshch.com</div>
              <div style={{ fontSize: 13, color: '#545454', lineHeight: 1.5, fontFamily: 'Arial, sans-serif' }}>{seoForm.metaDesc || 'Your description'}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { k: 'siteName', l: 'Site name' }, { k: 'tagline', l: 'Tagline' },
                { k: 'metaTitle', l: 'Meta title', max: 60 }, { k: 'email', l: 'Email' },
                { k: 'instagramUrl', l: 'Instagram URL' }, { k: 'whatsappUrl', l: 'WhatsApp URL (wa.me/...)' },
                { k: 'behance', l: 'Behance' }, { k: 'ogImage', l: 'OG image URL' },
                { k: 'adminPassword', l: 'Admin password' },
              ].map(({ k, l, max }) => (
                <div key={k}>
                  <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{l}</span>
                    {max && <span style={{ color: (seoForm[k]?.length || 0) > max ? 'rgba(255,80,80,.8)' : 'rgba(255,255,255,.25)', textTransform: 'none', letterSpacing: 0 }}>{seoForm[k]?.length || 0}/{max}</span>}
                  </label>
                  <input value={seoForm[k] || ''} onChange={e => setSeoForm({ ...seoForm, [k]: e.target.value })} style={inputStyle} />
                </div>
              ))}
              <div>
                <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Meta description</span>
                  <span style={{ color: (seoForm.metaDesc?.length || 0) > 160 ? 'rgba(255,80,80,.8)' : 'rgba(255,255,255,.25)', textTransform: 'none', letterSpacing: 0 }}>{seoForm.metaDesc?.length || 0}/160</span>
                </label>
                <textarea value={seoForm.metaDesc || ''} onChange={e => setSeoForm({ ...seoForm, metaDesc: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              {/* Photography */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 24, marginTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-.01em', marginBottom: 16, color: '#fff' }}>Photography</div>
                <PhotoAdminEditor photos={seoForm.photos || []} onChange={photos => setSeoForm({ ...seoForm, photos })} inputStyle={inputStyle} labelStyle={labelStyle} />
              </div>

              <button onClick={saveSeo} style={{ alignSelf: 'flex-start', padding: '11px 28px', background: '#fff', color: '#000', border: 'none', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', ...HN }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* ── CONTACTS ── */}
        {tab === 'contacts' && (
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.03em', marginBottom: 8 }}>Inbox</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginBottom: 28, lineHeight: 1.7 }}>Form submissions appear here. Connect to a backend or email service in production.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { name: 'Anna Morozova', email: 'anna@studio.ru', msg: "I'd like to discuss a brand identity for a new restaurant.", time: '2h ago' },
                { name: 'Ivan Petrov', email: 'ivan@tech.co', msg: 'Looking for a mobile app redesign — available for Q3?', time: 'yesterday' },
                { name: 'Maria Garcia', email: 'm.garcia@brand.es', msg: 'Interested in packaging design collaboration.', time: '3 days ago' },
              ].map((c, i) => (
                <div key={i} style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,.06)', padding: '16px 18px', display: 'flex', gap: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.3)', flexShrink: 0 }}>{c.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{c.name}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,.25)' }}>{c.time}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginBottom: 6 }}>{c.email}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.5 }}>{c.msg}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
