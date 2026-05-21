# CLAUDE.md

Project-wide conventions and working agreements for the **SvelteBuilder** ecosystem. These are **mandatory**. Apply them to every file you create or edit. When existing code violates them, follow the conventions in new code and flag the inconsistency rather than copying it.

Stack: SvelteKit (Svelte 5), TypeScript, JavaScript, SQL (PostgreSQL via Supabase), HTML, CSS.

---

# PART 1 — NAMING CONVENTIONS

## Core principles

1. **Singular by default.** Names describe one of a thing. Use the singular form everywhere it is technically possible. The _only_ exception is REST endpoint paths.
2. **No abbreviations.** Spell every word out. The single allowed exception is `ID`. Universal tokens (`url`, `http`, `api`) are acceptable. Never invent shortenings (`cfg`, `usr`, `calc`, `btn`).
3. **No type-style prefixes.** No `is_`/`has_`/`should` on booleans. No `I` on interfaces. No `T` on types or generics.
4. **One concept, one name.** Use the same noun for an entity across the table, type, component, route, and UI label.

## SQL / PostgreSQL

- Tables: **singular**, `snake_case` — `user_account`, `event_session`.
- Avoid reserved words as bare table names — use `user_account`, never `users`.
- Columns: `snake_case`, singular unless the column holds a collection.
- Booleans: name the state directly — `active`, `email_verified`. Never `is_active`.
- Timestamps: keep the `_at` suffix — `created_at`, `published_at`, `deleted_at`.
- Primary key: always `id`.
- Foreign key: singular referenced table + `_id` — `user_account_id`.
- Junction tables: both singular entities, alphabetical — `event_session_attendee`.
- Indexes/constraints: descriptive, prefixed — `idx_user_account_email_address`, `fk_event_session_user_account_id`, `uq_user_account_email_address`.

## REST API

- Endpoint paths: **plural** (the only plural exception), lowercase, `kebab-case` — `/user-accounts`, `/user-accounts/42/event-sessions`.
- No verbs in paths; the HTTP method is the verb.
- JSON keys: `camelCase`, singular unless the value is a collection — `emailAddress`, `createdAt`, `eventSessions`.
- Convert `snake_case` (DB) to `camelCase` (wire) at the serialization boundary, in one place.
- Query parameters: `camelCase` — `?pageSize=20&sortBy=createdAt`.

## TypeScript / JavaScript

- Variables, functions, methods: `camelCase`.
- Classes: `PascalCase`.
- Types, interfaces, enums: `PascalCase`, **singular**, no prefix — `UserAccount`, `Locale`, `LocalText`.
- Enum members: `PascalCase` — `SessionStatus.Active`.
- True constants: `SCREAMING_SNAKE_CASE` — `MAX_RETRY_COUNT`. Use this only for genuine never-changing constants; a value that merely isn't reassigned stays `camelCase`.
- Generic parameters: single capital (`T`, `K`, `V`) or a plain `PascalCase` word (`Data`). **Never** a `T`-prefixed hybrid like `TData`.
- Booleans: name the state — `active`, `menuOpen`. Never `isActive`. Boolean-returning functions read as a predicate without a type prefix — `canEditSession()`, `sessionHasEnded()`.
- Collections: the type stays singular; pluralize the variable — `const userAccounts: UserAccount[]`.
- Acronyms: treat as a normal word, capitalize first letter only (Google JS Style Guide) — `getHttpUrl`, `HtmlParser`, not `getHTTPURL`.

## Svelte

- Components: `PascalCase.svelte`, filename matches the component — `UserCard.svelte`, `EventSessionList.svelte`. Entity part stays singular; a `List`/`Grid` noun carries plurality.
- Route directories: `kebab-case`, singular resource segments — `src/routes/user-account/[id]/`.
- `+page`, `+layout`, `+server`, `+error` and their `.server`/`.ts` variants are framework-mandated — do not rename.
- Props and `$state`/`$derived`: `camelCase`. Boolean props follow the no-prefix rule — `open`, not `isOpen`.
- Dispatched event names: `camelCase` — `sessionSelect`.
- Non-component modules: `kebab-case.ts` — `format-date.ts`, `get-content-by-slug.ts`. A module exporting a single dominant class/type may be `PascalCase.ts`.

