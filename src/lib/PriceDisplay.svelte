<script lang="ts">
	import type { Money } from '$lib/type/commerce.js';

	let {
		price,
		compareAt = null,
		locale = 'en',
		size = 'md',
	}: {
		price: Money;
		compareAt?: Money | null;
		locale?: string;
		size?: 'sm' | 'md' | 'lg';
	} = $props();

	const formatted = $derived(
		new Intl.NumberFormat(locale, {
			style: 'currency',
			currency: price.currency,
		}).format(price.amount / 100)
	);

	const formattedCompare = $derived(
		compareAt
			? new Intl.NumberFormat(locale, {
					style: 'currency',
					currency: compareAt.currency,
				}).format(compareAt.amount / 100)
			: null
	);

	const onSale = $derived(compareAt !== null && compareAt.amount > price.amount);
</script>

<span class="price-display price-display--{size}" aria-label={onSale ? `${formatted}, was ${formattedCompare}` : formatted}>
	<span class="price-display__current {onSale ? 'price-display__current--sale' : ''}">{formatted}</span>
	{#if formattedCompare && onSale}
		<s class="price-display__compare" aria-hidden="true">{formattedCompare}</s>
	{/if}
</span>

<style>
	.price-display {
		display: inline-flex;
		align-items: baseline;
		gap: 0.375rem;
		font-variant-numeric: tabular-nums;
	}

	.price-display__current {
		font-weight: 600;
		color: var(--color-text, #111827);
	}

	.price-display__current--sale {
		color: var(--color-danger, #dc2626);
	}

	.price-display__compare {
		font-weight: 400;
		color: var(--color-muted, #9ca3af);
		text-decoration: line-through;
	}

	.price-display--sm .price-display__current { font-size: 0.8125rem; }
	.price-display--sm .price-display__compare { font-size: 0.75rem; }
	.price-display--md .price-display__current { font-size: 0.9375rem; }
	.price-display--md .price-display__compare { font-size: 0.875rem; }
	.price-display--lg .price-display__current { font-size: 1.25rem; }
	.price-display--lg .price-display__compare { font-size: 1rem; }
</style>
