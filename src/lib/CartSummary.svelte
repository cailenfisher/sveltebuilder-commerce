<script lang="ts">
	import type { CartItem, Money } from '$lib/type/commerce.js';
	import { localText } from 'svelte-hermes';
	import PriceDisplay from './PriceDisplay.svelte';

	let {
		items,
		subtotal,
		shippingEstimate = null,
		taxEstimate = null,
		locale = 'en',
		loading = false,
		onremove,
		onquantitychange,
		oncheckout,
	}: {
		items: CartItem[];
		subtotal: Money;
		shippingEstimate?: Money | null;
		taxEstimate?: Money | null;
		locale?: string;
		loading?: boolean;
		onremove: (productId: number, variantId: number | null) => void;
		onquantitychange: (productId: number, variantId: number | null, quantity: number) => void;
		oncheckout: () => void;
	} = $props();

	const total = $derived<Money>({
		amount:
			subtotal.amount +
			(shippingEstimate?.amount ?? 0) +
			(taxEstimate?.amount ?? 0),
		currency: subtotal.currency,
	});

	function itemName(item: CartItem): string {
		return localText('name', undefined, 'product', item.productId);
	}

	function lineTotal(item: CartItem): Money {
		return { amount: item.unitPrice.amount * item.quantity, currency: item.unitPrice.currency };
	}
</script>

