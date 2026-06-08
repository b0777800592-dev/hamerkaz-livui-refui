# המרכז לליווי רפואי בישראל

פלטפורמת SaaS לניהול תהליכי ליווי רפואי. המוצר הראשון: ליווי בתחום קנאביס רפואי.

## Stack

- **Frontend:** Next.js 15 App Router, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Supabase (Postgres + Auth + Storage + RLS)
- **AI:** OpenAI API
- **Deployment:** Vercel + Supabase

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase and OpenAI keys
npm run dev
```

## Database

Run migrations in Supabase SQL editor in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls.sql
supabase/migrations/003_seed.sql
```

## Structure

```
src/
  app/
    (marketing)/     Public pages
    (auth)/          Login/register
    (portal)/        Customer portal
    (admin)/         CRM + case management
    (partner)/       Partner portal
    api/             API routes
    eligibility/     Eligibility questionnaire
  components/
    ui/              shadcn components
    forms/           Multi-step forms
    marketing/       Marketing components
    admin/           CRM tables, kanban
  lib/
    supabase/        client / server / admin
    auth/            Role guards
    ai/              OpenAI prompts
    pdf/             Report generation
    seo/             Metadata and schema
  types/             TypeScript types
supabase/
  migrations/        SQL migrations + RLS
```

## Development Phases

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Setup, DB schema, auth, design system | ✅ Done |
| 1 | Eligibility questionnaire + PDF report | ✅ Done |
| 2 | Admin CRM + Case Management + Customer Portal | 🔜 Next |
| 3 | AI Document Analyzer + automations | 🔜 |
| 4 | Partner Portal + analytics | 🔜 |
| 5 | SEO content engine + 50+ pages | 🔜 |

## Disclaimer

המערכת אינה מוכרת קנאביס, אינה מעניקה ייעוץ רפואי, ואינה מבטיחה אישור.
