<script lang="ts">
	import type { Product, ProductCategory, ProductVariant, Money } from '$lib/type/commerce.js';
	import { localText } from 'svelte-hermes';
	import { untrack } from 'svelte';

	type ProductDraft = {
		categoryId: number | null;
		price: Money;
		compareAtPrice: Money | null;
		stock: number;
		sku: string;
		published: boolean;
		featured: boolean;
		mediaUrls: string[];
		seoTitle: string;
		seoDescription: string;
	};

	let {
		product = undefined,
		categories,
		currency = 'USD',
		locale = 'en',
		onsubmit,
		oncancel,
	}: {
		product?: Product;
		categories: ProductCategory[];
		currency?: string;
		locale?: string;
		onsubmit: (data: ProductDraft) => void;
		oncancel: () => void;
	} = $props();

	let categoryId = $state<number | null>(untrack(() => product?.categoryId ?? null));
	let priceAmount = $state<number>(untrack(() => (product?.price.amount ?? 0) / 100));
	let compareAtAmount = $state<number | null>(
		untrack(() => product?.compareAtPrice ? product.compareAtPrice.amount / 100 : null)
	);
	let stock = $state(untrack(() => product?.stock ?? 0));
	let sku = $state(untrack(() => product?.sku ?? ''));
	let published = $state(untrack(() => product?.published ?? false));
	let featured = $state(untrack(() => product?.featured ?? false));
	let mediaUrls = $state<string[]>(untrack(() => product?.mediaUrls ?? []));
	let seoTitle = $state('');
	let seoDescription = $state('');
	let newMediaUrl = $state('');

	let errors = $state<Record<string, string>>({});

	function validate(): boolean {
		const next: Record<string, string> = {};
		if (priceAmount < 0) next.price = localText('commerce_error_price_negative');
		if (stock < 0) next.stock = localText('commerce_error_stock_negative');
		if (sku && sku.length > 100) next.sku = localText('commerce_error_sku_too_long');
		errors = next;
		return Object.keys(next).length === 0;
	}

	function handleSubmit() {
		if (!validate()) return;
		onsubmit({
			categoryId,
			price: { amount: Math.round(priceAmount * 100), currency },
			compareAtPrice: compareAtAmount !== null
				? { amount: Math.round(compareAtAmount * 100), currency }
				: null,
			stock,
			sku: sku.trim(),
			published,
			featured,
			mediaUrls,
			seoTitle: seoTitle.trim(),
			seoDescription: seoDescription.trim(),
		});
	}

	function addMediaUrl() {
		const url = newMediaUrl.trim();
		if (url && !mediaUrls.includes(url)) {
			mediaUrls = [...mediaUrls, url];
			newMediaUrl = '';
		}
	}

	function removeMediaUrl(url: string) {
		mediaUrls = mediaUrls.filter(u => u !== url);
	}

	function moveMediaUrl(from: number, to: number) {
		if (to < 0 || to >= mediaUrls.length) return;
		const next = [...mediaUrls];
		const [item] = next.splice(from, 1);
		next.splice(to, 0, item);
		mediaUrls = next;
	}

	const categoryName = (id: number) =>
		localText('name', undefined, 'product_category', id);
</script>

<form
	onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}
	class="product-form"
	novalidate
