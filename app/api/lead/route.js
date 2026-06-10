import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, message, projectId, projectSlug, projectTitle, company } = body || {};

    // honeypot: бот заполнит скрытое поле company — молча игнорируем
    if (company) return NextResponse.json({ ok: true });

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!name || name.trim().length < 2 || name.length > 200) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: (message || "").slice(0, 2000),
        project_id: projectId || null,
        project_slug: projectSlug || null,
        project_title: projectTitle || null,
        source: "preorder",
      }),
    });

    if (!res.ok) {
      console.error("Supabase insert failed:", await res.text());
      return NextResponse.json({ error: "Save failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Lead route error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
