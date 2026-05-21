<script lang="ts">
	import type { Product } from '$lib/type/commerce.js';
	import { localText } from 'svelte-hermes';
	import PriceDisplay from './PriceDisplay.svelte';
	import StockBadge from './StockBadge.svelte';

	let {
		product,
		locale = 'en',
		lowStockThreshold = 10,
		onclick,
	}: {
		product: Product;
		locale?: string;
		lowStockThreshold?: number;
		onclick?: (product: Product) => void;
	} = $props();

	const name = $derived(localText('name', undefined, 'product', product.id));
	const description = $derived(localText('description', undefined, 'product', product.id));
	const mediaUrl = $derived(product.mediaUrls[0] ?? null);
</script>

<button
	type="button"
	class="product-card"
	onclick={() => onclick?.(product)}
	aria-label={name}
>
	<div class="product-card__image">
		{#if mediaUrl}
			<img
				src={mediaUrl}
				alt={name}
				class="product-card__img"
				loading="lazy"
				decoding="async"
			/>
		{:else}
			<div class="product-card__placeholder" aria-hidden="true">
				<svg width="40" height="40" viewBox="0 0 40 40" fill="none">
					<rect width="40" height="40" rx="4" fill="#f3f4f6"/>
					<path d="M10 28l8-10 6 7 4-5 6 8H10z" fill="#d1d5db"/>
					<circle cx="27" cy="15" r="3" fill="#d1d5db"/>
				</svg>
			</div>
		{/if}

		{#if product.featured}
			<span class="product-card__badge product-card__badge--featured" aria-label={localText('commerce_featured_label')}>
				{localText('commerce_featured_label')}
			</span>
		{/if}

		{#if !product.published}
			<span class="product-card__badge product-card__badge--draft">
				{localText('commerce_draft_label')}
			</span>
		{/if}
	</div>

	<div class="product-card__body">
		<p class="product-card__name">{name}</p>
		{#if description}
			<p class="product-card__desc">{description}</p>
		{/if}
		<div class="product-card__footer">
			<PriceDisplay price={product.price} compareAt={product.compareAtPrice} {locale} />
			<StockBadge stock={product.stock} lowThreshold={lowStockThreshold} />
		</div>
	</div>
</button>

<style>
	.product-card {
		display: flex;
		flex-direction: column;
		width: 100%;
		text-align: left;
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-lg, 0.75rem);
		overflow: hidden;
		cursor: pointer;
		transition: box-shadow 0.15s, transform 0.15s;
	}

	.product-card:hover {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.product-card:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
	}

	.product-card__image {
		position: relative;
		aspect-ratio: 4/3;
		background: var(--color-surface-subtle, #f9fafb);
		overflow: hidden;
	}

	.product-card__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.product-card__placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.product-card__badge {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.product-card__badge--featured {
		background: var(--color-primary, #2563eb);
		color: #fff;
	}

	.product-card__badge--draft {
		background: var(--color-neutral-subtle, #f3f4f6);
		color: var(--color-neutral, #6b7280);
		border: 1px solid var(--color-border, #e5e7eb);
	}

	.product-card__body {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.875rem 1rem;
	}

	.product-card__name {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text, #111827);
		line-height: 1.3;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.product-card__desc {
		font-size: 0.8125rem;
		color: var(--color-muted, #6b7280);
		line-height: 1.4;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.product-card__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 0.5rem;
		flex-wrap: wrap;
	}
</style>