## HTML

- Attributes, including `data-*` and `aria-*`: `kebab-case` — `data-user-account-id`, `aria-label`.
- `data-*` is `kebab-case` in markup, read as `camelCase` via `dataset` (`data-user-account-id` → `dataset.userAccountId`).
- `id` and `name` values: `kebab-case`, singular, descriptive.
- Test hooks: use `data-testid` with a `kebab-case` value — `data-testid="user-account-card"`.

## CSS

- Class names: `kebab-case`, BEM for structured components — `event-session-card__title--highlighted`.
- Block name is singular and matches the component/entity — `EventSessionCard.svelte` → `.event-session-card` → `event_session`.
- Custom properties: `--kebab-case`, namespaced by category — `--color-primary`, `--space-medium`, `--font-size-body`.
- Svelte scopes styles automatically; use plain semantic `kebab-case` for simple components and reserve full BEM for components where the structure genuinely aids readability.

## Before adding a new noun

Check whether the concept already has a name elsewhere in the stack. Reuse it. One concept, one name, every layer.

---

# PART 2 — STACK & FRAMEWORK CONVENTIONS

These resolve choices Claude would otherwise re-derive on every prompt. Follow them unless a file's existing pattern clearly differs — in which case match the file and flag it.

## Svelte 5 (runes)

- Use **runes** (`$state`, `$derived`, `$effect`, `$props`) for all new components. Do not write Svelte 4 style (`export let`, top-level reactive `$:`).
- Props: destructure once via `let { ... } = $props()`. Type the props object inline or with a named `PascalCase` type.
- Derive, don't sync: prefer `$derived` over `$effect` that assigns to `$state`. Reach for `$effect` only for genuine side effects (DOM, subscriptions, logging).
- Component event communication: use **callback props** (`onSessionSelect`) over `createEventDispatcher`. If a dispatched event is unavoidable, the event name still follows the `camelCase` rule above.
- Snippets (`{#snippet}` / `{@render}`) replace slots for new code.

## TypeScript

- `strict` is assumed on. No implicit `any`; if a type is genuinely unknown use `unknown` and narrow.
- Prefer `type` aliases for object shapes and unions; reserve `interface` for cases that need declaration merging.
- Avoid non-null assertions (`!`). Narrow explicitly so the failure path is real code.
- Export types from a colocated `type.ts` (or the dominant `PascalCase.ts` module) so other layers import one canonical definition rather than redeclaring shapes.

## SvelteKit data flow

- Load data in `+page.server.ts` / `+layout.server.ts` `load` functions; keep components presentational.
- Mutations go through **form actions** in `+page.server.ts`, not ad hoc `fetch` calls, unless the interaction is genuinely client-only.
- Never expose secrets to the client: server-only values import from `$env/static/private` or `$env/dynamic/private`; public config uses the `PUBLIC_` prefix.
- Throw `error(...)` and `redirect(...)` from `@sveltejs/kit` rather than returning ad hoc error shapes.

## Supabase / PostgreSQL

- The database is the source of truth for shape. Keep generated DB types in sync and import them rather than hand-writing row types.
- All tables that hold user-facing data have **Row Level Security enabled**; never assume client-side filtering is a security boundary. Note any new table that needs an RLS policy.
- Run privileged queries with the service-role key **only** in server code (`+page.server.ts`, `+server.ts`, `hooks.server.ts`). The browser client uses the anon key.
- The `snake_case` → `camelCase` conversion happens once, at the serialization boundary (see Part 1, REST API). DB code stays `snake_case` end to end; nothing downstream of the boundary sees `snake_case`.
- Prefer a single typed query helper per entity over inline queries scattered across loaders.

---

# PART 3 — INTERNATIONALIZATION (i18n)

