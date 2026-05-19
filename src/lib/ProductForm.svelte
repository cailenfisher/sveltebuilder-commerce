<script lang="ts">
	import type { Product } from '$lib/types/commerce';
	import { categories } from '$lib/stores/commerce.svelte';
	import LocalText from '$lib/localization/LocalText.svelte';

	let {
		product = undefined,
		onsubmit,
		oncancel,
	}: {
		product?: Product;
		onsubmit: (data: Omit<Product, 'id'>) => void;
		oncancel: () => void;
	} = $props();

	let name = $state('');
	let description = $state('');
	let price = $state(0);
	let categoryId = $state(categories[0].id);
	let stock = $state(0);
	let isPublished = $state(true);
	let isFeatured = $state(false);

	$effect(() => {
		name = product?.name ?? '';
		description = product?.description ?? '';
		price = product?.price ?? 0;
		categoryId = product?.categoryId ?? categories[0].id;
		stock = product?.stock ?? 0;
		isPublished = product?.isPublished ?? true;
		isFeatured = product?.isFeatured ?? false;
	});

	let errors = $state<Record<string, string>>({});

	function validate(): boolean {
		errors = {};
		if (!name.trim()) errors.name = 'Name is required';
		if (!description.trim()) errors.description = 'Description is required';
		if (price < 0) errors.price = 'Price must be 0 or greater';
		if (stock < 0) errors.stock = 'Stock must be 0 or greater';
		return Object.keys(errors).length === 0;
	}

	function handleSubmit() {
		if (!validate()) return;
		onsubmit({ name: name.trim(), description: description.trim(), price, categoryId, stock, isPublished, isFeatured });
	}
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
	<div>
		<label class="field-label mb-1 text-gray-700" for="pf-name">
			<LocalText slug="commerce_product_name_label" />
		</label>
		<input
			id="pf-name"
			type="text"
			bind:value={name}
			class="field-control"
			placeholder="Product name"
		/>
		{#if errors.name}<p class="field-error">{errors.name}</p>{/if}
	</div>

	<div>
		<label class="field-label mb-1 text-gray-700" for="pf-desc">
			<LocalText slug="commerce_product_description_label" />
		</label>
		<textarea
			id="pf-desc"
			bind:value={description}
			class="field-control"
			rows="3"
			placeholder="Product description"
		></textarea>
		{#if errors.description}<p class="field-error">{errors.description}</p>{/if}
	</div>

	<div class="grid grid-cols-2 gap-4">
		<div>
			<label class="field-label mb-1 text-gray-700" for="pf-price">
				<LocalText slug="commerce_product_price_label" />
			</label>
			<input
				id="pf-price"
				type="number"
				bind:value={price}
				min="0"
				step="0.01"
				class="field-control"
			/>
			{#if errors.price}<p class="field-error">{errors.price}</p>{/if}
		</div>

		<div>
			<label class="field-label mb-1 text-gray-700" for="pf-stock">
				<LocalText slug="commerce_product_stock_label" />
			</label>
			<input
				id="pf-stock"
				type="number"
				bind:value={stock}
				min="0"
				class="field-control"
			/>
			{#if errors.stock}<p class="field-error">{errors.stock}</p>{/if}
		</div>
	</div>

	<div>
		<label class="field-label mb-1 text-gray-700" for="pf-category">
			<LocalText slug="commerce_product_category_label" />
		</label>
		<select id="pf-category" bind:value={categoryId} class="field-control">
			{#each categories as cat (cat.id)}
				<option value={cat.id}>{cat.name}</option>
			{/each}
		</select>
	</div>

	<div class="flex gap-6">
		<label class="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
			<input type="checkbox" bind:checked={isPublished} class="h-4 w-4 rounded border-gray-300" />
			<LocalText slug="commerce_product_published_label" />
		</label>
		<label class="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
			<input type="checkbox" bind:checked={isFeatured} class="h-4 w-4 rounded border-gray-300" />
			<LocalText slug="commerce_product_featured_label" />
		</label>
	</div>

	<div class="flex justify-end gap-2 border-t border-gray-100 pt-4">
		<button type="button" class="btn btn-secondary btn-sm" onclick={oncancel}>
			<LocalText slug="commerce_admin_cancel" />
		</button>
		<button type="submit" class="btn btn-primary btn-sm">
			<LocalText slug="commerce_admin_save" />
		</button>
	</div>
</form>
