# REBUILD LOG — sveltebuilder-commerce

_Completed: 2026-05-20_

---

## 1. Audit: POC Component Inventory

| File | Status | Surface | Action |
|---|---|---|---|
| `PriceTag.svelte` | POC stub | Shared | Deleted — replaced by `PriceDisplay` |
| `ProductModal.svelte` | POC stub | Storefront | Deleted — replaced by `ProductDetail` |
| `StockBadge.svelte` | Partial | Admin/Shared | Rebuilt |
| `CategoryFilter.svelte` | Partial | Storefront | Rebuilt |
| `ProductCard.svelte` | Partial | Storefront | Rebuilt |
| `ProductGrid.svelte` | Partial | Storefront | Rebuilt |

All other components listed in the delivery are **new** — no POC equivalent existed.

---

## 2. New Internal Primitives (`src/lib/internal/`)

| Component | Purpose |
|---|---|
| `Modal.svelte` | Native `<dialog>` with snippet API, sizes, ESC/backdrop close, entry animation |
| `DataTable.svelte` | Generic Svelte 5 table (`generics="T extends { id: number }"`), sort, pagination, bulk select, loading skeleton |
| `Pagination.svelte` | Ellipsis pagination with `aria-current`, `aria-live` count, `onchange` callback |

---

## 3. Rebuilt Components

| Component | Key changes from POC |
|---|---|
| `StockBadge` | Configurable `lowThreshold` (was hardcoded 5), `role="status"`, `localText` from `svelte-hermes` |
| `CategoryFilter` | Accepts `ProductCategory[]` by id; names resolved via `localText` scope/contentId; `aria-pressed` |
| `ProductCard` | Name/description via `localText`; real image from `mediaUrls[0]`; SVG placeholder; published/featured badges |
| `ProductGrid` | Loading skeleton (6 cards), empty state with icon, server-side pagination via `Pagination` |

---

## 4. New Components

### Shared

| Component | Description |
|---|---|
| `PriceDisplay` | `Money` type input (minor units), `Intl.NumberFormat`, compare-at strikethrough, accessible `aria-label` |

### Storefront (buyer-facing)

| Component | Description |
|---|---|
| `ProductDetail` | Gallery + thumbnail strip, variant selector, quantity input, add-to-cart |
| `CartSummary` | Item list with qty +/−, line totals, shipping/tax estimates, empty state |
| `CheckoutForm` | 4-step flow (contact → shipping → payment → review); early shipping+tax preview at step 2 per Baymard guidelines; guest checkout; payment method radio group; trust signals |
| `CustomerOrderHistory` | Tracking/fulfillment status shown first (primary buyer visit reason); paginated; reorder + return actions |

### Admin (operator-facing)

| Component | Description |
|---|---|
| `AdminProductTable` | DataTable wrapper with thumbnail, SKU, category (localized), price, stock badge, published badge; bulk select; optional duplicate action |
| `BulkEditToolbar` | Fields: price (set/increase%/decrease%), stock (set/adjust), published, featured; scheduled edit toggle; last job result with partial-failure expandable list; undo callback |
| `CollectionRuleBuilder` | Automated/manual toggle; all/any match mode; rule rows with field-dependent operator options; live preview via `onpreviewrequest` + `previewCount` |
| `InventoryPanel` | Multi-location inventory; summary row (total/available/alert counts); per-location adjust panel with delta + required reason |
| `StockAuditLog` | Paginated audit table: date, user, delta (color-coded ±), reason |
| `OrderList` | Status filter tabs; DataTable with bulk select; guest tag; status + fulfillment badges; view/fulfill actions |
| `OrderDetail` | Line items, totals breakdown (subtotal + shipping + tax), event timeline |
| `FulfillmentPanel` | Tabs: Fulfill (per-item qty, carrier, tracking) / Refund (amount + reason) / Return/RMA (per-item qty + reason); existing returns list |
| `DashboardMetric` | Today + MTD + custom range simultaneously; **exact numbers** (`Intl.NumberFormat`, no rounding); role-aware visibility (`visibleMetrics` map); custom date range picker (owner/manager only) |
| `EmailLogViewer` | Status badge, template slug (monospace), recipient, sent-at, order ID; `onresend` for failed/bounced |
| `ScheduledEditPanel` | Pending edits (target, field, JSON value, scheduled-at, expires-at, cancel) and Applied edits (greyed, badge) |
| `MediaUploader` | Drag-drop + file input; per-file progress/error/retry; drag-to-reorder; `onupload: (file) => Promise<string>`; `onreorder` callback |
| `ProductForm` | Pricing (regular + compare-at), inventory (stock + SKU), organization (category + published/featured), media reorder, SEO (title/desc with char counters) |

---

## 5. Deleted POC Files

- `src/lib/PriceTag.svelte` — superseded by `PriceDisplay.svelte`
- `src/lib/ProductModal.svelte` — superseded by `ProductDetail.svelte`

---

## 6. Type System

`src/lib/type/commerce.ts` defines all domain types. Key decisions:

- **No entity copy fields on domain models.** `Product` has no `name`/`description`. Copy resolves via `localText('name', undefined, 'product', product.id)` in components.
- `Money.amount` is in **minor units** (cents). All display divides by 100.
- `StoreRole = 'owner' | 'manager' | 'cs_agent' | 'fulfillment'` — used for role-aware rendering.
- `PageInfo { page, pageSize, total }` — passed as prop; `onpagechange` callback for server-side pagination.
- `SortState { column, direction }` — passed as prop; `onsort` callback.
- Booleans use the no-prefix convention (`published`, `featured`, `active`).

