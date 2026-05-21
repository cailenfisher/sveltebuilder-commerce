<script lang="ts">
	import type { Product, PageInfo } from '$lib/type/commerce.js';
	import { localText } from 'svelte-hermes';
	import ProductCard from './ProductCard.svelte';
	import Pagination from './internal/Pagination.svelte';

	let {
		products,
		loading = false,
		locale = 'en',
		lowStockThreshold = 10,
		pageInfo,
		onpagechange,
		onselect,
	}: {
		products: Product[];
		loading?: boolean;
		locale?: string;
		lowStockThreshold?: number;
		pageInfo?: PageInfo;
		onpagechange?: (page: number) => void;
		onselect?: (product: Product) => void;
	} = $props();
</script>

<div class="product-grid-wrap">
	{#if loading}
		<div class="product-grid" aria-busy="true" aria-label={localText('commerce_loading')}>
			{#each { length: 6 } as _, i (i)}
				<div class="product-grid__skeleton" aria-hidden="true">
					<div class="skeleton skeleton--image"></div>
					<div class="skeleton skeleton--title"></div>
					<div class="skeleton skeleton--subtitle"></div>
				</div>
			{/each}
		</div>
	{:else if products.length === 0}
		<div class="product-grid__empty" role="status">
			<svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
				<circle cx="24" cy="24" r="20" fill="#f3f4f6"/>
				<path d="M16 30l8-10 6 7 4-5 6 8H16z" fill="#d1d5db"/>
				<circle cx="33" cy="18" r="3" fill="#d1d5db"/>
			</svg>
			<p class="product-grid__empty-text">{localText('commerce_no_products')}</p>
		</div>
	{:else}
		<div class="product-grid">
			{#each products as product (product.id)}
				<ProductCard {product} {locale} {lowStockThreshold} onclick={onselect} />
			{/each}
		</div>
	{/if}

	{#if pageInfo && onpagechange}
		<Pagination {pageInfo} onchange={onpagechange} />
	{/if}
</div>

<style>
	.product-grid-wrap {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.product-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
		gap: 1rem;
	}

	.product-grid__skeleton {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-lg, 0.75rem);
		overflow: hidden;
		padding: 0 0 0.875rem;
	}

	.product-grid__empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 4rem 1rem;
		text-align: center;
	}

	.product-grid__empty-text {
		font-size: 0.875rem;
		color: var(--color-muted, #9ca3af);
	}

	.skeleton {
		border-radius: var(--radius-sm, 0.25rem);
		background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
		background-size: 200% 100%;
		animation: shimmer 1.4s infinite;
	}

	.skeleton--image {
		aspect-ratio: 4/3;
		border-radius: 0;
	}

	.skeleton--title {
		height: 1rem;
		width: 75%;
		margin: 0 0.875rem;
	}

	.skeleton--subtitle {
		height: 0.875rem;
		width: 55%;
		margin: 0 0.875rem;
	}

	@keyframes shimmer {
		0%   { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}
</style>
