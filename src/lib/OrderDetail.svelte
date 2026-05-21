<script lang="ts">
	import type { Order, OrderItem, OrderEvent } from '$lib/type/commerce.js';
	import { localText } from 'svelte-hermes';
	import PriceDisplay from './PriceDisplay.svelte';

	let {
		order,
		items,
		events = [],
		locale = 'en',
		loading = false,
		onstatuschange,
	}: {
		order: Order;
		items: OrderItem[];
		events?: OrderEvent[];
		locale?: string;
		loading?: boolean;
		onstatuschange?: (orderId: number, note: string) => void;
	} = $props();

	function formatDateTime(iso: string): string {
		return new Date(iso).toLocaleString(locale, {
			year: 'numeric', month: 'short', day: 'numeric',
			hour: '2-digit', minute: '2-digit',
		});
	}

	function productName(item: OrderItem): string {
		return localText('name', undefined, 'product', item.productId);
	}

	const statusBadgeClass: Record<string, string> = {
		pending:    'order-detail__status--pending',
		confirmed:  'order-detail__status--confirmed',
		processing: 'order-detail__status--processing',
		shipped:    'order-detail__status--shipped',
		delivered:  'order-detail__status--delivered',
		cancelled:  'order-detail__status--cancelled',
		refunded:   'order-detail__status--refunded',
	};
</script>

