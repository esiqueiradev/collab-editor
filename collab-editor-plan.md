# Project #07 — Real-time Collaborative Document Editor
## Implementation Plan

---

## Context
Portfolio project to showcase senior full-stack skills for job interviews.
Demonstrates: CRDT-based real-time sync, WebSockets at scale, multi-tenant auth, clean architecture.

**Stack decisions:**
- Frontend: Next.js 16 (App Router) — scaffolded via `pnpm create next-app`
- Sync: Yjs + y-websocket
- Editor UI: Tiptap v2 (ProseMirror-based)
- Auth: NextAuth.js — email/password + Google + GitHub OAuth
- DB: Postgres via Prisma ORM v7 (config in `prisma.config.ts`, client output to `app/generated/prisma`)
- Cache/Pub-Sub: Redis (for multi-instance WebSocket scaling)
- Monorepo: pnpm v11 workspaces
- Linting/Formatting: Biome (replaces ESLint + Prettier)
- Infra: Docker + Docker Compose + GitHub Actions CI

---

## Architecture Overview

```
collab-editor/
  apps/
    web/          ← Next.js 16 (App Router) — UI + REST API routes
    ws-server/    ← Standalone Node.js — y-websocket server
  packages/
    shared/       ← Shared TypeScript types (Document, User, etc.)
  docker-compose.yml
  .github/
    workflows/
      ci.yml
```

**Why a separate ws-server?**
Next.js App Router does not support long-lived WebSocket connections in API routes.
The ws-server runs independently, auth-gated via JWT verification on upgrade.

**Why Redis?**
When multiple ws-server instances run (horizontal scaling), Redis pub/sub
(via y-redis) keeps Yjs awareness in sync across instances.

---

## TODO — Progress Tracker

### Phase 1 — Project Setup & Monorepo ✅
- [x] Create repo and `pnpm-workspace.yaml`
- [x] Scaffold `apps/web` with `pnpm create next-app` (TypeScript, App Router, Tailwind)
- [x] Scaffold `apps/ws-server` (Node.js + TypeScript + tsx)
- [x] Create `packages/shared` with shared TypeScript types
- [x] Configure root `tsconfig.json` with path aliases for `packages/shared`
- [x] Set up Biome at root (replaces ESLint + Prettier)
- [x] Write `docker-compose.yml` (postgres:16 + redis:7)
- [x] Write `.env.example` with all required variables
- [x] Add `.gitignore` (node_modules, .next, dist, .env, editors, OS files)

### Phase 2 — Database Schema (Prisma) ✅
- [x] Install Prisma in `apps/web` (Prisma v7 — uses `prisma.config.ts` + `dotenv`)
- [x] Write schema: `User`, `Document`, `DocumentCollaborator`, `DocumentSnapshot`, `Role` enum
- [x] Add NextAuth required models: `Account`, `Session`, `VerificationToken`
- [x] Run `prisma migrate dev --name init` — all 7 tables created in postgres
- [x] Run `prisma generate` — client output to `apps/web/app/generated/prisma`

### Phase 3 — Authentication (NextAuth.js v5)
- [ ] Install `next-auth@beta` + `@auth/prisma-adapter`
- [ ] Configure `CredentialsProvider` (email + bcrypt)
- [ ] Configure `GoogleProvider`
- [ ] Configure `GitHubProvider`
- [ ] Write `middleware.ts` to protect `/dashboard` and `/doc/[id]`
- [ ] Write `POST /api/auth/register` route (hash password, create User)
- [ ] Extend NextAuth session type with `{ id, avatarUrl }`
- [ ] Build `/login` page
- [ ] Build `/register` page
- [ ] Build `/` landing page with sign-in CTA

### Phase 4 — Document REST API
- [ ] `GET /api/documents` — list owned + collaborated documents
- [ ] `POST /api/documents` — create document + owner collaborator row
- [ ] `GET /api/documents/[id]` — get metadata + collaborators
- [ ] `PATCH /api/documents/[id]` — update title
- [ ] `DELETE /api/documents/[id]` — delete (OWNER only)
- [ ] `POST /api/documents/[id]/invite` — invite by email + assign role
- [ ] `DELETE /api/documents/[id]/collaborators/[userId]` — remove collaborator
- [ ] `GET /api/documents/[id]/snapshots` — list snapshots
- [ ] `POST /api/documents/[id]/snapshots` — save named snapshot
- [ ] `POST /api/documents/[id]/snapshots/[snapId]/restore` — restore snapshot
- [ ] Add Zod validation to all routes
- [ ] Confirm all routes return consistent `{ data, error }` shape

