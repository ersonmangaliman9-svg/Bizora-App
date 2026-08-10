# Bizora

## Run locally
    npm install
    npm run dev

## Deploy (Vercel)
1. Push this folder to a GitHub repo.
2. Go to vercel.com -> New Project -> import the repo.
3. Framework preset: Vite (auto-detected). No env vars needed since the
   Supabase URL/key are already in the code.
4. Deploy. Once live, sign-up/login will work because the deployed site
   is a normal origin (not the claude.ai artifact sandbox), so fetch()
   calls to Supabase are no longer blocked.

## Deploy (Netlify)
1. Push to GitHub, then New site from Git in Netlify.
2. Build command: npm run build
3. Publish directory: dist
