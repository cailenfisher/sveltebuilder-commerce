<script lang="ts">
	import type { PageInfo } from '$lib/type/commerce.js';

	let {
		pageInfo,
		onchange,
	}: {
		pageInfo: PageInfo;
		onchange: (page: number) => void;
	} = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(pageInfo.total / pageInfo.pageSize)));
	const from = $derived((pageInfo.page - 1) * pageInfo.pageSize + 1);
	const to = $derived(Math.min(pageInfo.page * pageInfo.pageSize, pageInfo.total));

	function pages(): number[] {
		const p = pageInfo.page;
		const total = totalPages;
		if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
		const set = new Set([1, 2, p - 1, p, p + 1, total - 1, total].filter(n => n >= 1 && n <= total));
		return [...set].sort((a, b) => a - b);
	}

	function withEllipsis(nums: number[]): (number | null)[] {
		const result: (number | null)[] = [];
		for (let i = 0; i < nums.length; i++) {
			if (i > 0 && nums[i] - nums[i - 1] > 1) result.push(null);
			result.push(nums[i]);
		}
		return result;
	}

	const pageButtons = $derived(withEllipsis(pages()));
</script>

{#if totalPages > 1}
	<nav class="pagination" aria-label="Pagination">
		<span class="pagination__count" aria-live="polite">
			{from}–{to} of {pageInfo.total}
		</span>
		<div class="pagination__controls">
			<button
				type="button"
				class="pagination__btn"
				disabled={pageInfo.page <= 1}
				onclick={() => onchange(pageInfo.page - 1)}
				aria-label="Previous page"
			>
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
					<path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>
			{#each pageButtons as btn (btn ?? `ellipsis-${btn}`)}
				{#if btn === null}
					<span class="pagination__ellipsis" aria-hidden="true">…</span>
				{:else}
					<button
						type="button"
						class="pagination__btn {btn === pageInfo.page ? 'pagination__btn--active' : ''}"
						onclick={() => onchange(btn)}
						aria-label="Page {btn}"
						aria-current={btn === pageInfo.page ? 'page' : undefined}
					>{btn}</button>
				{/if}
			{/each}
			<button
				type="button"
				class="pagination__btn"
				disabled={pageInfo.page >= totalPages}
				onclick={() => onchange(pageInfo.page + 1)}
				aria-label="Next page"
			>
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
					<path d="M5 2l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>
		</div>
	</nav>
{/if}

<style>
	.pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0.75rem 0;
	}

	.pagination__count {
		font-size: 0.8125rem;
		color: var(--color-muted, #6b7280);
	}

	.pagination__controls {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.pagination__btn {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 2rem;
		height: 2rem;
		padding: 0 0.375rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-surface, #fff);
		color: var(--color-text, #374151);
		font-size: 0.8125rem;
		cursor: pointer;
		transition: background 0.1s, border-color 0.1s;
	}

	.pagination__btn:hover:not(:disabled) {
		background: var(--color-surface-hover, #f3f4f6);
		border-color: var(--color-border-hover, #d1d5db);
	}

	.pagination__btn:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.pagination__btn--active {
		background: var(--color-primary, #2563eb);
		border-color: var(--color-primary, #2563eb);
		color: #fff;
		font-weight: 600;
	}

	.pagination__btn--active:hover:not(:disabled) {
		background: var(--color-primary-hover, #1d4ed8);
	}

	.pagination__btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 1px;
	}

	.pagination__ellipsis {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 2rem;
		height: 2rem;
		font-size: 0.8125rem;
		color: var(--color-muted, #9ca3af);
		user-select: none;
	}
</style>