### Phase 5 — WebSocket Server
- [ ] Install `ws`, `yjs`, `y-websocket`, `y-redis`, `jsonwebtoken`, `@prisma/client`
- [ ] Create HTTP + WebSocket server in `apps/ws-server/src/index.ts`
- [ ] Implement upgrade auth: extract + verify JWT from `?token=` query param
- [ ] Implement upgrade auth: check document access via Prisma
- [ ] Call `setupWSConnection` for authorized connections
- [ ] Integrate `y-redis` for multi-instance pub/sub
- [ ] Implement persistence: serialize Yjs state → `Document.yjsState` every 30s
- [ ] Implement seeding: load `yjsState` from DB on new connection
- [ ] Test: two clients connect and edits sync

### Phase 6 — Frontend: Dashboard
- [ ] Build `app/dashboard/page.tsx`
- [ ] Fetch and display document list (owned + shared)
- [ ] "New Document" button → POST + redirect to editor
- [ ] Document card: title, last edited, collaborator avatars, role badge
- [ ] Delete document with confirmation dialog (owner only)
- [ ] Client-side title search/filter

### Phase 7 — Frontend: Editor Page
- [ ] Install `tiptap`, `@tiptap/extension-collaboration`, `@tiptap/extension-collaboration-cursor`, `y-websocket`
- [ ] Build `app/doc/[id]/page.tsx`
- [ ] Load document metadata (SSR)
- [ ] Initialize `WebsocketProvider` with JWT token
- [ ] Initialize Tiptap editor with `Collaboration` + `CollaborationCursor` extensions
- [ ] Inline editable title with debounced PATCH on blur
- [ ] Toolbar: Bold, Italic, Headings, Lists, Undo/Redo
- [ ] Connection status badge (connecting / connected / disconnected)
- [ ] Online users bar with avatars from awareness state
- [ ] Share button → invite modal
- [ ] History button → snapshots sidebar

### Phase 8 — Version History
- [ ] "Save version" button with optional label input
- [ ] Snapshots sidebar: list with date + label
- [ ] Click snapshot → read-only Tiptap preview
- [ ] "Restore" button → POST restore → reload editor

### Phase 9 — Docker & CI/CD
- [ ] Write `apps/web/Dockerfile` (multi-stage)
- [ ] Write `apps/ws-server/Dockerfile` (multi-stage)
- [ ] Add `web` and `ws-server` services to `docker-compose.yml`
- [ ] Test `docker compose up` — full stack runs from zero
- [ ] Write `.github/workflows/ci.yml` (typecheck + lint + test)
- [ ] Confirm CI passes on a clean push

### Phase 10 — Deployment (Railway)
- [ ] Create Railway project + add Postgres and Redis plugins
- [ ] Deploy `apps/web` — set all env vars
- [ ] Deploy `apps/ws-server` — set `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`
- [ ] Set `NEXT_PUBLIC_WS_URL` in web service → ws-server Railway URL
- [ ] Verify live app works end-to-end
- [ ] (Optional) Configure custom domain

### README
- [ ] Architecture diagram (Excalidraw or Mermaid)
- [ ] "Why Yjs over OT?" section
- [ ] "Why a separate ws-server?" section
- [ ] Live demo URL
- [ ] Local setup in under 5 commands

---

## Phase 1 — Project Setup & Monorepo

**Goal:** Skeleton compiles, all packages resolve, Docker brings up Postgres + Redis.

Steps:
1. Init repo with `pnpm workspaces` — create `pnpm-workspace.yaml`:
   ```yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```
2. `apps/web` → `pnpm create next-app` (TypeScript, App Router, Tailwind)
3. `apps/ws-server` → bare Node.js + TypeScript (`tsx`)
4. `packages/shared` → plain TypeScript package, export types only
5. Root `tsconfig.json` with path aliases pointing to `packages/shared`
6. ESLint + Prettier config at root, extended by each app
7. `docker-compose.yml` with:
   - `postgres:16-alpine` (port 5432)
   - `redis:7-alpine` (port 6379)
