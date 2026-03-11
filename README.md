# Neiro 🎵

A collaborative music video platform — upload short music intros and invite others to cover them.

## Stack
- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **Styling**: Tailwind CSS
- **Deploy**: Vercel

## Features
- 🔐 Supabase Auth (sign up / log in / log out)
- 📹 Video upload to Supabase Storage
- 🎤 Cover system — record your continuation of any intro
- 🔁 TikTok-style scroll feed with snap scrolling
- 👍 Like / 🎤 Cover / 🔁 Repost / 🔗 Share buttons
- 👤 User profile pages

## Pages
| Route | Description |
|---|---|
| `/` | Video feed |
| `/upload` | Upload a new intro video |
| `/video/[id]` | Video detail + covers list |
| `/cover/[id]` | Create a cover for an intro |
| `/profile/[id]` | User profile |
| `/login` | Log in |
| `/signup` | Sign up |

## Setup

### 1. Clone & install
```bash
git clone <repo>
cd neiro && npm install
```

### 2. Create a Supabase project
Go to https://supabase.com and create a new project.

### 3. Run the database schema
Copy `supabase/schema.sql` into the Supabase SQL editor and run it.

### 4. Create the Storage bucket
In Supabase > Storage, create a bucket named **videos** (set to public).

### 5. Configure environment variables
```bash
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 6. Run locally
```bash
npm run dev
```

## Deploy to Vercel
Push to GitHub, import the repo on vercel.com, add the two env vars, and deploy.
