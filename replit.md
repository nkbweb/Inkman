# Workspace

## Overview

pnpm workspace monorepo using TypeScript. A full-stack blog mobile app with Expo (React Native) frontend and Express backend using Supabase for auth and database.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: Supabase (PostgreSQL hosted)
- **Auth**: Supabase Auth (email/password)
- **Mobile**: Expo (React Native) with Expo Router
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (Supabase-backed)
│   └── mobile/             # Expo React Native blog app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── supabase-schema.sql     # SQL schema to run in Supabase dashboard
└── package.json
```

## Supabase Setup

The app uses Supabase for:
- Authentication (email/password)
- PostgreSQL database for posts, comments, profiles, likes

Run `supabase-schema.sql` in your Supabase SQL editor to set up the schema.

### Required Environment Variables

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon/public API key

## Mobile App Features

- **Feed**: Browse published blog posts with category filters
- **Search**: Search posts by keyword
- **Post Detail**: Read full posts, like, and comment
- **Write**: Create and publish new posts (draft or published)
- **Edit**: Edit existing posts
- **Profile**: View your posts (published + drafts), sign out
- **Auth**: Sign in / sign up with email and password

## API Endpoints

All routes are under `/api`:

- `GET /posts` - List published posts (supports ?category, ?search, ?page, ?limit)
- `POST /posts` - Create post (auth required)
- `GET /posts/:id` - Get single post
- `PATCH /posts/:id` - Update post (auth required, owner only)
- `DELETE /posts/:id` - Delete post (auth required, owner only)
- `POST /posts/:id/like` - Like/unlike post (auth required)
- `GET /posts/:id/comments` - Get comments for a post
- `POST /posts/:id/comments` - Add comment (auth required)
- `DELETE /comments/:id` - Delete comment (auth required, owner only)
- `GET /profile` - Get current user profile (auth required)
- `PATCH /profile` - Update profile (auth required)
- `GET /profile/posts` - Get all posts by current user (auth required)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array.
