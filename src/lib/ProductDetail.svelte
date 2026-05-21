<script lang="ts">
	import type { Product, ProductVariant } from '$lib/type/commerce.js';
	import { localText } from 'svelte-hermes';
	import PriceDisplay from './PriceDisplay.svelte';
	import StockBadge from './StockBadge.svelte';

	let {
		product,
		variants = [],
		locale = 'en',
		lowStockThreshold = 10,
		onaddtocart,
	}: {
		product: Product;
		variants?: ProductVariant[];
		locale?: string;
		lowStockThreshold?: number;
		onaddtocart?: (product: Product, variant: ProductVariant | null, quantity: number) => void;
	} = $props();

	const name = $derived(localText('name', undefined, 'product', product.id));
	const description = $derived(localText('description', undefined, 'product', product.id));

	let selectedVariant = $state<ProductVariant | null>(null);
	let quantity = $state(1);
	let activeImageIndex = $state(0);

	const effectivePrice = $derived(selectedVariant?.price ?? product.price);
	const effectiveCompareAt = $derived(selectedVariant?.compareAtPrice ?? product.compareAtPrice);
	const effectiveStock = $derived(selectedVariant?.stock ?? product.stock);

	const optionKeys = $derived(
		variants.length > 0
			? Object.keys(variants[0]?.options ?? {})
			: []
	);

	const selectedOptions = $state<Record<string, string>>({});

	$effect(() => {
		if (variants.length === 0) return;
		const match = variants.find(v =>
			optionKeys.every(k => v.options[k] === selectedOptions[k])
		);
		selectedVariant = match ?? null;
	});

	function uniqueOptionValues(key: string): string[] {
		return [...new Set(variants.map(v => v.options[key]).filter(Boolean))];
	}

	function canAddToCart(): boolean {
		if (!product.published) return false;
		if (variants.length > 0 && !selectedVariant) return false;
		if (effectiveStock === 0) return false;
		return true;
	}

	function handleAddToCart() {
		if (!canAddToCart()) return;
		onaddtocart?.(product, selectedVariant, quantity);
	}
</script>

