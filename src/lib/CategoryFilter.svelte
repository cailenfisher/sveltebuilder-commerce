<script lang="ts">
	import type { ProductCategory } from '$lib/type/commerce.js';
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
	<button
		type="button"
		class="category-filter__btn {selected === null ? 'category-filter__btn--active' : ''}"
		onclick={() => onselect(null)}
		aria-pressed={selected === null}
	>
		{localText('commerce_all_categories')}
	</button>
	{#each categories as cat (cat.id)}
		<button
			type="button"
			class="category-filter__btn {selected === cat.id ? 'category-filter__btn--active' : ''}"
			onclick={() => onselect(cat.id)}
			aria-pressed={selected === cat.id}
		>
			{localText('category.name', undefined, 'product_category', cat.id)}
		</button>
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

	.category-filter__btn {
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 0.875rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 999px;
		background: var(--color-surface, #fff);
		color: var(--color-text-secondary, #374151);
		font-size: 0.875rem;
		white-space: nowrap;
		cursor: pointer;
		transition: background 0.12s, border-color 0.12s, color 0.12s;
	}

	.category-filter__btn:hover:not(.category-filter__btn--active) {
		background: var(--color-surface-hover, #f9fafb);
		border-color: var(--color-border-hover, #d1d5db);
	}

	.category-filter__btn--active {
		background: var(--color-primary, #2563eb);
		border-color: var(--color-primary, #2563eb);
		color: #fff;
		font-weight: 500;
	}

	.category-filter__btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
	}
</style>
