<script lang="ts">
	import type { Order, OrderStatus, PageInfo, SortState } from '$lib/type/commerce.js';
	import { localText } from 'svelte-hermes';
	import DataTable from './internal/DataTable.svelte';
	import PriceDisplay from './PriceDisplay.svelte';

	let {
		orders,
		loading = false,
		locale = 'en',
		pageInfo,
		sort,
		statusFilter = null,
		selectedIds = [],
		onpagechange,
		onsort,
		onselect,
		onstatusfilter,
		onview,
		onfulfill,
	}: {
		orders: Order[];
		loading?: boolean;
		locale?: string;
		pageInfo?: PageInfo;
		sort?: SortState;
		statusFilter?: OrderStatus | null;
		selectedIds?: number[];
		onpagechange?: (page: number) => void;
		onsort?: (col: string) => void;
		onselect?: (ids: number[]) => void;
		onstatusfilter?: (status: OrderStatus | null) => void;
		onview: (order: Order) => void;
		onfulfill?: (order: Order) => void;
	} = $props();

	const statuses: (OrderStatus | null)[] = [null, 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

	const columns = [
		{ key: 'id', label: localText('commerce_col_order_id'), sortable: true },
		{ key: 'createdAt', label: localText('commerce_col_date'), sortable: true },
		{ key: 'customer', label: localText('commerce_col_customer'), sortable: false },
		{ key: 'status', label: localText('commerce_col_status'), sortable: true },
		{ key: 'fulfillmentStatus', label: localText('commerce_col_fulfillment'), sortable: false },
		{ key: 'total', label: localText('commerce_col_total'), sortable: true },
		{ key: 'actions', label: '', sortable: false },
	];

	const statusBadgeClass: Record<OrderStatus, string> = {
		pending:    'order-list__badge--pending',
		confirmed:  'order-list__badge--confirmed',
		processing: 'order-list__badge--processing',
		shipped:    'order-list__badge--shipped',
		delivered:  'order-list__badge--delivered',
		cancelled:  'order-list__badge--cancelled',
		refunded:   'order-list__badge--refunded',
	};

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
	}
</script>

