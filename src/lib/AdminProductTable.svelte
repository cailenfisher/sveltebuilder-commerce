<script lang="ts">
	import type { Product } from '$lib/types/commerce';
	import { categoryMeta, getCategoryName } from '$lib/stores/commerce.svelte';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import PriceTag from './PriceTag.svelte';
	import StockBadge from './StockBadge.svelte';
	import LocalText from '$lib/localization/LocalText.svelte';

	let {
		products,
		onedit,
		ondelete,
	}: {
		products: Product[];
		onedit: (product: Product) => void;
		ondelete: (product: Product) => void;
	} = $props();

	const columns = [
		{ key: 'name' as const, label: 'Product', sortable: true },
		{ key: 'categoryId' as const, label: 'Category', sortable: true },
		{ key: 'price' as const, label: 'Price', sortable: true },
		{ key: 'stock' as const, label: 'Stock', sortable: true },
		{ key: 'isPublished' as const, label: 'Published', sortable: false },
		{ key: 'id' as const, label: '', sortable: false },
	];

	function filterFn(item: Product, query: string): boolean {
		const q = query.toLowerCase();
		return (
			item.name.toLowerCase().includes(q) ||
			getCategoryName(item.categoryId).toLowerCase().includes(q)
		);
	}
</script>

<DataTable items={products} {columns} {filterFn}>
	{#snippet row(product)}
		<tr class="data-table-row">
			<td class="data-table-td">
				<div class="flex items-center gap-3">
					<div
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded text-base {categoryMeta[product.categoryId]?.bg ?? 'bg-gray-100'}"
					>
						{categoryMeta[product.categoryId]?.emoji ?? '📦'}
					</div>
					<div>
						<p class="font-medium text-gray-900">{product.name}</p>
						{#if product.isFeatured}
							<span class="text-xs text-blue-500">★ <LocalText slug="commerce_featured_label" /></span>
						{/if}
					</div>
				</div>
			</td>
			<td class="data-table-td text-gray-600">{getCategoryName(product.categoryId)}</td>
			<td class="data-table-td"><PriceTag price={product.price} /></td>
			<td class="data-table-td"><StockBadge stock={product.stock} /></td>
			<td class="data-table-td">
				{#if product.isPublished}
					<span class="badge badge-green"><LocalText slug="commerce_published_yes" /></span>
				{:else}
					<span class="badge badge-gray"><LocalText slug="commerce_published_no" /></span>
				{/if}
			</td>
			<td class="data-table-td">
				<div class="flex items-center justify-end gap-3">
					<button type="button" class="link-action" onclick={() => onedit(product)}>
						<LocalText slug="commerce_admin_edit" />
					</button>
					<button type="button" class="link-action-danger" onclick={() => ondelete(product)}>
						<LocalText slug="commerce_admin_delete" />
					</button>
				</div>
			</td>
		</tr>
	{/snippet}
	{#snippet emptyState()}
		<LocalText slug="commerce_no_products" />
	{/snippet}
</DataTable>
