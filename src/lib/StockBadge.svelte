<script lang="ts">
	import { localText } from 'svelte-hermes';

	let {
		stock,
		lowThreshold = 10,
	}: {
		stock: number;
		lowThreshold?: number;
	} = $props();

	const variant = $derived(stock === 0 ? 'out' : stock <= lowThreshold ? 'low' : 'in');
</script>

{#if variant === 'out'}
	<span class="stock-badge stock-badge--out" role="status">
		{localText('commerce_out_of_stock')}
	</span>
{:else if variant === 'low'}
	<span class="stock-badge stock-badge--low" role="status">
		{localText('commerce_low_stock', { count: stock })}
	</span>
{:else}
	<span class="stock-badge stock-badge--in" role="status">
		{localText('commerce_in_stock')}
	</span>
{/if}

<style>
	.stock-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.1875rem 0.5rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.stock-badge--out {
		background: var(--color-neutral-subtle, #f3f4f6);
		color: var(--color-neutral, #6b7280);
	}

	.stock-badge--low {
		background: var(--color-warning-subtle, #fffbeb);
		color: var(--color-warning, #92400e);
		border: 1px solid var(--color-warning-border, #fde68a);
	}

	.stock-badge--in {
		background: var(--color-success-subtle, #f0fdf4);
		color: var(--color-success, #166534);
		border: 1px solid var(--color-success-border, #bbf7d0);
	}
</style>