<div class="order-detail">
	{#if loading}
		<div class="order-detail__loading" aria-busy="true" aria-label={localText('commerce_loading')}>
			<div class="order-detail__skeleton order-detail__skeleton--header"></div>
			<div class="order-detail__skeleton order-detail__skeleton--section"></div>
			<div class="order-detail__skeleton order-detail__skeleton--section"></div>
		</div>
	{:else}
		<!-- Header -->
		<div class="order-detail__header">
			<div class="order-detail__header-left">
				<h2 class="order-detail__order-num">
					{localText('commerce_order_number', { id: order.id })}
				</h2>
				<time class="order-detail__date" datetime={order.createdAt}>
					{formatDateTime(order.createdAt)}
				</time>
			</div>
			<div class="order-detail__header-right">
				<span class="order-detail__status-badge {statusBadgeClass[order.status] ?? ''}">
					{localText(`commerce_order_status_${order.status}`)}
				</span>
				<span class="order-detail__fulfillment-text order-detail__fulfillment-text--{order.fulfillmentStatus}">
					{localText(`commerce_fulfillment_status_${order.fulfillmentStatus}`)}
				</span>
			</div>
		</div>

		<!-- Line items -->
		<section class="order-detail__section" aria-label={localText('commerce_order_items')}>
			<h3 class="order-detail__section-title">{localText('commerce_order_items')}</h3>
			<table class="order-detail__items-table">
				<thead>
					<tr>
						<th class="order-detail__th" scope="col">{localText('commerce_col_product')}</th>
						<th class="order-detail__th order-detail__th--num" scope="col">{localText('commerce_col_qty')}</th>
						<th class="order-detail__th order-detail__th--num" scope="col">{localText('commerce_col_unit_price')}</th>
						<th class="order-detail__th order-detail__th--num" scope="col">{localText('commerce_col_line_total')}</th>
					</tr>
				</thead>
				<tbody>
					{#each items as item (item.id)}
						<tr class="order-detail__item-row">
							<td class="order-detail__td">{productName(item)}</td>
							<td class="order-detail__td order-detail__td--num">{item.quantity}</td>
							<td class="order-detail__td order-detail__td--num">
								<PriceDisplay price={item.unitPrice} {locale} size="sm" />
							</td>
							<td class="order-detail__td order-detail__td--num">
								<PriceDisplay
									price={{ amount: item.unitPrice.amount * item.quantity, currency: item.unitPrice.currency }}
									{locale}
									size="sm"
								/>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<!-- Totals -->
			<div class="order-detail__totals">
				<div class="order-detail__total-row">
					<span>{localText('commerce_subtotal')}</span>
					<PriceDisplay price={order.subtotal} {locale} size="sm" />
				</div>
				<div class="order-detail__total-row">
					<span>{localText('commerce_shipping')}</span>
					<PriceDisplay price={order.shippingAmount} {locale} size="sm" />
				</div>
				<div class="order-detail__total-row">
					<span>{localText('commerce_tax')}</span>
					<PriceDisplay price={order.taxAmount} {locale} size="sm" />
				</div>
				<div class="order-detail__total-row order-detail__total-row--grand">
					<span>{localText('commerce_total')}</span>
					<PriceDisplay price={order.total} {locale} size="md" />
				</div>
			</div>
		</section>

		<!-- Timeline -->
		{#if events.length > 0}
			<section class="order-detail__section" aria-label={localText('commerce_order_timeline')}>
				<h3 class="order-detail__section-title">{localText('commerce_order_timeline')}</h3>
				<ol class="order-detail__timeline" reversed>
					{#each events as event (event.id)}
						<li class="order-detail__timeline-item">
							<span class="order-detail__timeline-dot" aria-hidden="true"></span>
							<div class="order-detail__timeline-body">
								<p class="order-detail__timeline-type">
									{localText(`commerce_event_type_${event.type}`, undefined, null, null) || event.type}
								</p>
								{#if event.note}
									<p class="order-detail__timeline-note">{event.note}</p>
								{/if}
								<time class="order-detail__timeline-time" datetime={event.createdAt}>
									{formatDateTime(event.createdAt)}
									{#if event.createdBy}
										· {event.createdBy}
									{/if}
								</time>
							</div>
						</li>
					{/each}
				</ol>
			</section>
		{/if}
	{/if}
</div>

<style>
	.order-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.order-detail__loading {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.order-detail__skeleton {
		background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
		background-size: 200% 100%;
		border-radius: var(--radius-sm, 0.25rem);
		animation: shimmer 1.4s infinite;
	}

	.order-detail__skeleton--header { height: 3.5rem; }
	.order-detail__skeleton--section { height: 8rem; }

	@keyframes shimmer {
		0%   { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.order-detail__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.order-detail__header-left {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.order-detail__header-right {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.order-detail__order-num {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-text, #111827);
		margin: 0;
	}

	.order-detail__date {
		font-size: 0.8125rem;
		color: var(--color-muted, #6b7280);
	}

	.order-detail__status-badge {
		display: inline-flex;
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.order-detail__status--pending    { background: #f9fafb; color: #6b7280; }
	.order-detail__status--confirmed  { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
	.order-detail__status--processing { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
	.order-detail__status--shipped    { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; }
	.order-detail__status--delivered  { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
	.order-detail__status--cancelled  { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
	.order-detail__status--refunded   { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }

	.order-detail__fulfillment-text {
		font-size: 0.8125rem;
	}

	.order-detail__fulfillment-text--unfulfilled { color: var(--color-muted, #9ca3af); }
	.order-detail__fulfillment-text--partial     { color: var(--color-warning, #92400e); }
	.order-detail__fulfillment-text--fulfilled   { color: var(--color-success, #166534); }
	.order-detail__fulfillment-text--returned    { color: var(--color-danger, #dc2626); }

	.order-detail__section {
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
		overflow: hidden;
	}

	.order-detail__section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text, #111827);
		padding: 0.75rem 1rem;
		margin: 0;
		background: var(--color-surface-subtle, #f9fafb);
		border-bottom: 1px solid var(--color-border, #e5e7eb);
	}

	.order-detail__items-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.order-detail__th {
		padding: 0.5rem 1rem;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-muted, #6b7280);
		border-bottom: 1px solid var(--color-border, #e5e7eb);
	}

	.order-detail__th--num { text-align: right; }

	.order-detail__item-row {
		border-bottom: 1px solid var(--color-border-subtle, #f3f4f6);
	}

	.order-detail__td {
		padding: 0.625rem 1rem;
		color: var(--color-text, #374151);
		vertical-align: middle;
	}

	.order-detail__td--num { text-align: right; }

	.order-detail__totals {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.875rem 1rem;
		border-top: 1px solid var(--color-border, #e5e7eb);
	}

	.order-detail__total-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
		color: var(--color-text-secondary, #374151);
	}

	.order-detail__total-row--grand {
		padding-top: 0.375rem;
		margin-top: 0.375rem;
		border-top: 1px solid var(--color-border, #e5e7eb);
		font-weight: 700;
		font-size: 0.9375rem;
		color: var(--color-text, #111827);
	}

	.order-detail__timeline {
		list-style: none;
		padding: 1rem;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.order-detail__timeline-item {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
	}

	.order-detail__timeline-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: var(--color-primary, #2563eb);
		flex-shrink: 0;
		margin-top: 0.3125rem;
	}

	.order-detail__timeline-body {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.order-detail__timeline-type {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text, #111827);
		margin: 0;
	}

	.order-detail__timeline-note {
		font-size: 0.8125rem;
		color: var(--color-text-secondary, #374151);
		margin: 0;
	}

	.order-detail__timeline-time {
		font-size: 0.75rem;
		color: var(--color-muted, #9ca3af);
	}
</style>
