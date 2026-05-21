<script lang="ts" generics="T extends { id: number }">
	import type { Snippet } from 'svelte';
	import type { PageInfo, SortState } from '$lib/type/commerce.js';
	import Pagination from './Pagination.svelte';

	type Column = {
		key: string;
		label: string;
		sortable?: boolean;
	};

	let {
		items,
		columns,
		loading = false,
		pageInfo,
		sort,
		onpagechange,
		onsort,
		row,
		emptyState,
		bulkBar,
		selectedIds = [],
		onselect,
	}: {
		items: T[];
		columns: Column[];
		loading?: boolean;
		pageInfo?: PageInfo;
		sort?: SortState;
		onpagechange?: (page: number) => void;
		onsort?: (col: string) => void;
		row: Snippet<[T]>;
		emptyState?: Snippet;
		bulkBar?: Snippet<[number[]]>;
		selectedIds?: number[];
		onselect?: (ids: number[]) => void;
	} = $props();

	const allSelected = $derived(
		items.length > 0 && items.every(item => selectedIds.includes(item.id))
	);
	const someSelected = $derived(selectedIds.length > 0);

	function toggleAll() {
		if (allSelected) {
			onselect?.([]);
		} else {
			onselect?.(items.map(i => i.id));
		}
	}

	function toggleOne(id: number) {
		if (selectedIds.includes(id)) {
			onselect?.(selectedIds.filter(x => x !== id));
		} else {
			onselect?.([...selectedIds, id]);
		}
	}

	const selectable = $derived(onselect !== undefined);
</script>

<div class="data-table-wrap">
	{#if someSelected && bulkBar}
		<div class="data-table-bulk-bar" role="status" aria-live="polite">
			{@render bulkBar(selectedIds)}
		</div>
	{/if}

	<div class="data-table-scroll">
		<table class="data-table" aria-busy={loading}>
			<thead>
				<tr>
					{#if selectable}
						<th class="data-table-th data-table-th--check" scope="col">
							<input
								type="checkbox"
								class="data-table-checkbox"
								checked={allSelected}
								indeterminate={someSelected && !allSelected}
								onchange={toggleAll}
								aria-label="Select all"
							/>
						</th>
					{/if}
					{#each columns as col (col.key)}
						<th
							class="data-table-th {col.sortable ? 'data-table-th--sortable' : ''}"
							scope="col"
							aria-sort={sort?.column === col.key
								? sort.direction === 'asc' ? 'ascending' : 'descending'
								: col.sortable ? 'none' : undefined}
						>
							{#if col.sortable}
								<button
									type="button"
									class="data-table-sort-btn {sort?.column === col.key ? 'data-table-sort-btn--active' : ''}"
									onclick={() => onsort?.(col.key)}
								>
									{col.label}
									<span class="data-table-sort-icon" aria-hidden="true">
										{#if sort?.column === col.key}
											{sort.direction === 'asc' ? '↑' : '↓'}
										{:else}
											↕
										{/if}
									</span>
								</button>
							{:else}
								{col.label}
							{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#if loading}
					{#each { length: 5 } as _, i (i)}
						<tr class="data-table-row data-table-row--skeleton" aria-hidden="true">
							{#if selectable}<td class="data-table-td"><span class="skeleton skeleton--check"></span></td>{/if}
							{#each columns as col (col.key)}
								<td class="data-table-td"><span class="skeleton skeleton--cell"></span></td>
							{/each}
						</tr>
					{/each}
				{:else if items.length === 0}
					<tr>
						<td
							colspan={columns.length + (selectable ? 1 : 0)}
							class="data-table-empty"
						>
							{#if emptyState}{@render emptyState()}{/if}
						</td>
					</tr>
				{:else}
					{#each items as item (item.id)}
						<tr
							class="data-table-row {selectedIds.includes(item.id) ? 'data-table-row--selected' : ''}"
						>
							{#if selectable}
								<td class="data-table-td data-table-td--check">
									<input
										type="checkbox"
										class="data-table-checkbox"
										checked={selectedIds.includes(item.id)}
										onchange={() => toggleOne(item.id)}
										aria-label="Select row {item.id}"
									/>
								</td>
							{/if}
							{@render row(item)}
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	{#if pageInfo && onpagechange}
		<Pagination {pageInfo} onchange={onpagechange} />
	{/if}
</div>

<style>
	.data-table-wrap {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.data-table-scroll {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.data-table-th {
		padding: 0.625rem 1rem;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-muted, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		background: var(--color-surface-subtle, #f9fafb);
		border-bottom: 1px solid var(--color-border, #e5e7eb);
		white-space: nowrap;
	}

	.data-table-th--check {
		width: 2.5rem;
		padding-left: 1rem;
	}

	.data-table-sort-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		background: none;
		border: none;
		padding: 0;
		font-size: inherit;
		font-weight: inherit;
		color: inherit;
		letter-spacing: inherit;
		text-transform: inherit;
		cursor: pointer;
	}

	.data-table-sort-btn--active {
		color: var(--color-text, #111827);
	}

	.data-table-sort-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 1px;
		border-radius: 2px;
	}

	.data-table-sort-icon {
		font-size: 0.7rem;
		opacity: 0.6;
	}

	:global(.data-table-td) {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border-subtle, #f3f4f6);
		vertical-align: middle;
	}

	.data-table-td--check {
		width: 2.5rem;
		padding-left: 1rem;
	}

	:global(.data-table-row) {
		background: var(--color-surface, #fff);
		transition: background 0.1s;
	}

	:global(.data-table-row:hover) {
		background: var(--color-surface-hover, #f9fafb);
	}

	:global(.data-table-row--selected) {
		background: var(--color-selection, #eff6ff) !important;
	}

	.data-table-row--skeleton {
		pointer-events: none;
	}

	.data-table-empty {
		padding: 3rem 1rem;
		text-align: center;
		color: var(--color-muted, #9ca3af);
		font-size: 0.875rem;
	}

	.data-table-checkbox {
		width: 1rem;
		height: 1rem;
		cursor: pointer;
		accent-color: var(--color-primary, #2563eb);
	}

	.data-table-bulk-bar {
		padding: 0.625rem 1rem;
		background: var(--color-primary-subtle, #eff6ff);
		border: 1px solid var(--color-primary-border, #bfdbfe);
		border-radius: var(--radius-sm, 0.25rem);
		margin-bottom: 0.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 0.875rem;
	}

	.skeleton {
		display: block;
		border-radius: var(--radius-sm, 0.25rem);
		background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
		background-size: 200% 100%;
		animation: shimmer 1.4s infinite;
	}

	.skeleton--check {
		width: 1rem;
		height: 1rem;
	}

	.skeleton--cell {
		width: 80%;
		height: 1rem;
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}
</style>
