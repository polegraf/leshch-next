import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const sHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

async function ok(res, label) {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${label} failed: ${res.status} ${text}`);
  }
}

async function writeProjects(projects) {
  if (!Array.isArray(projects)) throw new Error('projects must be an array');

  if (projects.length === 0) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?id=gte.0`, {
      method: 'DELETE',
      headers: sHeaders,
    });
    await ok(res, 'delete-all');
    return;
  }

  const getR = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id,data`, { headers: sHeaders });
  await ok(getR, 'fetch-existing');
  const existing = await getR.json();

  const currentIds = projects.map((p) => p.id);
  const toDelete = Array.isArray(existing)
    ? existing.filter((r) => !currentIds.includes(r.data?.id))
    : [];

  for (const row of toDelete) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${row.id}`, {
      method: 'DELETE',
      headers: sHeaders,
    });
    await ok(res, 'delete');
  }

  for (let idx = 0; idx < projects.length; idx++) {
    const project = { ...projects[idx], _order: idx };
    const existingRow = Array.isArray(existing)
      ? existing.find((r) => r.data?.id === project.id)
      : null;

    if (existingRow) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${existingRow.id}`, {
        method: 'PATCH',
        headers: { ...sHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: project }),
      });
      await ok(res, 'update');
    } else {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
        method: 'POST',
        headers: { ...sHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ data: project }),
      });
      await ok(res, 'insert');
    }
  }
}

async function writeSettings(seo) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/settings`, {
    method: 'POST',
    headers: { ...sHeaders, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ id: 'seo', data: seo }),
  });
  await ok(res, 'save-settings');
}

export async function POST(req) {
  if (!SERVICE_KEY || !SUPABASE_URL || !process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const { password, type } = body || {};

  // Проверка пароля на сервере — секрет в браузер не уезжает
  if (!password || password !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (type === 'verify') return NextResponse.json({ ok: true });
    if (type === 'projects') {
      await writeProjects(body.projects || []);
      return NextResponse.json({ ok: true });
    }
    if (type === 'settings') {
      await writeSettings(body.seo || {});
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
