<script lang="ts">
	import type { Order, OrderStatus, PageInfo, SortState } from '$lib/type/commerce.js';
	import { Badge, Button } from 'sveltebuilder-coreui';
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

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function statusVariant(status: OrderStatus): 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'secondary' {
		if (status === 'delivered') return 'success';
		if (status === 'processing') return 'warning';
		if (status === 'cancelled' || status === 'refunded') return 'danger';
		if (status === 'confirmed' || status === 'shipped') return 'primary';
		return 'secondary';
	}
</script>

<div class="order-list">
	<!-- Status filter tabs -->
	<div class="order-list__status-filter" role="group" aria-label={localText('commerce_filter_by_status')}>
		{#each statuses as status (status ?? '__all')}
			<Button
				type="button"
				variant={statusFilter === status ? 'primary' : 'outline'}
				size="sm"
				class="order-list__filter-btn"
				onclick={() => onstatusfilter?.(status)}
				aria-pressed={statusFilter === status}
			>
				{status === null ? localText('commerce_all_orders') : localText(`commerce_order_status_${status}`)}
			</Button>
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
						<Badge variant="secondary" size="sm">{localText('commerce_guest')}</Badge>
					</span>
				{:else if order.customerId}
					<span class="order-list__customer-id">#{order.customerId}</span>
				{:else}
					<span class="order-list__muted">—</span>
				{/if}
			</td>
			<td class="data-table-td">
				<Badge variant={statusVariant(order.status)} size="md">
					{localText(`commerce_order_status_${order.status}`)}
				</Badge>
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
					<Button type="button" variant="ghost" size="xs" onclick={() => onview(order)}>
						{localText('commerce_view_order')}
					</Button>
					{#if onfulfill && (order.fulfillmentStatus === 'unfulfilled' || order.fulfillmentStatus === 'partial')}
						<Button type="button" variant="ghost" size="xs" class="order-list__action-btn--primary" onclick={() => onfulfill?.(order)}>
							{localText('commerce_fulfill_order')}
						</Button>
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
		border-radius: 999px;
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

	.order-list__customer-id {
		font-size: 0.875rem;
		color: var(--color-text, #374151);
	}

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

	.order-list__action-btn--primary {
		color: var(--color-success, #166534);
	}

	.order-list__empty {
		font-size: 0.875rem;
		color: var(--color-muted, #9ca3af);
	}
</style>