8. `.env.example` documenting every required variable

**Key env vars:**
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
WS_SERVER_URL=ws://localhost:4000
JWT_SECRET=...
```

---

## Phase 2 — Database Schema (Prisma)

**Goal:** All tables migrated, Prisma Client generated.

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  avatarUrl     String?
  passwordHash  String?       // null for OAuth-only users
  createdAt     DateTime @default(now())

  ownedDocuments    Document[]
  collaborations    DocumentCollaborator[]
  sessions          Session[]
  accounts          Account[]             // NextAuth OAuth accounts
}

model Document {
  id          String   @id @default(cuid())
  title       String   @default("Untitled")
  yjsState    Bytes?                // serialized Yjs binary snapshot
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  owner       User     @relation(fields: [ownerId], references: [id])
  ownerId     String

  collaborators DocumentCollaborator[]
  snapshots     DocumentSnapshot[]
}

model DocumentCollaborator {
  id         String   @id @default(cuid())
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  documentId String
  user       User     @relation(fields: [userId], references: [id])
  userId     String
  role       Role     @default(EDITOR)   // VIEWER | EDITOR | OWNER
  joinedAt   DateTime @default(now())

  @@unique([documentId, userId])
}

model DocumentSnapshot {
  id          String   @id @default(cuid())
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  documentId  String
  yjsState    Bytes
  createdAt   DateTime @default(now())
  label       String?
}

enum Role { VIEWER EDITOR OWNER }

// NextAuth required models: Account, Session, VerificationToken
```

---

## Phase 3 — Authentication (NextAuth.js v5)

**Goal:** Users can sign up/in via email+password, Google, and GitHub. All editor routes are protected.

Steps:
1. Install `next-auth@beta` + `@auth/prisma-adapter`
2. Configure providers in `apps/web/auth.ts`:
   - `CredentialsProvider` — bcrypt compare, return user object
   - `GoogleProvider` — standard OAuth flow
   - `GitHubProvider` — standard OAuth flow
3. `middleware.ts` at app root — protect `/dashboard` and `/doc/[id]` routes
4. Sign-up route (`POST /api/auth/register`) — hash password, create User in DB
5. Extend NextAuth session type to include `{ id, name, email, avatarUrl }`

**UI pages:** `/login`, `/register`, `/` (landing page)

---

## Phase 4 — Document REST API (Next.js Route Handlers)

