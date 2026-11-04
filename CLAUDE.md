# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager

Always use **pnpm**. Never use `npm` or `yarn`. Two lockfiles exist (`pnpm-lock.yaml` and `package-lock.json`) — pnpm-lock.yaml is authoritative.

## Commands

```bash
pnpm dev       # development server
pnpm build     # production build
pnpm lint      # ESLint (eslint-config-next/core-web-vitals + typescript)
pnpm format    # Prettier — formats all files
```

## Code Style

Prettier is enforced via `.prettierrc`. Key non-default settings:

- `printWidth: 90` (not 80)
- `singleQuote: true` and `jsxSingleQuote: true`
- `endOfLine: "lf"` — always LF, even on Windows
- Import order is auto-sorted by `@ianvs/prettier-plugin-sort-imports`:
  1. `react` and `react-*`
  2. Third-party packages
  3. `@/components/*`
  4. `@/hooks/*`
  5. `@/utils/*`
  6. Relative imports

Run `pnpm format` after edits rather than sorting imports manually.

## Tailwind v4

There is no `tailwind.config.js`. Tailwind v4 is configured entirely via PostCSS (`postcss.config.mjs`). All theme customization (colors, dark mode, animations) lives in `app/globals.css` using `@theme inline` CSS variables. Do not create a `tailwind.config.js`.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
```

Both must be set or the Supabase client will log warnings and auth will fail.

## Architecture Patterns

**Context + Hooks**: Contexts in `contexts/` define providers; custom hooks in `hooks/` consume them. Components call `useAuth()`, `useToast()` — never import contexts directly.

**Types**: All TypeScript interfaces live in `lib/types/` (per-feature files). Import via the barrel: `import { AuthContextType } from '@/lib/types'`.

**Shadcn UI**: All 40+ components are pre-installed in `components/ui/`. Do not recreate them — import from there directly.

**Path alias**: `@/` maps to the project root. Use it for all non-relative imports.

## Branch & PR Conventions

Use prefixed branches: `feature/*`, `fix/*`, `chore/*`.
