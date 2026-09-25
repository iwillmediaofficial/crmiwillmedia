# IWILLMEDIA CRM

> Production-ready, internal company management system for **IWILLMEDIA**.  
> Engineered for Leads, Staff Workloads, Precision Work Timers, Client CRM, Invoices, Recurring Retainers, and Visual Billing Calendars.

---

## 🛠 Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS (Dark charcoal sidebar + Violet primary accent + Clean SaaS cards)
- **Backend / Database:** PostgreSQL via Supabase (Project ID: `iynfansffsqudlumikbe`)
- **Authentication:** Supabase Auth with persistent session refresh
- **Authorization:** PostgreSQL Row Level Security (RLS) with zero client trust
- **File Storage:** Supabase Storage (`profile-images`, `client-logos`, `work-attachments`, `billing-documents`)
- **State Management & Caching:** TanStack Query (React Query)
- **Forms & Validation:** React Hook Form + Zod
- **Hosting:** Vercel (Optimized for Free Tier)

---

## ⚡ Free Tier Optimizations (Supabase + Vercel)

1. **Selective Head-Count Queries:** Dashboard metric cards fetch database counts using `select('id', { count: 'exact', head: true })`, eliminating payload data transfers.
2. **TanStack Cache Strategy:** 3-minute stale time and 15-minute garbage collection prevents repeat network requests on tab and navigation changes (`refetchOnWindowFocus: false`).
3. **Rollup Route Chunk Splitting:** Pages are lazily imported (`React.lazy`), resulting in micro-bundles under 30KB per page.
4. **Vercel Asset Caching:** Long-lived immutable headers for static assets in `vercel.json` guarantee near-zero bandwidth consumption.
5. **Partial Unique Indexes:** PostgreSQL partial indexes (e.g. `idx_one_running_timer_per_staff WHERE stopped_at IS NULL`) ensure high query performance with minimal storage overhead.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### 2. Environment Setup
Copy the example environment configuration:
```bash
cp .env.example .env
```
Fill in your Supabase variables:
```env
VITE_SUPABASE_URL=https://iynfansffsqudlumikbe.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Production Build & Typecheck
```bash
npm run build
```

---

## 🔒 Security & Roles

- **ADMIN:** Complete company-wide oversight, staff provisioning and permission management, lead assignment, client management, invoice creation, recurring retainer configuration, and data export.
- **STAFF:** Isolated access to assigned leads, work deliverables, and time tracking. Cannot view or alter unassigned teammate records.

Enforced strictly at the PostgreSQL layer via Supabase Row Level Security (RLS) policies.