**Goal:** Full CRUD for documents + collaborator management.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/documents` | List documents the user owns or collaborates on |
| POST | `/api/documents` | Create document (owner row auto-created) |
| GET | `/api/documents/[id]` | Get document metadata + collaborators |
| PATCH | `/api/documents/[id]` | Update title (EDITOR or OWNER) |
| DELETE | `/api/documents/[id]` | Delete document (OWNER only) |
| POST | `/api/documents/[id]/invite` | Invite user by email, assign role |
| DELETE | `/api/documents/[id]/collaborators/[userId]` | Remove collaborator |
| GET | `/api/documents/[id]/snapshots` | List version history |
| POST | `/api/documents/[id]/snapshots` | Save a named snapshot |
| POST | `/api/documents/[id]/snapshots/[snapId]/restore` | Restore snapshot |

All routes: validate session via `auth()`, validate body with Zod, return `{ data, error }`.

---

## Phase 5 — WebSocket Server (y-websocket)

**Goal:** Real-time Yjs sync between clients, auth-gated, Redis-backed for horizontal scaling.

`apps/ws-server/src/index.ts`:

1. Install: `ws`, `yjs`, `y-websocket`, `y-redis`, `jsonwebtoken`, `@prisma/client`
2. HTTP server → `ws.WebSocketServer`
3. On upgrade request:
   - Extract JWT from `?token=...` query param
   - Verify with `JWT_SECRET` — reject 401 if invalid
   - Extract `documentId` from URL `/doc/:documentId`
   - Check Prisma: user has VIEWER/EDITOR/OWNER role on document
   - Unauthorized → close socket with 4403
4. On authorized connection:
   - `setupWSConnection(ws, req, { docName: documentId })`
5. Redis via `y-redis` — fan-out Yjs updates across multiple ws-server instances
6. Persistence: every 30s serialize `Y.encodeStateAsUpdate(ydoc)` → write to `Document.yjsState`
7. On new connection: seed Yjs doc from existing `yjsState` in DB

**Awareness (user cursors):**
Each client sets `{ name, color, avatarUrl }` in y-websocket awareness state.
Tiptap's `CollaborationCursor` extension renders these as labeled cursor overlays.

---

## Phase 6 — Frontend: Dashboard Page

Route: `app/dashboard/page.tsx`

- List all documents sorted by `updatedAt`
- "New Document" → POST `/api/documents` → redirect to `/doc/[id]`
- Cards: title, last edited timestamp, collaborator avatars, role badge
- Delete (owner only) with confirmation dialog
- Client-side title search/filter

---

## Phase 7 — Frontend: Editor Page

Route: `app/doc/[id]/page.tsx`

Steps:
1. Load document metadata (SSR or client)
2. Init `WebsocketProvider`:
   ```ts
   const provider = new WebsocketProvider(
     process.env.NEXT_PUBLIC_WS_URL,
     documentId,
     ydoc,
     { params: { token: session.accessToken } }
   )
   ```
3. Init Tiptap editor:
   ```ts
   useEditor({
     extensions: [
       StarterKit.configure({ history: false }), // Yjs owns history
       Collaboration.configure({ document: ydoc }),
       CollaborationCursor.configure({
         provider,
         user: { name: session.user.name, color: userColor }
       }),
       // Heading, Bold, Italic, BulletList, OrderedList, Link
     ]
   })
   ```
4. Inline editable title → PATCH on blur (debounced)
5. Toolbar: Bold, Italic, Headings, Lists, Undo/Redo
6. Connection status badge (connecting / connected / disconnected)
7. Online users bar: avatars from `provider.awareness.getStates()`
8. Share button → invite modal → POST `/api/documents/[id]/invite`
9. History button → snapshots sidebar → restore action

---

## Phase 8 — Version History

Sidebar panel within `/doc/[id]`:

1. "Save version" button → POST snapshot with optional label
2. Snapshot list (date + label)
3. Click snapshot → read-only Tiptap preview (loads snapshot yjsState)
4. "Restore" → POST restore → reload live editor

---

## Phase 9 — Docker & CI/CD

**docker-compose.yml services:**
- `postgres` — `postgres:16-alpine`, named volume
- `redis` — `redis:7-alpine`
- `web` — Next.js, depends on postgres + redis
- `ws-server` — Node.js, depends on postgres + redis

**Dockerfiles:** multi-stage for both apps (deps → builder → runner)

**GitHub Actions `ci.yml`:**
```yaml
on: [push, pull_request]
jobs:
  ci:
    steps:
      - Checkout + Setup Node 20
      - npm ci
      - npx prisma generate
      - npm run typecheck   # tsc --noEmit
      - npm run lint
      - npm run test
```

---

## Phase 10 — Deployment (Railway)

1. Create Railway project → add Postgres + Redis plugins
2. Deploy `apps/web` (set all auth + DB env vars)
3. Deploy `apps/ws-server` (set `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`)
4. Set `NEXT_PUBLIC_WS_URL` in web service → Railway ws-server URL
5. Optional: custom domain

---

## Verification Checklist

- [ ] Two tabs on the same document — edits appear live in both
- [ ] Disconnect a tab, reconnect — missed changes sync correctly
- [ ] Two users see each other's cursors with correct name/color
- [ ] Email, Google, and GitHub login all work
- [ ] VIEWER role cannot edit — toolbar is disabled
- [ ] Deleting a document removes it from all collaborators' dashboards
- [ ] Restoring a snapshot reverts the document content
- [ ] `docker compose up` brings the full stack from zero
- [ ] GitHub Actions CI passes on a clean push

---

## README Must-Haves (for portfolio impact)

- Architecture diagram (Excalidraw or Mermaid)
- "Why Yjs over OT?" decision section
- "Why a separate ws-server?" explanation
- Live demo URL
- Local setup in under 5 commands