<div class="product-detail">
	<div class="product-detail__gallery">
		{#if product.mediaUrls.length > 0}
			<div class="product-detail__main-image">
				<img
					src={product.mediaUrls[activeImageIndex]}
					alt={name}
					class="product-detail__img"
					loading="eager"
					decoding="async"
				/>
			</div>
			{#if product.mediaUrls.length > 1}
				<div class="product-detail__thumbnails" aria-label={localText('commerce_product_images')}>
					{#each product.mediaUrls as url, i (url)}
						<button
							type="button"
							class="product-detail__thumb {i === activeImageIndex ? 'product-detail__thumb--active' : ''}"
							onclick={() => (activeImageIndex = i)}
							aria-label="{localText('commerce_image_n', { n: i + 1 })}"
							aria-pressed={i === activeImageIndex}
						>
							<img src={url} alt="" loading="lazy" decoding="async" />
						</button>
					{/each}
				</div>
			{/if}
		{:else}
			<div class="product-detail__image-placeholder" aria-hidden="true">
				<svg width="64" height="64" viewBox="0 0 64 64" fill="none">
					<rect width="64" height="64" rx="8" fill="#f3f4f6"/>
					<path d="M14 46l14-18 10 12 8-10 12 16H14z" fill="#d1d5db"/>
					<circle cx="45" cy="22" r="5" fill="#d1d5db"/>
				</svg>
			</div>
		{/if}
	</div>

	<div class="product-detail__info">
		<h1 class="product-detail__name">{name}</h1>

		<div class="product-detail__pricing">
			<PriceDisplay
				price={effectivePrice}
				compareAt={effectiveCompareAt}
				{locale}
				size="lg"
			/>
			<StockBadge stock={effectiveStock} lowThreshold={lowStockThreshold} />
		</div>

		{#if description}
			<p class="product-detail__desc">{description}</p>
		{/if}

		{#if variants.length > 0}
			<div class="product-detail__variants">
				{#each optionKeys as key (key)}
					<fieldset class="product-detail__option-group">
						<legend class="product-detail__option-label">
							{localText(`commerce_variant_option_${key}`, undefined, null, null) || key}
						</legend>
						<div class="product-detail__option-values">
							{#each uniqueOptionValues(key) as value (value)}
								<button
									type="button"
									class="product-detail__option-btn {selectedOptions[key] === value ? 'product-detail__option-btn--selected' : ''}"
									onclick={() => { selectedOptions[key] = value; }}
									aria-pressed={selectedOptions[key] === value}
								>
									{value}
								</button>
							{/each}
						</div>
					</fieldset>
				{/each}
			</div>
		{/if}

		<div class="product-detail__actions">
			<div class="product-detail__qty">
				<button
					type="button"
					class="product-detail__qty-btn"
					onclick={() => quantity = Math.max(1, quantity - 1)}
					disabled={quantity <= 1}
					aria-label={localText('commerce_decrease_quantity')}
				>−</button>
				<input
					type="number"
					class="product-detail__qty-input"
					bind:value={quantity}
					min="1"
					max={effectiveStock || undefined}
					aria-label={localText('commerce_quantity')}
				/>
				<button
					type="button"
					class="product-detail__qty-btn"
					onclick={() => quantity = quantity + 1}
					disabled={effectiveStock > 0 && quantity >= effectiveStock}
					aria-label={localText('commerce_increase_quantity')}
				>+</button>
			</div>

			<button
				type="button"
				class="product-detail__add-btn"
				onclick={handleAddToCart}
				disabled={!canAddToCart()}
			>
				{#if effectiveStock === 0}
					{localText('commerce_out_of_stock')}
				{:else if variants.length > 0 && !selectedVariant}
					{localText('commerce_select_options')}
				{:else}
					{localText('commerce_add_to_cart')}
				{/if}
			</button>
		</div>
	</div>
</div>

<style>
	.product-detail {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2.5rem;
		align-items: start;
	}

	@media (max-width: 640px) {
		.product-detail {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}

	.product-detail__gallery {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.product-detail__main-image {
		aspect-ratio: 1;
		border-radius: var(--radius-lg, 0.75rem);
		overflow: hidden;
		background: var(--color-surface-subtle, #f9fafb);
	}

	.product-detail__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.product-detail__image-placeholder {
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-lg, 0.75rem);
		background: var(--color-surface-subtle, #f9fafb);
	}

	.product-detail__thumbnails {
		display: flex;
		gap: 0.5rem;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.product-detail__thumbnails::-webkit-scrollbar { display: none; }

	.product-detail__thumb {
		flex-shrink: 0;
		width: 3.5rem;
		height: 3.5rem;
		border: 2px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
		overflow: hidden;
		cursor: pointer;
		padding: 0;
		background: none;
		transition: border-color 0.12s;
	}

	.product-detail__thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.product-detail__thumb--active {
		border-color: var(--color-primary, #2563eb);
	}

	.product-detail__thumb:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
	}

	.product-detail__info {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.product-detail__name {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text, #111827);
		line-height: 1.25;
		margin: 0;
	}

	.product-detail__pricing {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.product-detail__desc {
		font-size: 0.9375rem;
		line-height: 1.6;
		color: var(--color-text-secondary, #374151);
		margin: 0;
	}

	.product-detail__variants {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.product-detail__option-group {
		border: none;
		padding: 0;
		margin: 0;
	}

	.product-detail__option-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text, #111827);
		margin-bottom: 0.5rem;
	}

	.product-detail__option-values {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.product-detail__option-btn {
		padding: 0.375rem 0.875rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-surface, #fff);
		color: var(--color-text, #374151);
		font-size: 0.875rem;
		cursor: pointer;
		transition: border-color 0.12s, background 0.12s;
	}

	.product-detail__option-btn--selected {
		border-color: var(--color-primary, #2563eb);
		background: var(--color-primary-subtle, #eff6ff);
		color: var(--color-primary, #2563eb);
		font-weight: 500;
	}

	.product-detail__option-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 1px;
	}

	.product-detail__actions {
		display: flex;
		gap: 0.75rem;
		align-items: stretch;
	}

	.product-detail__qty {
		display: flex;
		align-items: center;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
		overflow: hidden;
	}

	.product-detail__qty-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.75rem;
		background: var(--color-surface-subtle, #f9fafb);
		border: none;
		font-size: 1.125rem;
		color: var(--color-text, #374151);
		cursor: pointer;
		transition: background 0.1s;
	}

	.product-detail__qty-btn:hover:not(:disabled) {
		background: var(--color-surface-hover, #f3f4f6);
	}

	.product-detail__qty-btn:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.product-detail__qty-input {
		width: 3rem;
		height: 2.75rem;
		border: none;
		border-left: 1px solid var(--color-border, #e5e7eb);
		border-right: 1px solid var(--color-border, #e5e7eb);
		text-align: center;
		font-size: 0.9375rem;
		color: var(--color-text, #111827);
		-moz-appearance: textfield;
		appearance: textfield;
	}

	.product-detail__qty-input::-webkit-inner-spin-button,
	.product-detail__qty-input::-webkit-outer-spin-button {
		appearance: none;
		-webkit-appearance: none;
	}

	.product-detail__add-btn {
		flex: 1;
		height: 2.75rem;
		padding: 0 1.5rem;
		background: var(--color-primary, #2563eb);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.12s;
	}

	.product-detail__add-btn:hover:not(:disabled) {
		background: var(--color-primary-hover, #1d4ed8);
	}

	.product-detail__add-btn:disabled {
		background: var(--color-surface-subtle, #f3f4f6);
		color: var(--color-muted, #9ca3af);
		cursor: default;
	}

	.product-detail__add-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
	}
</style>
