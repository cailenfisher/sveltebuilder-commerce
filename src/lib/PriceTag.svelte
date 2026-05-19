<script lang="ts">
	let {
		price,
		size = 'md',
	}: {
		price: number;
		size?: 'sm' | 'md' | 'lg';
	} = $props();

	const formatted = $derived(
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
	);
</script>

<span class="price-tag{size === 'lg' ? '-lg' : size === 'sm' ? '-sm' : ''}">{formatted}</span>
