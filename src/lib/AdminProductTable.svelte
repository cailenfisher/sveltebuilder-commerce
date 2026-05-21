<script lang="ts">
	import type { Product, ProductCategory, PageInfo, SortState } from '$lib/type/commerce.js';
	import { localText } from 'svelte-hermes';
	import DataTable from './internal/DataTable.svelte';
	import PriceDisplay from './PriceDisplay.svelte';
	import StockBadge from './StockBadge.svelte';

	let {
		products,
		categories,
		loading = false,
		locale = 'en',
		pageInfo,
		sort,
		selectedIds = [],
		onpagechange,
		onsort,
		onselect,
		onedit,
		ondelete,
		onduplicate,
	}: {
		products: Product[];
		categories: ProductCategory[];
		loading?: boolean;
		locale?: string;
		pageInfo?: PageInfo;
		sort?: SortState;
		selectedIds?: number[];
		onpagechange?: (page: number) => void;
		onsort?: (col: string) => void;
		onselect?: (ids: number[]) => void;
		onedit: (product: Product) => void;
		ondelete: (product: Product) => void;
		onduplicate?: (product: Product) => void;
	} = $props();

	const columns = [
		{ key: 'name', label: localText('commerce_col_product'), sortable: true },
		{ key: 'categoryId', label: localText('commerce_col_category'), sortable: true },
		{ key: 'price', label: localText('commerce_col_price'), sortable: true },
		{ key: 'stock', label: localText('commerce_col_stock'), sortable: true },
		{ key: 'published', label: localText('commerce_col_status'), sortable: false },
		{ key: 'actions', label: '', sortable: false },
	];

	const categoryMap = $derived(
		new Map(categories.map(c => [c.id, c]))
	);

	function categoryName(id: number | null): string {
		if (id === null) return '—';
		const cat = categoryMap.get(id);
		if (!cat) return '—';
		return localText('name', undefined, 'product_category', cat.id);
	}

	function productName(product: Product): string {
		return localText('name', undefined, 'product', product.id);
	}
</script>

<DataTable
	items={products}
	{columns}
	{loading}
	{pageInfo}
	{sort}
	{selectedIds}
	{onpagechange}
	{onsort}
	{onselect}
>
	{#snippet row(product)}
		<td class="data-table-td">
			<div class="admin-product-table__name-cell">
				<div class="admin-product-table__thumb">
					{#if product.mediaUrls[0]}
						<img
							src={product.mediaUrls[0]}
							alt=""
							class="admin-product-table__img"
							loading="lazy"
							decoding="async"
						/>
					{:else}
						<div class="admin-product-table__img-placeholder" aria-hidden="true">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<path d="M2 12l4-5 3 4 2-3 4 4H2z" fill="#d1d5db"/>
								<circle cx="11" cy="5" r="2" fill="#d1d5db"/>
							</svg>
						</div>
					{/if}
				</div>
				<div>
					<p class="admin-product-table__product-name">{productName(product)}</p>
					{#if product.sku}
						<p class="admin-product-table__sku">SKU: {product.sku}</p>
					{/if}
					{#if product.featured}
						<span class="admin-product-table__featured-dot" aria-label={localText('commerce_featured_label')}>★</span>
					{/if}
				</div>
			</div>
		</td>
		<td class="data-table-td admin-product-table__muted">
			{categoryName(product.categoryId)}
		</td>
		<td class="data-table-td">
			<PriceDisplay price={product.price} compareAt={product.compareAtPrice} {locale} size="sm" />
		</td>
		<td class="data-table-td">
			<StockBadge stock={product.stock} />
		</td>
		<td class="data-table-td">
			{#if product.published}
				<span class="admin-product-table__badge admin-product-table__badge--live">
					{localText('commerce_published_yes')}
				</span>
			{:else}
				<span class="admin-product-table__badge admin-product-table__badge--draft">
					{localText('commerce_published_no')}
				</span>
			{/if}
		</td>
		<td class="data-table-td admin-product-table__actions-cell">
			<div class="admin-product-table__actions">
				<button
					type="button"
					class="admin-product-table__action-btn"
					onclick={() => onedit(product)}
				>
					{localText('commerce_admin_edit')}
				</button>
				{#if onduplicate}
					<button
						type="button"
						class="admin-product-table__action-btn"
						onclick={() => onduplicate?.(product)}
					>
						{localText('commerce_admin_duplicate')}
					</button>
				{/if}
				<button
					type="button"
					class="admin-product-table__action-btn admin-product-table__action-btn--danger"
					onclick={() => ondelete(product)}
				>
					{localText('commerce_admin_delete')}
				</button>
			</div>
		</td>
	{/snippet}

	{#snippet emptyState()}
		<div class="admin-product-table__empty">
			<svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
				<circle cx="20" cy="20" r="16" fill="#f3f4f6"/>
				<path d="M12 28l6-8 5 6 4-5 7 7H12z" fill="#d1d5db"/>
			</svg>
			<p>{localText('commerce_no_products')}</p>
		</div>
	{/snippet}

	{#snippet bulkBar(ids)}
		<span class="admin-product-table__bulk-count">
			{localText('commerce_n_selected', { count: ids.length })}
		</span>
	{/snippet}
</DataTable>

<style>
	.admin-product-table__name-cell {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.admin-product-table__thumb {
		width: 2.25rem;
		height: 2.25rem;
		flex-shrink: 0;
		border-radius: var(--radius-sm, 0.25rem);
		overflow: hidden;
		border: 1px solid var(--color-border, #e5e7eb);
	}

	.admin-product-table__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.admin-product-table__img-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-surface-subtle, #f9fafb);
	}

	.admin-product-table__product-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text, #111827);
		margin: 0;
	}

	.admin-product-table__sku {
		font-size: 0.75rem;
		color: var(--color-muted, #9ca3af);
		margin: 0;
	}

	.admin-product-table__featured-dot {
		font-size: 0.7rem;
		color: var(--color-primary, #2563eb);
	}

	.admin-product-table__muted {
		color: var(--color-muted, #6b7280);
		font-size: 0.875rem;
	}

	.admin-product-table__badge {
		display: inline-flex;
		align-items: center;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.admin-product-table__badge--live {
		background: var(--color-success-subtle, #f0fdf4);
		color: var(--color-success, #166534);
		border: 1px solid var(--color-success-border, #bbf7d0);
	}

	.admin-product-table__badge--draft {
		background: var(--color-neutral-subtle, #f3f4f6);
		color: var(--color-neutral, #6b7280);
	}

	.admin-product-table__actions-cell {
		text-align: right;
	}

	.admin-product-table__actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.admin-product-table__action-btn {
		background: none;
		border: none;
		padding: 0;
		font-size: 0.8125rem;
		color: var(--color-primary, #2563eb);
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.admin-product-table__action-btn:hover {
		color: var(--color-primary-hover, #1d4ed8);
	}

	.admin-product-table__action-btn--danger {
		color: var(--color-danger, #dc2626);
	}

	.admin-product-table__action-btn--danger:hover {
		color: var(--color-danger-hover, #b91c1c);
	}

	.admin-product-table__action-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
		border-radius: 2px;
	}

	.admin-product-table__empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1.5rem;
		color: var(--color-muted, #9ca3af);
		font-size: 0.875rem;
	}

	.admin-product-table__bulk-count {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-primary, #2563eb);
	}
</style>