---

## 7. Warnings Fixed During Rebuild

| Warning | File | Fix |
|---|---|---|
| `state_referenced_locally` (8×) | `ProductForm.svelte` | `untrack()` wrapping for all prop-initialized `$state` |
| `state_referenced_locally` (3×) | `CollectionRuleBuilder.svelte` | `untrack()` wrapping |
| `state_referenced_locally` (2×) | `FulfillmentPanel.svelte` | `untrack()` wrapping |
| `state_referenced_locally` (2×) | `DashboardMetric.svelte` | `untrack()` wrapping |
| `state_referenced_locally` (1×) | `CheckoutForm.svelte` | `untrack()` wrapping for `selectedMethod` |
| `role="listitem"` on `<button>` | `ProductDetail.svelte` | Removed invalid role; removed `role="list"` from wrapper |
| `-webkit-line-clamp` without standard | `ProductCard.svelte` | Added `line-clamp: 2` |
| `-webkit-appearance` without standard | `ProductDetail.svelte` | Added `appearance: none` |
| `-moz-appearance` without standard | `ProductDetail.svelte` | Added `appearance: textfield` |

**Final check result:** 0 errors, 1 pre-existing warning (`tsconfig.json` — cannot find `@types/node`; unrelated to this rebuild).

---

## 8. Build Status

- `svelte-check`: **0 errors** (1 pre-existing tsconfig warning)
- `vite build`: **success**
- `svelte-package`: **success** — all 22 public components + 3 internals emitted to `dist/`
- `publint`: **fails** — `svelte-hermes` is referenced as `file:../testlib/svelte-hermes-0.0.3.tgz`

The publint failure is pre-existing infrastructure, not introduced by this rebuild. See follow-up #1.

---

## 9. Decisions & Assumptions

| Decision | Rationale |
|---|---|
| CSS custom properties with sensible defaults | No Tailwind in deps; consuming apps override via `--color-primary` etc. |
| `untrack()` for form prop→state init | Forms want one-time initialization, not reactive sync. `$derived` would re-reset the form on parent re-render. |
| `Money.amount` in minor units only | Consistent with Stripe/PSP conventions; no float arithmetic in business logic |
| `localText` synchronous pattern | Per CLAUDE.md; `localText` is synchronous, usable in `aria-*`, `alt`, `placeholder` without await |
| Callback props over `createEventDispatcher` | Per CLAUDE.md Svelte 5 conventions |
| Native `<dialog>` in Modal | Accessibility baseline (focus trap, ESC, scroll lock) without a dependency |
| Early cost preview in CheckoutForm step 2 | Baymard Institute: unexpected costs at review are the #1 checkout abandonment cause |
| Fulfillment/tracking status first in CustomerOrderHistory | Stated buyer research finding: primary reason buyers visit their account |
| Exact numbers in DashboardMetric | Explicit operator requirement: no rounding/abbreviation on dashboard figures |
| `InventoryPanel` uses `LocationWithMeta` (extends `InventoryLocation`) | `InventoryLocation` only carries `id`/`storeId`; display name + thresholds are operational metadata added at the component API boundary |

---

## 10. Follow-ups for Humans

1. **`svelte-hermes` publish dependency** — currently `file:../testlib/svelte-hermes-0.0.3.tgz`. Before this package can publish to npm, move `svelte-hermes` to `peerDependencies` with a real npm semver range and add the local tgz back under `devDependencies` for development. This unblocks `publint`.

2. **`@types/node` in tsconfig** — `"types": ["node"]` in `tsconfig.json` but `@types/node` is not installed. Either add `@types/node` to devDependencies or remove the `types` array from tsconfig.

3. **RLS policies** — every new entity type (`Order`, `FulfillmentItem`, `Return`, `EmailLog`, `ScheduledEdit`, `BulkEditJob`, `InventoryLocation`) needs Row Level Security enabled and a `storeId`-scoped policy before going to production. Table creation migrations are outside the scope of this component library.

4. **Generated DB types** — `type/commerce.ts` was hand-written to match the intended schema. Once migrations run, regenerate with `supabase gen types` and reconcile any shape differences.

5. **`svelte-hermes` dictionary keys** — all `localText(...)` calls use slug keys prefixed `commerce_*` (e.g., `commerce_metric_revenue`, `commerce_error_email_required`). The consuming project must register a dictionary with these keys via `setDictionary` from `svelte-hermes`.

6. **`MediaUploader` drag-to-reorder on touch** — HTML5 drag events do not fire on touch devices. A pointer-events-based drag implementation (or a sortable library) is needed for mobile admin use.

7. **`BulkEditToolbar` undo TTL** — the `onundo` callback is wired but the toolbar has no built-in timeout on the undo offer. The consuming app should track job age and remove the undo option after a reasonable window (e.g., 5 minutes or before the scheduled apply time).

8. **`CheckoutForm` payment method rendering** — currently renders payment method names as plain text (localized via `localText`). A real implementation will need payment provider SDK integration (Stripe Elements, etc.) wired to the `onsubmit` callback.

9. **B2B / net terms payment method** — `PaymentMethod.type = 'net_terms'` is in the type, and `CheckoutForm` will render it if present in the `paymentMethods` prop. Net-terms-specific fields (PO number, credit limit check) are not yet in the payment step. Add as an extension to `CheckoutForm` when B2B checkout is prioritized.

10. **`AdminProductTable` `onduplicate`** — the prop is wired but the duplicate action performs no optimistic update. The consuming app's action handler should return quickly; consider adding a transient "Duplicating…" row state.
