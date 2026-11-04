# next-shadcn-supabase-starter

A Next.js starter with shadcn/ui, Supabase auth wiring, and Tailwind CSS v4. Clone it, add your env vars, and start building.

**Stack:** Next.js 16 · React 19 · TypeScript 7 · shadcn/ui (radix-vega) · Supabase · pnpm

## Quick start

```bash
git clone https://github.com/rinmeng/next-shadcn-supabase-starter.git
cd next-shadcn-supabase-starter
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase env vars

Add these to `.env.local` (from [Project Settings → API](https://supabase.com/dashboard/project/_/settings/api)):

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
```

The app expects the publishable key name above — not `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Without valid credentials, auth-related code won't connect.

## Scripts

| Command             | What it does                      |
| ------------------- | --------------------------------- |
| `pnpm dev`          | Start the dev server              |
| `pnpm build`        | Production build                  |
| `pnpm start`        | Run the production server         |
| `pnpm lint`         | ESLint                            |
| `pnpm format`       | Prettier (write)                  |
| `pnpm format:check` | Prettier (check only, used in CI) |
| `pnpm typecheck`    | `tsc --noEmit` (TypeScript 7)     |

CI runs format check + lint on push/PR via `.github/workflows/format-lint.yml`.

## shadcn/ui

Components live in `components/ui/`. Most of the usual set is already installed.

Add more:

```bash
pnpm dlx shadcn@latest add [component]
```

This project uses the **radix-vega** style. Newer components (questionnaire, bubble, message, etc.) import `cn` from the [`cn`](https://github.com/shadcn-ui/cn) package. App code can use `@/lib/utils`, which re-exports the same thing.

If you're upgrading an older shadcn project, use the CLI migrations instead of hand-editing imports:

```bash
pnpm dlx shadcn@latest migrate cn      # clsx + tailwind-merge → cn
pnpm dlx shadcn@latest migrate radix   # @radix-ui/react-* → radix-ui
```

## Project layout

```text
app/              Pages and layouts (App Router)
components/       App components + components/ui/ (shadcn)
contexts/         AuthProvider, ToastProvider
hooks/            use-auth, use-toast, use-mobile
lib/              Supabase client, types, utils
utils/supabase/   Browser + middleware Supabase clients
proxy.ts          Session refresh middleware
```

Auth follows a simple pattern: context in `contexts/`, hook in `hooks/`, types in `lib/types/`. Providers are wired up in `app/layout.tsx`.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rinmeng/next-shadcn-supabase-starter)

Set the same Supabase env vars in your host's dashboard.

## License

MIT — see [LICENSE](LICENSE).
