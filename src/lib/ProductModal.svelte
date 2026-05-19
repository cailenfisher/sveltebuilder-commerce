<script lang="ts">
	import type { Product } from '$lib/types/commerce';
	import { categoryMeta, getCategoryName } from '$lib/stores/commerce.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import PriceTag from './PriceTag.svelte';
	import StockBadge from './StockBadge.svelte';
	import LocalText from '$lib/localization/LocalText.svelte';

	let {
		product,
		open = false,
		onclose,
	}: {
		product: Product | null;
		open?: boolean;
		onclose?: () => void;
	} = $props();

	const meta = $derived(
		product ? (categoryMeta[product.categoryId] ?? { bg: 'bg-gray-100', emoji: '📦' }) : null
	);
</script>

<Modal {open} size="lg" {onclose}>
	{#snippet header()}
		{#if product}
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-xl {meta?.bg}"
				>
					{meta?.emoji}
				</div>
				<div>
					<p class="modal-title">{product.name}</p>
					<p class="text-xs text-gray-400">{getCategoryName(product.categoryId)}</p>
				</div>
			</div>
		{/if}
	{/snippet}

	{#if product}
		<div class="space-y-5">
			<div class="aspect-video w-full rounded-md {meta?.bg} flex items-center justify-center">
				<span class="text-8xl" aria-hidden="true">{meta?.emoji}</span>
			</div>

			<p class="text-sm leading-relaxed text-gray-600">{product.description}</p>

			<div class="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
				<PriceTag price={product.price} size="lg" />
				<StockBadge stock={product.stock} />
			</div>

			{#if product.isFeatured}
				<p class="text-xs text-blue-600">
					★ <LocalText slug="commerce_featured_label" />
				</p>
			{/if}
		</div>
	{/if}

	{#snippet footer()}
		<button
			type="button"
			class="btn btn-secondary btn-sm"
			onclick={onclose}
		>
			<LocalText slug="commerce_close" />
		</button>
		<button
			type="button"
			class="btn btn-primary btn-sm"
			disabled={product?.stock === 0}
		>
			<LocalText slug="commerce_add_to_cart" />
		</button>
	{/snippet}
</Modal>
