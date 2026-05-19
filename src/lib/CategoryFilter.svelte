<script lang="ts">
	import type { ProductCategory } from '$lib/types/commerce';
	import LocalText from '$lib/localization/LocalText.svelte';

	let {
		categories,
		selected,
		onselect,
	}: {
		categories: ProductCategory[];
		selected: string | null;
		onselect: (categoryId: string | null) => void;
	} = $props();
</script>

<div class="category-filter" role="group" aria-label="Filter by category">
	<button
		type="button"
		class="category-btn {selected === null ? 'category-btn-active' : 'category-btn-inactive'}"
		onclick={() => onselect(null)}
	>
		<LocalText slug="commerce_all_categories" />
	</button>
	{#each categories as cat (cat.id)}
		<button
			type="button"
			class="category-btn {selected === cat.id ? 'category-btn-active' : 'category-btn-inactive'}"
			onclick={() => onselect(cat.id)}
		>
			{cat.name}
		</button>
	{/each}
</div>
