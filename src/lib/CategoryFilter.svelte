<script lang="ts">
	import type { ProductCategory } from '$lib/type/commerce.js';
	import { Button } from 'sveltebuilder-coreui';
	import { localText } from 'svelte-hermes';

	let {
		categories,
		selected = null,
		onselect,
	}: {
		categories: ProductCategory[];
		selected?: number | null;
		onselect: (categoryId: number | null) => void;
	} = $props();
</script>

<div class="category-filter" role="group" aria-label={localText('commerce_filter_by_category')}>
	<Button
		type="button"
		variant={selected === null ? 'primary' : 'outline'}
		size="sm"
		class="category-filter__btn"
		onclick={() => onselect(null)}
		aria-pressed={selected === null}
	>
		{localText('commerce_all_categories')}
	</Button>
	{#each categories as cat (cat.id)}
		<Button
			type="button"
			variant={selected === cat.id ? 'primary' : 'outline'}
			size="sm"
			class="category-filter__btn"
			onclick={() => onselect(cat.id)}
			aria-pressed={selected === cat.id}
		>
			{localText('category.name', undefined, 'product_category', cat.id)}
		</Button>
	{/each}
</div>

<style>
	.category-filter {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		padding-bottom: 2px;
		scrollbar-width: none;
	}

	.category-filter::-webkit-scrollbar {
		display: none;
	}

	:global(.category-filter__btn) {
		border-radius: 999px;
		white-space: nowrap;
	}
</style>
