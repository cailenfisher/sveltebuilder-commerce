<script lang="ts">
	import { Badge } from 'sveltebuilder-coreui';
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
	<Badge variant="secondary" size="md" role="status">
		{localText('commerce_out_of_stock')}
	</Badge>
{:else if variant === 'low'}
	<Badge variant="warning" size="md" role="status">
		{localText('commerce_low_stock', { count: stock })}
	</Badge>
{:else}
	<Badge variant="success" size="md" role="status">
		{localText('commerce_in_stock')}
	</Badge>
{/if}