i18n is a core concern of the ecosystem, but **responsibility is layered**. The single most important rule: know which layer a file belongs to before deciding whether it touches `svelte-hermes` at all. Getting this wrong produces architecturally wrong code even when it compiles.

## The two kinds of user-facing text

Every user-facing string falls into exactly one category. Decide which before writing the component.

1. **Application-level UI text** — button labels, headings, placeholders, generic chrome. This is **not** entity content. It is handled at the **scaffold / consuming-project level**, which passes plain strings (or its own inline-localized strings) down as ordinary props and snippets.
2. **Entity content** — copy that belongs to a specific domain entity: a product description, a task title, a session summary. This is resolved against the entity itself via `svelte-hermes`.

## Layer responsibilities

- **`svelte-hermes`** is the library that provides the i18n primitives: the `LocalText` type, `LocalTextLink`, the `Locale` type, the `LocalText` Svelte component, and the `localText(slug, scope, entityId)` function. It is the single source of these — never redeclare them.
- **The scaffold project and consuming projects** are explicitly i18n-aware. They own locale resolution and they supply application-level UI text to feature modules as plain props.
- **Feature modules** (`sveltebuilder-coreui`, `sveltebuilder-commerce`, etc.) split internally:
  - Their **application-level UI components** (buttons, layout chrome) stay i18n-agnostic — they expect a plain `label: string` and ordinary child snippets, exactly like any normal Svelte component. They do **not** import `svelte-hermes`.
  - Their **entity/domain components** (e.g. a `ProductCard`, a `TaskItem`) **do** depend on `svelte-hermes`. They receive the bare entity schema as props and resolve user-facing entity copy themselves.

So within a single feature module, `Button.svelte` takes manual text and `ProductCard.svelte` resolves localized content — and that is correct, not inconsistent.

## Domain schema is i18n-agnostic — but lacks conventional copy fields

- Domain-specific schema (the shape of a `Product`, a `Task`, an `EventSession`) is itself **agnostic** — it does not import or depend on `svelte-hermes`.
- The distinguishing rule: domain models **do not carry conventional copy columns** — no bare `name`, `title`, `label`, `description`, or similar user-facing text fields.
- Instead, that copy is connected to the entity through existing `LocalTextLink` wiring, keyed by **scope + entityID**. The schema carries only the entity's `id`; the written content lives in the localized content store and is linked, not embedded.
- **Scope is implied, never a schema field.** It is not a column or a prop. By convention it matches the table/model name (the `Product` model resolves under the `product` scope). Only deviate when there is a deliberate reason, and document it where the entity is defined.
- When modeling a new domain entity, never add a bare `title`/`name`/`label` field intending to localize later. The localized-content link is the model from the start.

## Resolving entity copy in components

- For block content, use the **`LocalText` Svelte component** with the appropriate scope and entityID.
- For inline props, attributes, and anywhere a component cannot be rendered (e.g. `aria-label`, `alt`, `placeholder`, `title` attributes), use the **`localText(slug, scope, entityId)`** function from `svelte-hermes`. `localText` is **synchronous** — its return value is a plain string, usable directly in markup, `$derived`, and attribute bindings without `await` or store subscription.
- A domain component receives the bare schema (the entity `id`, no copy fields) and derives every piece of user-facing entity text from it via these two mechanisms, supplying the implied scope. It never expects pre-resolved entity strings as props.

## Shared i18n conventions

- `Locale` is the single canonical type for a language/region tag — reuse it everywhere (props, parameters, DB columns), never a loose `string`.
- `LocalText` carries every `Locale` variant of a piece of copy; `LocalTextLink` connects that copy to an entity. Never store a bare string where entity copy is expected.
- `flattenDictionary` is the canonical utility for turning nested dictionary structures into flat key paths — reuse it rather than writing a parallel flattener.
- Slugs and scopes are stable identifiers: `kebab-case`, singular, locale-independent. They never change when copy is translated.

## Quick test before writing a component

Ask: _is this string tied to a specific entity, or is it generic chrome?_

