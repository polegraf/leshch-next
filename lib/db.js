const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const readHeaders = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
};

// ---- ЧТЕНИЕ (публичное, через anon-ключ; RLS разрешает только SELECT) -------

export async function getProjects() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*`, {
    headers: readHeaders,
    cache: 'no-store', // ISR: revalidate every 60 seconds
  });
  const rows = await res.json();
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => ({ ...r.data, _dbId: r.id }))
    .sort((a, b) => (a._order ?? 0) - (b._order ?? 0));
}

export async function getSettings() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/settings?id=eq.seo&select=*`, {
    headers: readHeaders,
    cache: 'no-store',
  });
  const rows = await res.json();
  return rows?.[0]?.data || null;
}

// ---- ЗАПИСЬ (только через серверный роут /api/admin с паролем) ---------------

async function adminPost(payload) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data;
}

// Проверка пароля без записи (для входа в админку)
export async function verifyAdmin(password) {
  try {
    await adminPost({ type: 'verify', password });
    return true;
  } catch {
    return false;
  }
}

export async function saveProjects(projects, password) {
  return adminPost({ type: 'projects', password, projects });
}

export async function saveSettings(seo, password) {
  return adminPost({ type: 'settings', password, seo });
}

// ---- Слаг из названия --------------------------------------------------------

export function toSlug(title) {
  return (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