>
	<!-- Pricing -->
	<fieldset class="product-form__section">
		<legend class="product-form__section-title">{localText('commerce_section_pricing')}</legend>

		<div class="product-form__row">
			<div class="product-form__field">
				<label class="product-form__label" for="pf-price">
					{localText('commerce_product_price_label')}
					<span class="product-form__required" aria-hidden="true">*</span>
				</label>
				<div class="product-form__money">
					<span class="product-form__currency">{currency}</span>
					<input
						id="pf-price"
						type="number"
						bind:value={priceAmount}
						min="0"
						step="0.01"
						class="product-form__input product-form__input--money"
						aria-required="true"
						aria-describedby={errors.price ? 'pf-price-err' : undefined}
						aria-invalid={errors.price ? 'true' : undefined}
					/>
				</div>
				{#if errors.price}
					<p id="pf-price-err" class="product-form__error" role="alert">{errors.price}</p>
				{/if}
			</div>

			<div class="product-form__field">
				<label class="product-form__label" for="pf-compare">
					{localText('commerce_product_compare_at_label')}
				</label>
				<div class="product-form__money">
					<span class="product-form__currency">{currency}</span>
					<input
						id="pf-compare"
						type="number"
						value={compareAtAmount ?? ''}
						oninput={(e) => {
							const v = (e.target as HTMLInputElement).value;
							compareAtAmount = v === '' ? null : parseFloat(v);
						}}
						min="0"
						step="0.01"
						class="product-form__input product-form__input--money"
					/>
				</div>
			</div>
		</div>
	</fieldset>

	<!-- Inventory -->
	<fieldset class="product-form__section">
		<legend class="product-form__section-title">{localText('commerce_section_inventory')}</legend>

		<div class="product-form__row">
			<div class="product-form__field">
				<label class="product-form__label" for="pf-stock">
					{localText('commerce_product_stock_label')}
				</label>
				<input
					id="pf-stock"
					type="number"
					bind:value={stock}
					min="0"
					class="product-form__input"
					aria-describedby={errors.stock ? 'pf-stock-err' : undefined}
					aria-invalid={errors.stock ? 'true' : undefined}
				/>
				{#if errors.stock}
					<p id="pf-stock-err" class="product-form__error" role="alert">{errors.stock}</p>
				{/if}
			</div>

			<div class="product-form__field">
				<label class="product-form__label" for="pf-sku">
					{localText('commerce_product_sku_label')}
				</label>
				<input
					id="pf-sku"
					type="text"
					bind:value={sku}
					maxlength="100"
					class="product-form__input"
					aria-describedby={errors.sku ? 'pf-sku-err' : undefined}
					aria-invalid={errors.sku ? 'true' : undefined}
				/>
				{#if errors.sku}
					<p id="pf-sku-err" class="product-form__error" role="alert">{errors.sku}</p>
				{/if}
			</div>
		</div>
	</fieldset>

	<!-- Organization -->
	<fieldset class="product-form__section">
		<legend class="product-form__section-title">{localText('commerce_section_organization')}</legend>

		<div class="product-form__field">
			<label class="product-form__label" for="pf-category">
				{localText('commerce_product_category_label')}
			</label>
			<select id="pf-category" bind:value={categoryId} class="product-form__select">
				<option value={null}>{localText('commerce_no_category')}</option>
				{#each categories as cat (cat.id)}
					<option value={cat.id}>{categoryName(cat.id)}</option>
				{/each}
			</select>
		</div>

		<div class="product-form__checks">
			<label class="product-form__check-label">
				<input type="checkbox" bind:checked={published} class="product-form__checkbox" />
				<span>
					<strong>{localText('commerce_product_published_label')}</strong>
					<span class="product-form__check-hint">{localText('commerce_published_hint')}</span>
				</span>
			</label>
			<label class="product-form__check-label">
				<input type="checkbox" bind:checked={featured} class="product-form__checkbox" />
				<span>
					<strong>{localText('commerce_product_featured_label')}</strong>
					<span class="product-form__check-hint">{localText('commerce_featured_hint')}</span>
				</span>
			</label>
		</div>
	</fieldset>

	<!-- Media -->
	<fieldset class="product-form__section">
		<legend class="product-form__section-title">{localText('commerce_section_media')}</legend>
		<p class="product-form__hint">{localText('commerce_media_hint')}</p>

		{#if mediaUrls.length > 0}
			<ol class="product-form__media-list" aria-label={localText('commerce_product_images')}>
				{#each mediaUrls as url, i (url)}
					<li class="product-form__media-item">
						<img src={url} alt="" class="product-form__media-thumb" loading="lazy" decoding="async" />
						<span class="product-form__media-url" title={url}>{url}</span>
						<div class="product-form__media-controls">
							<button
								type="button"
								class="product-form__icon-btn"
								onclick={() => moveMediaUrl(i, i - 1)}
								disabled={i === 0}
								aria-label={localText('commerce_move_image_up')}
							>↑</button>
							<button
								type="button"
								class="product-form__icon-btn"
								onclick={() => moveMediaUrl(i, i + 1)}
								disabled={i === mediaUrls.length - 1}
								aria-label={localText('commerce_move_image_down')}
							>↓</button>
							<button
								type="button"
								class="product-form__icon-btn product-form__icon-btn--danger"
								onclick={() => removeMediaUrl(url)}
								aria-label={localText('commerce_remove_image')}
							>×</button>
						</div>
					</li>
				{/each}
			</ol>
		{/if}

		<div class="product-form__media-add">
			<input
				type="url"
				bind:value={newMediaUrl}
				class="product-form__input"
				placeholder={localText('commerce_media_url_placeholder')}
				aria-label={localText('commerce_media_url_label')}
				onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMediaUrl(); } }}
			/>
			<button
				type="button"
				class="product-form__btn product-form__btn--secondary"
				onclick={addMediaUrl}
			>
				{localText('commerce_add_image')}
			</button>
		</div>
	</fieldset>

	<!-- SEO -->
	<fieldset class="product-form__section">
		<legend class="product-form__section-title">{localText('commerce_section_seo')}</legend>

		<div class="product-form__field">
			<label class="product-form__label" for="pf-seo-title">
				{localText('commerce_seo_title_label')}
			</label>
			<input
				id="pf-seo-title"
				type="text"
				bind:value={seoTitle}
				maxlength="70"
				class="product-form__input"
			/>
			<p class="product-form__char-count">{seoTitle.length}/70</p>
		</div>

		<div class="product-form__field">
			<label class="product-form__label" for="pf-seo-desc">
				{localText('commerce_seo_description_label')}
			</label>
			<textarea
				id="pf-seo-desc"
				bind:value={seoDescription}
				maxlength="160"
				rows="3"
				class="product-form__textarea"
			></textarea>
			<p class="product-form__char-count">{seoDescription.length}/160</p>
		</div>
	</fieldset>

	<!-- Actions -->
	<div class="product-form__actions">
		<button type="button" class="product-form__btn product-form__btn--secondary" onclick={oncancel}>
			{localText('commerce_admin_cancel')}
		</button>
		<button type="submit" class="product-form__btn product-form__btn--primary">
			{localText('commerce_admin_save')}
		</button>
	</div>
</form>

<style>
	.product-form {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.product-form__section {
		border: none;
		border-bottom: 1px solid var(--color-border, #e5e7eb);
		padding: 1.25rem 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.product-form__section:last-of-type {
		border-bottom: none;
	}

	.product-form__section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text, #111827);
		margin-bottom: 0.25rem;
	}

	.product-form__hint {
		font-size: 0.8125rem;
		color: var(--color-muted, #6b7280);
		margin: 0;
	}

	.product-form__row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.875rem;
	}

	@media (max-width: 480px) {
		.product-form__row { grid-template-columns: 1fr; }
	}

	.product-form__field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.product-form__label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-text, #374151);
	}

	.product-form__required {
		color: var(--color-danger, #dc2626);
		margin-left: 0.1rem;
	}

	.product-form__input {
		height: 2.25rem;
		padding: 0 0.625rem;
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.875rem;
		color: var(--color-text, #111827);
		background: var(--color-surface, #fff);
		width: 100%;
		box-sizing: border-box;
		transition: border-color 0.1s, box-shadow 0.1s;
	}

	.product-form__input:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px var(--color-primary-subtle, #eff6ff);
	}

	.product-form__input[aria-invalid="true"] {
		border-color: var(--color-danger, #dc2626);
	}

	.product-form__input--money {
		padding-left: 2.25rem;
	}

	.product-form__money {
		position: relative;
	}

	.product-form__currency {
		position: absolute;
		left: 0.625rem;
		top: 50%;
		transform: translateY(-50%);
		font-size: 0.8125rem;
		color: var(--color-muted, #9ca3af);
		pointer-events: none;
		z-index: 1;
	}

	.product-form__select {
		height: 2.25rem;
		padding: 0 2rem 0 0.625rem;
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.875rem;
		color: var(--color-text, #111827);
		background: var(--color-surface, #fff);
		width: 100%;
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.625rem center;
	}

	.product-form__select:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px var(--color-primary-subtle, #eff6ff);
	}

	.product-form__textarea {
		padding: 0.5rem 0.625rem;
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.875rem;
		color: var(--color-text, #111827);
		background: var(--color-surface, #fff);
		width: 100%;
		box-sizing: border-box;
		resize: vertical;
		font-family: inherit;
		transition: border-color 0.1s, box-shadow 0.1s;
	}

	.product-form__textarea:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px var(--color-primary-subtle, #eff6ff);
	}

	.product-form__error {
		font-size: 0.75rem;
		color: var(--color-danger, #dc2626);
		margin: 0;
	}

	.product-form__char-count {
		font-size: 0.75rem;
		color: var(--color-muted, #9ca3af);
		text-align: right;
		margin: 0;
	}

	.product-form__checks {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.product-form__check-label {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--color-text, #374151);
	}

	.product-form__checkbox {
		margin-top: 0.125rem;
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		cursor: pointer;
		accent-color: var(--color-primary, #2563eb);
	}

	.product-form__check-hint {
		display: block;
		font-size: 0.75rem;
		color: var(--color-muted, #9ca3af);
	}

	.product-form__media-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.product-form__media-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.375rem 0.625rem;
		background: var(--color-surface-subtle, #f9fafb);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
	}

	.product-form__media-thumb {
		width: 2.5rem;
		height: 2.5rem;
		object-fit: cover;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.product-form__media-url {
		flex: 1;
		font-size: 0.75rem;
		color: var(--color-muted, #6b7280);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.product-form__media-controls {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.product-form__media-add {
		display: flex;
		gap: 0.5rem;
	}

	.product-form__icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-surface, #fff);
		font-size: 0.875rem;
		cursor: pointer;
		color: var(--color-text, #374151);
		transition: background 0.1s;
	}

	.product-form__icon-btn:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.product-form__icon-btn--danger {
		color: var(--color-danger, #dc2626);
	}

	.product-form__icon-btn--danger:hover {
		background: var(--color-danger-subtle, #fef2f2);
	}

	.product-form__icon-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 1px;
	}

	.product-form__actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		padding-top: 1.25rem;
	}

	.product-form__btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 2.25rem;
		padding: 0 1rem;
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.12s, border-color 0.12s;
	}

	.product-form__btn--primary {
		background: var(--color-primary, #2563eb);
		border: 1px solid var(--color-primary, #2563eb);
		color: #fff;
	}

	.product-form__btn--primary:hover {
		background: var(--color-primary-hover, #1d4ed8);
		border-color: var(--color-primary-hover, #1d4ed8);
	}

	.product-form__btn--secondary {
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #d1d5db);
		color: var(--color-text, #374151);
	}

	.product-form__btn--secondary:hover {
		background: var(--color-surface-hover, #f9fafb);
	}

	.product-form__btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
	}
</style>
