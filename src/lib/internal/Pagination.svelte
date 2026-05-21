<script lang="ts">
	import type { PageInfo } from '$lib/type/commerce.js';
	import { Pagination as CorePagination } from 'sveltebuilder-coreui';

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

	const page = $derived(pageInfo.page);
</script>

{#if totalPages > 1}
	<nav class="pagination" aria-label="Pagination">
		<span class="pagination__count" aria-live="polite">
			{from}–{to} of {pageInfo.total}
		</span>
		<CorePagination
			count={pageInfo.total}
			perPage={pageInfo.pageSize}
			{page}
			onPageChange={onchange}
		/>
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

</style>
