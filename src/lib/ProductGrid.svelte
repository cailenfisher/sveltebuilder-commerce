<script lang="ts">
	import type { Product } from '$lib/types/commerce';
	import ProductCard from './ProductCard.svelte';
	import LocalText from '$lib/localization/LocalText.svelte';

	let {
		products,
		onselect,
	}: {
		products: Product[];
		onselect?: (product: Product) => void;
	} = $props();
</script>

{#if products.length === 0}
	<div class="py-16 text-center text-gray-400">
		<p class="text-4xl">🛍️</p>
		<p class="mt-3 text-sm"><LocalText slug="commerce_no_products" /></p>
	</div>
{:else}
	<div class="product-grid">
		{#each products as product (product.id)}
			<ProductCard {product} onclick={onselect} />
		{/each}
	</div>
{/if}
