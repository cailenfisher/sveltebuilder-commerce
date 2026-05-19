<script lang="ts">
	import LocalText from '$lib/localization/LocalText.svelte';

	let { stock }: { stock: number } = $props();

	const variant = $derived(stock === 0 ? 'out' : stock <= 5 ? 'low' : 'in');
</script>

{#if variant === 'out'}
	<span class="badge badge-gray"><LocalText slug="commerce_out_of_stock" /></span>
{:else if variant === 'low'}
	<span class="badge badge-amber"><LocalText slug="commerce_low_stock" values={{ count: stock }} /></span>
{:else}
	<span class="badge badge-green"><LocalText slug="commerce_in_stock" /></span>
{/if}
