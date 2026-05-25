const SUPABASE_URL = "https://ukvfblzdvvjzuwbqmgxx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrdmZibHpkdnZqenV3YnFtZ3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzgzOTcsImV4cCI6MjA5NTMxNDM5N30.g6Eq-CbQulpp5037CjrwXFMHPCLsWvXvc4Q4-vzAAHc";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

export async function getProjects() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*`, {
    headers,
    next: { revalidate: 0 }, // ISR: revalidate every 60 seconds
  });
  const rows = await res.json();
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => ({ ...r.data, _dbId: r.id }))
    .sort((a, b) => (a._order ?? 0) - (b._order ?? 0));
}

export async function getSettings() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/settings?id=eq.seo&select=*`, {
    headers,
    next: { revalidate: 0 },
  });
  const rows = await res.json();
  return rows?.[0]?.data || null;
}

export async function saveSettings(seo) {
  await fetch(`${SUPABASE_URL}/rest/v1/settings`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ id: "seo", data: seo }),
  });
}

export async function saveProjects(projects) {
  if (projects.length === 0) {
    await fetch(`${SUPABASE_URL}/rest/v1/projects?id=gte.0`, {
      method: "DELETE",
      headers,
    });
    return;
  }
  const getR = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id,data`, { headers });
  const existing = await getR.json();

  const currentIds = projects.map((p) => p.id);
  const toDelete = Array.isArray(existing)
    ? existing.filter((r) => !currentIds.includes(r.data?.id))
    : [];

  for (const row of toDelete) {
    await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${row.id}`, {
      method: "DELETE",
      headers,
    });
  }

  for (let idx = 0; idx < projects.length; idx++) {
    const project = { ...projects[idx], _order: idx };
    const existingRow = Array.isArray(existing)
      ? existing.find((r) => r.data?.id === project.id)
      : null;

    if (existingRow) {
      await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${existingRow.id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ data: project }),
      });
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ data: project }),
      });
    }
  }
}

// Generate slug from project title
export function toSlug(title) {
  return (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
