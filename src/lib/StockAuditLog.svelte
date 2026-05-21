<script lang="ts">
	import type { StockAdjustment, PageInfo } from '$lib/type/commerce.js';
	import { Skeleton } from 'sveltebuilder-coreui';
	import { localText } from 'svelte-hermes';
	import Pagination from './internal/Pagination.svelte';

	let {
		adjustments,
		loading = false,
		pageInfo,
		onpagechange,
	}: {
		adjustments: StockAdjustment[];
		loading?: boolean;
		pageInfo?: PageInfo;
		onpagechange?: (page: number) => void;
	} = $props();

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString();
	}
</script>

<div class="stock-audit-log">
	<h3 class="stock-audit-log__title">{localText('commerce_stock_audit_log')}</h3>

	{#if loading}
		<div class="stock-audit-log__loading" aria-busy="true" aria-label={localText('commerce_loading')}>
			{#each { length: 5 } as _, i (i)}
				<Skeleton height="2.5rem" rounded="sm" />
			{/each}
		</div>
	{:else if adjustments.length === 0}
		<p class="stock-audit-log__empty" role="status">
			{localText('commerce_no_adjustments')}
		</p>
	{:else}
		<div class="stock-audit-log__scroll" role="region" aria-label={localText('commerce_stock_audit_log')}>
			<table class="stock-audit-log__table">
				<thead>
					<tr>
						<th class="stock-audit-log__th" scope="col">{localText('commerce_audit_date')}</th>
						<th class="stock-audit-log__th" scope="col">{localText('commerce_audit_who')}</th>
						<th class="stock-audit-log__th" scope="col">{localText('commerce_audit_delta')}</th>
						<th class="stock-audit-log__th" scope="col">{localText('commerce_audit_reason')}</th>
					</tr>
				</thead>
				<tbody>
					{#each adjustments as adj (adj.id)}
						<tr class="stock-audit-log__row">
							<td class="stock-audit-log__td stock-audit-log__td--mono">
								{formatDate(adj.createdAt)}
							</td>
							<td class="stock-audit-log__td">{adj.createdBy}</td>
							<td class="stock-audit-log__td">
								<span class="stock-audit-log__delta stock-audit-log__delta--{adj.delta > 0 ? 'positive' : 'negative'}">
									{adj.delta > 0 ? '+' : ''}{adj.delta}
								</span>
							</td>
							<td class="stock-audit-log__td">{adj.reason}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if pageInfo && onpagechange}
		<Pagination {pageInfo} onchange={onpagechange} />
	{/if}
</div>

<style>
	.stock-audit-log {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.stock-audit-log__title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text, #111827);
		margin: 0;
	}

	.stock-audit-log__loading {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.stock-audit-log__empty {
		font-size: 0.875rem;
		color: var(--color-muted, #9ca3af);
		padding: 1.5rem;
		text-align: center;
		margin: 0;
		border: 1px dashed var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
	}

	.stock-audit-log__scroll {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.stock-audit-log__table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.stock-audit-log__th {
		padding: 0.5rem 0.75rem;
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

	.stock-audit-log__row {
		border-bottom: 1px solid var(--color-border-subtle, #f3f4f6);
	}

	.stock-audit-log__row:last-child {
		border-bottom: none;
	}

	.stock-audit-log__td {
		padding: 0.625rem 0.75rem;
		color: var(--color-text, #374151);
		vertical-align: middle;
	}

	.stock-audit-log__td--mono {
		font-size: 0.8125rem;
		font-family: ui-monospace, monospace;
		color: var(--color-muted, #6b7280);
		white-space: nowrap;
	}

	.stock-audit-log__delta {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.stock-audit-log__delta--positive { color: var(--color-success, #166534); }
	.stock-audit-log__delta--negative { color: var(--color-danger, #dc2626); }
</style>