<div class="cart-summary" aria-label={localText('commerce_cart')}>
	{#if loading}
		<div class="cart-summary__loading" aria-busy="true" aria-label={localText('commerce_loading')}>
			{#each { length: 3 } as _, i (i)}
				<div class="cart-summary__skeleton" aria-hidden="true"></div>
			{/each}
		</div>
	{:else if items.length === 0}
		<div class="cart-summary__empty" role="status">
			<svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
				<circle cx="24" cy="24" r="20" fill="#f3f4f6"/>
				<path d="M14 16h3l4 12h12l3-9H18" stroke="#d1d5db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
				<circle cx="20" cy="32" r="2" fill="#d1d5db"/>
				<circle cx="30" cy="32" r="2" fill="#d1d5db"/>
			</svg>
			<p class="cart-summary__empty-text">{localText('commerce_cart_empty')}</p>
		</div>
	{:else}
		<ul class="cart-summary__items" aria-label={localText('commerce_cart_items')}>
			{#each items as item (`${item.productId}-${item.variantId ?? 'default'}`)}
				<li class="cart-summary__item">
					{#if item.mediaUrl}
						<img
							src={item.mediaUrl}
							alt=""
							class="cart-summary__item-image"
							loading="lazy"
							decoding="async"
						/>
					{:else}
						<div class="cart-summary__item-placeholder" aria-hidden="true"></div>
					{/if}

					<div class="cart-summary__item-body">
						<p class="cart-summary__item-name">{itemName(item)}</p>
						<PriceDisplay price={item.unitPrice} {locale} size="sm" />
					</div>

					<div class="cart-summary__item-qty">
						<button
							type="button"
							class="cart-summary__qty-btn"
							onclick={() => {
								if (item.quantity <= 1) {
									onremove(item.productId, item.variantId);
								} else {
									onquantitychange(item.productId, item.variantId, item.quantity - 1);
								}
							}}
							aria-label={localText('commerce_decrease_quantity')}
						>−</button>
						<span class="cart-summary__qty-value" aria-label={localText('commerce_quantity_n', { n: item.quantity })}>
							{item.quantity}
						</span>
						<button
							type="button"
							class="cart-summary__qty-btn"
							onclick={() => onquantitychange(item.productId, item.variantId, item.quantity + 1)}
							aria-label={localText('commerce_increase_quantity')}
						>+</button>
					</div>

					<div class="cart-summary__item-total">
						<PriceDisplay price={lineTotal(item)} {locale} size="sm" />
					</div>

					<button
						type="button"
						class="cart-summary__remove-btn"
						onclick={() => onremove(item.productId, item.variantId)}
						aria-label={localText('commerce_remove_item', { name: itemName(item) })}
					>
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
							<path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
						</svg>
					</button>
				</li>
			{/each}
		</ul>

		<!-- Totals -->
		<div class="cart-summary__totals">
			<div class="cart-summary__total-row">
				<span>{localText('commerce_subtotal')}</span>
				<PriceDisplay price={subtotal} {locale} size="sm" />
			</div>
			<div class="cart-summary__total-row">
				<span>{localText('commerce_shipping')}</span>
				{#if shippingEstimate}
					<PriceDisplay price={shippingEstimate} {locale} size="sm" />
				{:else}
					<span class="cart-summary__estimate-hint">{localText('commerce_calculated_at_checkout')}</span>
				{/if}
			</div>
			<div class="cart-summary__total-row">
				<span>{localText('commerce_tax')}</span>
				{#if taxEstimate}
					<PriceDisplay price={taxEstimate} {locale} size="sm" />
				{:else}
					<span class="cart-summary__estimate-hint">{localText('commerce_calculated_at_checkout')}</span>
				{/if}
			</div>
			<div class="cart-summary__total-row cart-summary__total-row--grand">
				<span>{localText('commerce_total')}</span>
				<PriceDisplay price={total} {locale} size="md" />
			</div>
		</div>

		<button
			type="button"
			class="cart-summary__checkout-btn"
			onclick={oncheckout}
		>
			{localText('commerce_proceed_to_checkout')}
		</button>
	{/if}
</div>

<style>
	.cart-summary {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.cart-summary__loading {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.cart-summary__skeleton {
		height: 4rem;
		border-radius: var(--radius-sm, 0.25rem);
		background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
		background-size: 200% 100%;
		animation: shimmer 1.4s infinite;
	}

	@keyframes shimmer {
		0%   { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.cart-summary__empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 3rem 1rem;
		text-align: center;
	}

	.cart-summary__empty-text {
		font-size: 0.9375rem;
		color: var(--color-muted, #6b7280);
		margin: 0;
	}

	.cart-summary__items {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.cart-summary__item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 0;
		border-bottom: 1px solid var(--color-border-subtle, #f3f4f6);
	}

	.cart-summary__item:last-child {
		border-bottom: none;
	}

	.cart-summary__item-image {
		width: 3.5rem;
		height: 3.5rem;
		object-fit: cover;
		border-radius: var(--radius-sm, 0.25rem);
		border: 1px solid var(--color-border, #e5e7eb);
		flex-shrink: 0;
	}

	.cart-summary__item-placeholder {
		width: 3.5rem;
		height: 3.5rem;
		background: var(--color-surface-subtle, #f9fafb);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
		flex-shrink: 0;
	}

	.cart-summary__item-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.cart-summary__item-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text, #111827);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin: 0;
	}

	.cart-summary__item-qty {
		display: flex;
		align-items: center;
		gap: 0;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
		overflow: hidden;
	}

	.cart-summary__qty-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		background: var(--color-surface-subtle, #f9fafb);
		border: none;
		font-size: 0.875rem;
		cursor: pointer;
		color: var(--color-text, #374151);
		transition: background 0.1s;
	}

	.cart-summary__qty-btn:hover {
		background: var(--color-surface-hover, #f3f4f6);
	}

	.cart-summary__qty-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: -2px;
	}

	.cart-summary__qty-value {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 1.75rem;
		font-size: 0.875rem;
		border-left: 1px solid var(--color-border, #e5e7eb);
		border-right: 1px solid var(--color-border, #e5e7eb);
		font-variant-numeric: tabular-nums;
	}

	.cart-summary__item-total {
		min-width: 4.5rem;
		text-align: right;
	}

	.cart-summary__remove-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border: none;
		background: none;
		color: var(--color-muted, #9ca3af);
		cursor: pointer;
		border-radius: var(--radius-sm, 0.25rem);
		transition: color 0.1s, background 0.1s;
	}

	.cart-summary__remove-btn:hover {
		color: var(--color-danger, #dc2626);
		background: var(--color-danger-subtle, #fef2f2);
	}

	.cart-summary__remove-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 1px;
	}

	.cart-summary__totals {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border, #e5e7eb);
	}

	.cart-summary__total-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
		color: var(--color-text-secondary, #374151);
	}

	.cart-summary__total-row--grand {
		padding-top: 0.375rem;
		margin-top: 0.375rem;
		border-top: 1px solid var(--color-border, #e5e7eb);
		font-weight: 700;
		font-size: 0.9375rem;
		color: var(--color-text, #111827);
	}

	.cart-summary__estimate-hint {
		font-size: 0.75rem;
		color: var(--color-muted, #9ca3af);
		font-style: italic;
	}

	.cart-summary__checkout-btn {
		width: 100%;
		height: 2.75rem;
		background: var(--color-primary, #2563eb);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.12s;
	}

	.cart-summary__checkout-btn:hover {
		background: var(--color-primary-hover, #1d4ed8);
	}

	.cart-summary__checkout-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
	}
</style>
