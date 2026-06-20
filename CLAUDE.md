# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint check
npm start        # Start production server (after build)
```

No test suite is configured.

## Stack

- **Next.js 16.2.9** (App Router) — see AGENTS.md warning about breaking changes
- **React 19.2.4** with full client components (`"use client"`)
- **TypeScript 5** — strict mode, path alias `@/*` maps to project root
- **Tailwind CSS v4** via `@tailwindcss/postcss` — no config file, uses CSS-first configuration

## Architecture

Single-page client-side prototype. All logic lives in [app/page.tsx](app/page.tsx); there is no backend, no API routes, and no external data fetching.

**State machine in `page.tsx`:**

- `phase`: `"idle" | "generating" | "done"` — drives UI rendering
- `pipelineStage`: `-1..3` — animates the 4-step visual pipeline (Idea → Narrative → Formats → Distribution)
- `cards`: array of generated `Card` objects revealed sequentially via `visibleIds`

**Content generation** (`generateCards(idea)`): pure client-side string interpolation — no AI calls. Produces 7 cards: 1 YouTube structure, 1 Telegram post, 5 Reels hooks (Paradox, Mystery, Provocation, Insider, Reinterpretation). Each card has a `glow` type (`"purple" | "blue" | "cyan"`), leverage score, and pre-formatted text content.

**Animation sequence** (`generate()`): async timer chain — 300 ms intro delay, 620 ms per pipeline stage, 210 ms per card reveal. All visual effects (glow pulses, dot animations, scan line, card fade-in) are pure CSS keyframes defined in [app/globals.css](app/globals.css).

## Key Files

| File                               | Role                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| [app/page.tsx](app/page.tsx)       | Entire app: state, generation logic, all UI                                    |
| [app/globals.css](app/globals.css) | Tailwind imports + all custom keyframes and glow/pulse CSS classes             |
| [app/layout.tsx](app/layout.tsx)   | Root layout, Geist font, Russian locale, page metadata                         |
| [SPEC.md](SPEC.md)                 | Russian-language product specification (source of truth for intended behavior) |

## SQL && Supabase

- всегда создавай `.sql` файлы для любых SQL-запросов, которые пользователь должен выполнить
- помещай все `.sql` файлы в папку `/docs` в соответствующем проекте
- каждый файл должен начинаться с номера, чтобы фиксировать порядок выполнения операций
- вся схема базы данных должна быть задокументирована в папке `/docs` в отдельных `.sql` файлах
- называй файлы в таком формате: `001_create_x_table.sql`, `002_change_rls_policy.sql`, `003_add_foreign_key.sql` и т.д.
