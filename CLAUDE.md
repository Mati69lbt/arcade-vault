# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — a platform for playing games online and competing for high scores (per README.md, in Spanish). Currently a fresh `create-next-app` skeleton with no game logic yet.

Intended to follow Spec Driven Design (`/spec` and `/spec-impl` workflow) via the `Klerith/fernando-skills` skill pack (`npx skills@latest add Klerith/fernando-skills`). These skills are not yet installed in this repo — if they're needed, install them first.

## Stack

- Next.js 16.3.5 with the App Router (`app/`) — this is a newer major version than typical training data; **read `node_modules/next/dist/docs/01-app/` before using App Router APIs**, since conventions may have changed (see AGENTS.md).
- React 19.2, TypeScript (strict), Tailwind CSS v4 (via `@tailwindcss/postcss`, no `tailwind.config` file — v4 uses CSS-based config in `app/globals.css`).
- Path alias `@/*` maps to repo root (`tsconfig.json`).

## Skills 
- Usa siempre /frontend-design para diseñar la interfaz de usuario.

## Commands

```bash
npm run dev      # start dev server (Turbopack/webpack per next.config.ts)
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint (flat config, eslint.config.mjs)
```

No test runner is configured yet.