<div class="order-list">
	<!-- Status filter tabs -->
	<div class="order-list__status-filter" role="group" aria-label={localText('commerce_filter_by_status')}>
		{#each statuses as status (status ?? '__all')}
			<button
				type="button"
				class="order-list__filter-btn {statusFilter === status ? 'order-list__filter-btn--active' : ''}"
				onclick={() => onstatusfilter?.(status)}
				aria-pressed={statusFilter === status}
			>
				{status === null ? localText('commerce_all_orders') : localText(`commerce_order_status_${status}`)}
			</button>
		{/each}
	</div>

	<DataTable
		items={orders}
		{columns}
		{loading}
		{pageInfo}
		{sort}
		{selectedIds}
		{onpagechange}
		{onsort}
		{onselect}
	>
		{#snippet row(order)}
			<td class="data-table-td order-list__id">
				<button type="button" class="order-list__id-link" onclick={() => onview(order)}>
					#{order.id}
				</button>
			</td>
			<td class="data-table-td order-list__muted">
				{formatDate(order.createdAt)}
			</td>
			<td class="data-table-td">
				{#if order.guestEmail}
					<span class="order-list__guest">
						{order.guestEmail}
						<span class="order-list__guest-tag">{localText('commerce_guest')}</span>
					</span>
				{:else if order.customerId}
					<span class="order-list__customer-id">#{order.customerId}</span>
				{:else}
					<span class="order-list__muted">—</span>
				{/if}
			</td>
			<td class="data-table-td">
				<span class="order-list__badge {statusBadgeClass[order.status]}">
					{localText(`commerce_order_status_${order.status}`)}
				</span>
			</td>
			<td class="data-table-td">
				<span class="order-list__fulfillment-text order-list__fulfillment-text--{order.fulfillmentStatus}">
					{localText(`commerce_fulfillment_status_${order.fulfillmentStatus}`)}
				</span>
			</td>
			<td class="data-table-td">
				<PriceDisplay price={order.total} {locale} size="sm" />
			</td>
			<td class="data-table-td order-list__actions-cell">
				<div class="order-list__actions">
					<button type="button" class="order-list__action-btn" onclick={() => onview(order)}>
						{localText('commerce_view_order')}
					</button>
					{#if onfulfill && (order.fulfillmentStatus === 'unfulfilled' || order.fulfillmentStatus === 'partial')}
						<button type="button" class="order-list__action-btn order-list__action-btn--primary" onclick={() => onfulfill?.(order)}>
							{localText('commerce_fulfill_order')}
						</button>
					{/if}
				</div>
			</td>
		{/snippet}

		{#snippet emptyState()}
			<div class="order-list__empty">
				<p>{localText('commerce_no_orders')}</p>
			</div>
		{/snippet}
	</DataTable>
</div>

<style>
	.order-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.order-list__status-filter {
		display: flex;
		gap: 0.25rem;
		overflow-x: auto;
		scrollbar-width: none;
		padding-bottom: 2px;
	}

	.order-list__status-filter::-webkit-scrollbar { display: none; }

	.order-list__filter-btn {
		white-space: nowrap;
		padding: 0.375rem 0.75rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 999px;
		background: var(--color-surface, #fff);
		color: var(--color-text-secondary, #374151);
		font-size: 0.8125rem;
		cursor: pointer;
		transition: background 0.12s, border-color 0.12s;
	}

	.order-list__filter-btn:hover:not(.order-list__filter-btn--active) {
		background: var(--color-surface-hover, #f9fafb);
	}

	.order-list__filter-btn--active {
		background: var(--color-primary, #2563eb);
		border-color: var(--color-primary, #2563eb);
		color: #fff;
		font-weight: 500;
	}

	.order-list__filter-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
	}

	.order-list__id {
		font-weight: 500;
	}

	.order-list__id-link {
		background: none;
		border: none;
		padding: 0;
		font-size: inherit;
		font-weight: 600;
		color: var(--color-primary, #2563eb);
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.order-list__id-link:hover {
		color: var(--color-primary-hover, #1d4ed8);
	}

	.order-list__id-link:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
		border-radius: 2px;
	}

	.order-list__muted {
		color: var(--color-muted, #6b7280);
		font-size: 0.875rem;
	}

	.order-list__guest {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
	}

	.order-list__guest-tag {
		font-size: 0.6875rem;
		padding: 0.0625rem 0.375rem;
		border-radius: 999px;
		background: var(--color-neutral-subtle, #f3f4f6);
		color: var(--color-neutral, #6b7280);
	}

	.order-list__customer-id {
		font-size: 0.875rem;
		color: var(--color-text, #374151);
	}

	.order-list__badge {
		display: inline-flex;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.order-list__badge--pending    { background: #f9fafb; color: #6b7280; }
	.order-list__badge--confirmed  { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
	.order-list__badge--processing { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
	.order-list__badge--shipped    { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; }
	.order-list__badge--delivered  { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
	.order-list__badge--cancelled  { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
	.order-list__badge--refunded   { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }

	.order-list__fulfillment-text {
		font-size: 0.8125rem;
	}

	.order-list__fulfillment-text--unfulfilled { color: var(--color-muted, #9ca3af); }
	.order-list__fulfillment-text--partial     { color: var(--color-warning, #92400e); }
	.order-list__fulfillment-text--fulfilled   { color: var(--color-success, #166534); }
	.order-list__fulfillment-text--returned    { color: var(--color-danger, #dc2626); }

	.order-list__actions-cell {
		text-align: right;
	}

	.order-list__actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.order-list__action-btn {
		background: none;
		border: none;
		padding: 0;
		font-size: 0.8125rem;
		color: var(--color-primary, #2563eb);
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.order-list__action-btn:hover {
		color: var(--color-primary-hover, #1d4ed8);
	}

	.order-list__action-btn--primary {
		color: var(--color-success, #166534);
	}

	.order-list__action-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
		border-radius: 2px;
	}

	.order-list__empty {
		font-size: 0.875rem;
		color: var(--color-muted, #9ca3af);
	}
</style>
