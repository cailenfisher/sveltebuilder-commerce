<script lang="ts">
	import type { Product } from '$lib/types/commerce';
	import { categoryMeta } from '$lib/stores/commerce.svelte';
	import PriceTag from './PriceTag.svelte';
	import StockBadge from './StockBadge.svelte';
	import LocalText from '$lib/localization/LocalText.svelte';

	let {
		product,
		onclick,
	}: {
		product: Product;
		onclick?: (product: Product) => void;
	} = $props();

	const meta = $derived(categoryMeta[product.categoryId] ?? { bg: 'bg-gray-100', emoji: '📦' });
</script>

<button
	type="button"
	class="product-card text-left"
	onclick={() => onclick?.(product)}
	aria-label={product.name}
>
	<div class="product-card-image {meta.bg}">
		<span class="text-5xl" aria-hidden="true">{meta.emoji}</span>
	</div>

	{#if product.isFeatured}
		<div class="px-4 pt-3">
			<span class="badge badge-blue"><LocalText slug="commerce_featured_label" /></span>
		</div>
	{/if}

	<div class="product-card-body {!product.isFeatured ? 'pt-3' : ''}">
		<p class="product-card-name">{product.name}</p>
		<p class="product-card-desc">{product.description}</p>
		<div class="product-card-footer">
			<PriceTag price={product.price} />
			<StockBadge stock={product.stock} />
		</div>
	</div>
</button>
