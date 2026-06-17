import { NextResponse } from "next/server";

// Отправка уведомления на почту через Resend.
// Не валит заявку, если письмо не ушло: лид уже сохранён в базе.
async function sendNotification({ name, email, message, source, projectTitle }) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_EMAIL;
  if (!key || !to) return; // не настроено — тихо пропускаем

  const recipients = to.split(",").map((s) => s.trim()).filter(Boolean);
  const kind = source === "preorder" ? "Pre-order" : "Contact";
  const subjectBits = ["New", kind, "lead", projectTitle ? `— ${projectTitle}` : ""].filter(Boolean);

  const html = `
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#111;line-height:1.6">
      <h2 style="margin:0 0 16px">New ${kind} lead</h2>
      <p style="margin:0 0 6px"><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p style="margin:0 0 6px"><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${projectTitle ? `<p style="margin:0 0 6px"><strong>Project:</strong> ${escapeHtml(projectTitle)}</p>` : ""}
      ${message ? `<p style="margin:16px 0 0"><strong>Message:</strong><br>${escapeHtml(message).replace(/\n/g, "<br>")}</p>` : ""}
    </div>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Leshch site <d@leshch.com>",
        to: recipients,
        reply_to: email, // ответишь прямо из почты — уйдёт клиенту
        subject: subjectBits.join(" "),
        html,
      }),
    });
    if (!r.ok) console.error("Resend send failed:", await r.text());
  } catch (e) {
    console.error("Resend error:", e);
  }
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, message, projectId, projectSlug, projectTitle, company, source } = body || {};
    // honeypot: бот заполнит скрытое поле company — молча игнорируем
    if (company) return NextResponse.json({ ok: true });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!name || name.trim().length < 2 || name.length > 200) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    const leadSource = source === "contact" ? "contact" : "preorder";
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
        source: leadSource,
      }),
    });
    if (!res.ok) {
      console.error("Supabase insert failed:", await res.text());
      return NextResponse.json({ error: "Save failed" }, { status: 500 });
    }
    // письмо — после успешной записи; ошибки внутри не валят ответ
    await sendNotification({ name: name.trim(), email: email.trim().toLowerCase(), message, source: leadSource, projectTitle });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Lead route error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request) {
  const auth = request.headers.get("x-admin-secret");
  if (!auth || auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const res = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/leads?select=*&order=created_at.desc`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
  const leads = await res.json();
  return NextResponse.json({ leads });
}
