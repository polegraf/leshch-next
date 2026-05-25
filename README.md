# leshch-next

Portfolio site for Dmitry Leshchinskiy — migrated from CRA to Next.js 14 for SEO.

## What's new vs react-lemberg

- **Real URLs**: `/project/amascence`, `/photo`, `/contact` — each page indexable by Google
- **Per-project SEO**: unique title, description, og:image for every project
- **Auto sitemap**: `/sitemap.xml` generated from Supabase projects
- **robots.txt**: auto-generated
- **ISR**: pages revalidate every 60s — no rebuild needed when content changes
- **Same stack**: Supabase + Cloudflare R2 + Vercel — nothing changes in the backend

## Setup

### 1. Create new repo on GitHub
```
github.com/polegraf/leshch-next
```

### 2. Copy these files into the repo

### 3. Set environment variables in Vercel
```
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=portfolio-media
```

### 4. Deploy to Vercel
Connect the new repo — Vercel auto-detects Next.js.

Site will be live at `leshch-next.vercel.app`

### 5. Test everything, then switch domain
In Vercel dashboard: Domains → add `leshch.com` to the new project, remove from old.

## Project structure

```
app/
  layout.js           — root layout + global metadata
  page.js             — homepage (server component)
  sitemap.js          — auto-generated sitemap
  robots.js           — robots.txt
  project/[slug]/
    page.js           — project page with per-project SEO
  photo/
    page.js           — photo gallery
  contact/
    page.js           — contact form
  api/upload/
    route.js          — R2 presigned URL endpoint

components/
  Nav.js              — sticky nav with mobile burger
  Footer.js           — footer with social links
  HomeClient.js       — homepage grid + filter (client)
  ProjectClient.js    — project page (client)
  PhotoClient.js      — photo gallery (client)
  ContactClient.js    — contact form (client)
  AdminPanel.js       — admin CRUD panel (client)

lib/
  db.js               — Supabase fetch functions + toSlug()
```

## URL structure

| Old (CRA) | New (Next.js) |
|-----------|---------------|
| / (state: index) | / |
| / (state: project) | /project/amascence |
| / (state: photo) | /photo |
| / (state: contact) | /contact |

## Admin

Access via ✳ in nav → password → admin panel opens inline (same as before).