- Generic chrome → plain `string` prop, no `svelte-hermes` import. The scaffold supplies it.
- Entity copy → resolve it via the `LocalText` component or `localText(...)`, keyed by scope + entityID.

---

# PART 4 — ARCHITECTURE & FILE ORGANIZATION

- **Module boundaries.** Each SvelteBuilder module is self-contained: its components, types, and helpers live together and expose a deliberate public surface. Cross-module imports go through that public surface, not deep paths.
- **Colocation.** Keep a component's types, helper functions, and styles near the component. A helper used by exactly one component does not belong in a shared folder.
- **Shared code lives in `$lib`.** Promote a helper to `$lib` only when a second consumer genuinely exists — not preemptively.
- **One responsibility per file.** A `kebab-case.ts` module exports one cohesive concept. If it grows a second unrelated concern, split it.
- **Server/client separation is explicit.** `.server.ts` for anything touching secrets, the service-role key, or privileged queries. If a file would tempt a secret into the client bundle, it is a `.server.ts` file.
- **No circular dependencies.** If two modules import each other, the shared piece belongs in a third module.

---

# PART 5 — CODE QUALITY

- **Correctness over cleverness.** Write the clear version. Optimize only with a measured reason, and note the reason in a comment.
- **Handle the failure path.** Every `await`, every query, every parse can fail. Narrow, guard, or surface the error — never let an unhandled rejection or silent `catch {}` through.
- **No dead code.** Don't leave commented-out blocks, unused imports, or speculative "might need later" exports. Delete them; version control remembers.
- **Comments explain _why_.** The code already shows _what_. Comment intent, trade-offs, and non-obvious constraints — not narration.
- **Pure where possible.** Keep functions pure and side-effect-free unless the side effect is the point. Pure functions are the easy ones to test and reason about.
- **Accessibility is not optional.** Semantic HTML first; `aria-*` only to fill genuine gaps. Interactive elements are keyboard-reachable and labeled. Svelte's a11y warnings are signal — fix them, don't suppress them.
- **Validate at the boundary.** Treat all external input (form data, query params, API responses, DB rows that could be stale) as untrusted until validated against a known shape.
- **Consistency beats personal preference.** When a file establishes a local pattern, match it. Raise a separate flag if the pattern is wrong.

---

# PART 6 — WORKING AGREEMENTS

Rules for how to respond to prompts in this ecosystem. These exist to save turns, compute, and review time.

- **Conventions are non-negotiable.** Part 1 naming is mandatory. If a request would require violating it, say so and propose a compliant alternative rather than silently complying.
- **Reuse before inventing.** Before writing a new type, helper, or noun, check whether one already exists (`LocalText`, `LocalTextLink`, `Locale`, the `localText(...)` function, `flattenDictionary`, existing entity types). Reuse the canonical name and definition; for i18n primitives, import from `svelte-hermes` rather than redeclaring. Require sveltebuilder-coreui and build all domain specific components on top of those universal components.
- **Ask before assuming on ambiguity that changes the output.** If a missing detail would materially change the code (data shape, auth model, which module owns the code), ask one focused question rather than guessing and producing a wrong artifact. For low-stakes gaps, pick a sensible default and state the assumption inline.
- **Match the requested scope.** Build what was asked. Don't add speculative features, abstraction layers, or configuration. If an extension seems valuable, finish the task and then suggest it briefly.
- **Show the diff, not the world.** When editing an existing file, change the minimum necessary and present the edit clearly. Do not reformat untouched code or rename unrelated symbols in passing.
- **Complete and runnable.** Code should run as delivered — real imports, no `// ... rest of implementation` placeholders, no undefined references. If something must be stubbed, mark it explicitly and explain what's missing.
- **State assumptions and follow-ups concisely.** A short note on what was assumed, what still needs doing (RLS policy, migration, generated-type refresh), or what was flagged is worth more than prose. Keep it brief.
- **Flag, don't fix silently.** When you spot a convention violation, bug, or risk outside the current task, point it out — don't quietly rewrite it or quietly ignore it.
