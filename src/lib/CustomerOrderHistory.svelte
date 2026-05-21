<script lang="ts">
	import type { Order, OrderItem, Return, PageInfo } from '$lib/type/commerce.js';
	import { localText } from 'svelte-hermes';
	import PriceDisplay from './PriceDisplay.svelte';
	import Pagination from './internal/Pagination.svelte';

	let {
		orders,
		loading = false,
		locale = 'en',
		pageInfo,
		onpagechange,
		onvieworder,
		onreorder,
		oninitatereturn,
	}: {
		orders: Order[];
		loading?: boolean;
		locale?: string;
		pageInfo?: PageInfo;
		onpagechange?: (page: number) => void;
		onvieworder: (order: Order) => void;
		onreorder?: (order: Order) => void;
		oninitatereturn?: (order: Order) => void;
	} = $props();

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString(locale, {
			year: 'numeric', month: 'long', day: 'numeric',
		});
	}
</script>

<div class="customer-order-history">
	<h2 class="customer-order-history__title">{localText('commerce_order_history_title')}</h2>

	{#if loading}
		<div class="customer-order-history__loading" aria-busy="true" aria-label={localText('commerce_loading')}>
			{#each { length: 3 } as _, i (i)}
				<div class="customer-order-history__skeleton" aria-hidden="true"></div>
			{/each}
		</div>
	{:else if orders.length === 0}
		<div class="customer-order-history__empty" role="status">
			<svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
				<circle cx="24" cy="24" r="20" fill="#f3f4f6"/>
				<rect x="14" y="16" width="20" height="16" rx="2" stroke="#d1d5db" stroke-width="2" fill="none"/>
				<path d="M18 22h12M18 26h8" stroke="#d1d5db" stroke-width="2" stroke-linecap="round"/>
			</svg>
			<p class="customer-order-history__empty-text">{localText('commerce_no_orders_yet')}</p>
		</div>
	{:else}
		<ol class="customer-order-history__list" aria-label={localText('commerce_order_history_title')}>
			{#each orders as order (order.id)}
				<li class="customer-order-history__order">
					<!-- Order header — tracking status is primary/first -->
					<div class="customer-order-history__order-header">
						<div class="customer-order-history__order-id-group">
							<button
								type="button"
								class="customer-order-history__order-link"
								onclick={() => onvieworder(order)}
							>
								{localText('commerce_order_number', { id: order.id })}
							</button>
							<time class="customer-order-history__date" datetime={order.createdAt}>
								{formatDate(order.createdAt)}
							</time>
						</div>

						<!-- Fulfillment/tracking status is prominently shown first -->
						<span
							class="customer-order-history__fulfillment customer-order-history__fulfillment--{order.fulfillmentStatus}"
							role="status"
						>
							{localText(`commerce_fulfillment_status_${order.fulfillmentStatus}`)}
						</span>
					</div>

					<div class="customer-order-history__order-meta">
						<span class="customer-order-history__status-badge customer-order-history__status-badge--{order.status}">
							{localText(`commerce_order_status_${order.status}`)}
						</span>
						<PriceDisplay price={order.total} {locale} size="sm" />
					</div>

					<div class="customer-order-history__order-actions">
						<button
							type="button"
							class="customer-order-history__action-btn customer-order-history__action-btn--primary"
							onclick={() => onvieworder(order)}
						>
							{localText('commerce_view_order')}
						</button>
						{#if onreorder && order.status === 'delivered'}
							<button
								type="button"
								class="customer-order-history__action-btn"
								onclick={() => onreorder?.(order)}
							>
								{localText('commerce_reorder')}
							</button>
						{/if}
						{#if oninitatereturn && order.status === 'delivered'}
							<button
								type="button"
								class="customer-order-history__action-btn"
								onclick={() => oninitatereturn?.(order)}
							>
								{localText('commerce_return_items')}
							</button>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	{/if}

	{#if pageInfo && onpagechange}
		<Pagination {pageInfo} onchange={onpagechange} />
	{/if}
</div>

<style>
	.customer-order-history {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.customer-order-history__title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text, #111827);
		margin: 0;
	}

	.customer-order-history__loading {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.customer-order-history__skeleton {
		height: 5.5rem;
		border-radius: var(--radius-sm, 0.25rem);
		background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
		background-size: 200% 100%;
		animation: shimmer 1.4s infinite;
	}

	@keyframes shimmer {
		0%   { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.customer-order-history__empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 3rem 1rem;
		text-align: center;
	}

	.customer-order-history__empty-text {
		font-size: 0.9375rem;
		color: var(--color-muted, #6b7280);
		margin: 0;
	}

	.customer-order-history__list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.customer-order-history__order {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem 0;
		border-bottom: 1px solid var(--color-border-subtle, #f3f4f6);
	}

	.customer-order-history__order:first-child {
		border-top: 1px solid var(--color-border, #e5e7eb);
	}

	.customer-order-history__order-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.customer-order-history__order-id-group {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.customer-order-history__order-link {
		background: none;
		border: none;
		padding: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-primary, #2563eb);
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
		text-align: left;
	}

	.customer-order-history__order-link:hover {
		color: var(--color-primary-hover, #1d4ed8);
	}

	.customer-order-history__order-link:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
		border-radius: 2px;
	}

	.customer-order-history__date {
		font-size: 0.8125rem;
		color: var(--color-muted, #9ca3af);
	}

	.customer-order-history__fulfillment {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.customer-order-history__fulfillment--unfulfilled { color: var(--color-muted, #9ca3af); }
	.customer-order-history__fulfillment--partial     { color: var(--color-warning, #92400e); }
	.customer-order-history__fulfillment--fulfilled   { color: var(--color-success, #166534); }
	.customer-order-history__fulfillment--returned    { color: var(--color-danger, #dc2626); }

	.customer-order-history__order-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.customer-order-history__status-badge {
		display: inline-flex;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.customer-order-history__status-badge--pending    { background: #f9fafb; color: #6b7280; }
	.customer-order-history__status-badge--confirmed  { background: #eff6ff; color: #1d4ed8; }
	.customer-order-history__status-badge--processing { background: #fffbeb; color: #92400e; }
	.customer-order-history__status-badge--shipped    { background: #f0f9ff; color: #0369a1; }
	.customer-order-history__status-badge--delivered  { background: #f0fdf4; color: #166534; }
	.customer-order-history__status-badge--cancelled  { background: #fef2f2; color: #dc2626; }
	.customer-order-history__status-badge--refunded   { background: #f5f3ff; color: #6d28d9; }

	.customer-order-history__order-actions {
		display: flex;
		gap: 0.625rem;
		flex-wrap: wrap;
	}

	.customer-order-history__action-btn {
		height: 2rem;
		padding: 0 0.875rem;
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.8125rem;
		cursor: pointer;
		transition: background 0.1s;
	}

	.customer-order-history__action-btn {
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #d1d5db);
		color: var(--color-text, #374151);
	}

	.customer-order-history__action-btn:hover {
		background: var(--color-surface-hover, #f9fafb);
	}

	.customer-order-history__action-btn--primary {
		background: var(--color-primary-subtle, #eff6ff);
		border-color: var(--color-primary-border, #bfdbfe);
		color: var(--color-primary, #1d4ed8);
		font-weight: 500;
	}

	.customer-order-history__action-btn--primary:hover {
		background: #dbeafe;
	}

	.customer-order-history__action-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
	}
</style>
