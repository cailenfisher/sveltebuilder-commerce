<script lang="ts">
	import type { Address, Money, PaymentMethod } from '$lib/type/commerce.js';
	import { localText } from 'svelte-hermes';
	import { untrack } from 'svelte';
	import PriceDisplay from './PriceDisplay.svelte';

	type CheckoutStep = 'contact' | 'shipping' | 'payment' | 'review';

	type ContactInfo = {
		email: string;
		phone: string;
	};

	type PaymentInfo = {
		methodId: string;
	};

	let {
		subtotal,
		shippingEstimate = null,
		taxEstimate = null,
		paymentMethods,
		locale = 'en',
		loading = false,
		onshippingchange,
		onsubmit,
	}: {
		subtotal: Money;
		shippingEstimate?: Money | null;
		taxEstimate?: Money | null;
		paymentMethods: PaymentMethod[];
		locale?: string;
		loading?: boolean;
		onshippingchange?: (address: Partial<Address>) => void;
		onsubmit: (contact: ContactInfo, shipping: Address, payment: PaymentInfo, guest: boolean) => void;
	} = $props();

	let step = $state<CheckoutStep>('contact');
	const steps: CheckoutStep[] = ['contact', 'shipping', 'payment', 'review'];
	const stepIndex = $derived(steps.indexOf(step));

	// Contact
	let email = $state('');
	let phone = $state('');
	let guest = $state(true);

	// Shipping
	let firstName = $state('');
	let lastName = $state('');
	let company = $state('');
	let line1 = $state('');
	let line2 = $state('');
	let city = $state('');
	let stateField = $state('');
	let postalCode = $state('');
	let countryCode = $state('US');

	// Payment
	let selectedMethod = $state(untrack(() => paymentMethods[0]?.id ?? ''));
	let paymentError = $state('');

	let errors = $state<Record<string, string>>({});

	const total = $derived<Money>({
		amount: subtotal.amount + (shippingEstimate?.amount ?? 0) + (taxEstimate?.amount ?? 0),
		currency: subtotal.currency,
	});

	function validateContact(): boolean {
		const next: Record<string, string> = {};
		if (!email.trim()) next.email = localText('commerce_error_email_required');
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = localText('commerce_error_email_invalid');
		errors = next;
		return Object.keys(next).length === 0;
	}

	function validateShipping(): boolean {
		const next: Record<string, string> = {};
		if (!firstName.trim()) next.firstName = localText('commerce_error_field_required');
		if (!lastName.trim()) next.lastName = localText('commerce_error_field_required');
		if (!line1.trim()) next.line1 = localText('commerce_error_field_required');
		if (!city.trim()) next.city = localText('commerce_error_field_required');
		if (!postalCode.trim()) next.postalCode = localText('commerce_error_field_required');
		if (!countryCode.trim()) next.countryCode = localText('commerce_error_field_required');
		errors = next;
		return Object.keys(next).length === 0;
	}

	function validatePayment(): boolean {
		const next: Record<string, string> = {};
		if (!selectedMethod) next.method = localText('commerce_error_payment_method_required');
		errors = next;
		return Object.keys(next).length === 0;
	}

	function goNext() {
		if (step === 'contact' && !validateContact()) return;
		if (step === 'shipping' && !validateShipping()) return;
		if (step === 'payment' && !validatePayment()) return;
		const nextIndex = stepIndex + 1;
		if (nextIndex < steps.length) step = steps[nextIndex];
	}

	function goBack() {
		const prevIndex = stepIndex - 1;
		if (prevIndex >= 0) step = steps[prevIndex];
	}

	function handleSubmit() {
		onsubmit(
			{ email: email.trim(), phone: phone.trim() },
			{
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				company: company.trim() || null,
				line1: line1.trim(),
				line2: line2.trim() || null,
				city: city.trim(),
				state: stateField.trim(),
				postalCode: postalCode.trim(),
				countryCode: countryCode.trim(),
				phone: phone.trim() || null,
			},
			{ methodId: selectedMethod },
			guest
		);
	}

	$effect(() => {
		if (step === 'shipping' && line1) {
			onshippingchange?.({ line1, city, state: stateField, postalCode, countryCode });
		}
	});
</script>

<div class="checkout-form">
	<!-- Progress indicator -->
	<nav class="checkout-form__progress" aria-label={localText('commerce_checkout_progress')}>
		{#each steps as s, i (s)}
			<div
				class="checkout-form__step {i < stepIndex ? 'checkout-form__step--done' : i === stepIndex ? 'checkout-form__step--active' : 'checkout-form__step--upcoming'}"
				aria-current={s === step ? 'step' : undefined}
			>
				<span class="checkout-form__step-num" aria-hidden="true">
					{#if i < stepIndex}
						<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
							<path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					{:else}
						{i + 1}
					{/if}
				</span>
				<span class="checkout-form__step-label">{localText(`commerce_checkout_step_${s}`)}</span>
			</div>
			{#if i < steps.length - 1}
				<div class="checkout-form__step-connector {i < stepIndex ? 'checkout-form__step-connector--done' : ''}" aria-hidden="true"></div>
			{/if}
		{/each}
	</nav>

	<!-- Contact step -->
	{#if step === 'contact'}
		<fieldset class="checkout-form__section">
			<legend class="checkout-form__section-title">{localText('commerce_contact_info')}</legend>

			<div class="checkout-form__field">
				<label class="checkout-form__label" for="cf-email">
					{localText('commerce_email_label')}
					<span aria-hidden="true">*</span>
				</label>
				<input
					id="cf-email"
					type="email"
					bind:value={email}
					class="checkout-form__input"
					autocomplete="email"
					aria-describedby={errors.email ? 'cf-email-err' : undefined}
					aria-invalid={errors.email ? 'true' : undefined}
					aria-required="true"
				/>
				{#if errors.email}
					<p id="cf-email-err" class="checkout-form__error" role="alert">{errors.email}</p>
				{/if}
			</div>

			<div class="checkout-form__field">
				<label class="checkout-form__label" for="cf-phone">
					{localText('commerce_phone_label')}
				</label>
				<input
					id="cf-phone"
					type="tel"
					bind:value={phone}
					class="checkout-form__input"
					autocomplete="tel"
				/>
			</div>

			<label class="checkout-form__check-label">
				<input type="checkbox" bind:checked={guest} class="checkout-form__checkbox" />
				{localText('commerce_checkout_as_guest')}
			</label>
		</fieldset>
	{/if}

	<!-- Shipping step -->
	{#if step === 'shipping'}
		<fieldset class="checkout-form__section">
			<legend class="checkout-form__section-title">{localText('commerce_shipping_address')}</legend>

			<div class="checkout-form__row">
				<div class="checkout-form__field">
					<label class="checkout-form__label" for="cf-first">
						{localText('commerce_first_name')} <span aria-hidden="true">*</span>
					</label>
					<input
						id="cf-first"
						type="text"
						bind:value={firstName}
						class="checkout-form__input"
						autocomplete="given-name"
						aria-invalid={errors.firstName ? 'true' : undefined}
					/>
					{#if errors.firstName}<p class="checkout-form__error" role="alert">{errors.firstName}</p>{/if}
				</div>
				<div class="checkout-form__field">
					<label class="checkout-form__label" for="cf-last">
						{localText('commerce_last_name')} <span aria-hidden="true">*</span>
					</label>
					<input
						id="cf-last"
						type="text"
						bind:value={lastName}
						class="checkout-form__input"
						autocomplete="family-name"
						aria-invalid={errors.lastName ? 'true' : undefined}
					/>
					{#if errors.lastName}<p class="checkout-form__error" role="alert">{errors.lastName}</p>{/if}
				</div>
			</div>

			<div class="checkout-form__field">
				<label class="checkout-form__label" for="cf-company">
					{localText('commerce_company')}
				</label>
				<input id="cf-company" type="text" bind:value={company} class="checkout-form__input" autocomplete="organization" />
			</div>

			<div class="checkout-form__field">
				<label class="checkout-form__label" for="cf-line1">
					{localText('commerce_address_line1')} <span aria-hidden="true">*</span>
				</label>
				<input
					id="cf-line1"
					type="text"
					bind:value={line1}
					class="checkout-form__input"
					autocomplete="address-line1"
					aria-invalid={errors.line1 ? 'true' : undefined}
				/>
				{#if errors.line1}<p class="checkout-form__error" role="alert">{errors.line1}</p>{/if}
			</div>

			<div class="checkout-form__field">
				<label class="checkout-form__label" for="cf-line2">
					{localText('commerce_address_line2')}
				</label>
				<input id="cf-line2" type="text" bind:value={line2} class="checkout-form__input" autocomplete="address-line2" />
			</div>

			<div class="checkout-form__row checkout-form__row--3">
				<div class="checkout-form__field">
					<label class="checkout-form__label" for="cf-city">
						{localText('commerce_city')} <span aria-hidden="true">*</span>
					</label>
					<input
						id="cf-city"
						type="text"
						bind:value={city}
						class="checkout-form__input"
						autocomplete="address-level2"
						aria-invalid={errors.city ? 'true' : undefined}
					/>
					{#if errors.city}<p class="checkout-form__error" role="alert">{errors.city}</p>{/if}
				</div>
				<div class="checkout-form__field">
					<label class="checkout-form__label" for="cf-state">
						{localText('commerce_state')}
					</label>
					<input id="cf-state" type="text" bind:value={stateField} class="checkout-form__input" autocomplete="address-level1" />
				</div>
				<div class="checkout-form__field">
					<label class="checkout-form__label" for="cf-postal">
						{localText('commerce_postal_code')} <span aria-hidden="true">*</span>
					</label>
					<input
						id="cf-postal"
						type="text"
						bind:value={postalCode}
						class="checkout-form__input"
						autocomplete="postal-code"
						aria-invalid={errors.postalCode ? 'true' : undefined}
					/>
					{#if errors.postalCode}<p class="checkout-form__error" role="alert">{errors.postalCode}</p>{/if}
				</div>
			</div>

			<!-- Early cost display per Baymard guidance -->
			<div class="checkout-form__cost-preview" aria-live="polite">
				<span class="checkout-form__cost-preview-label">{localText('commerce_estimated_total')}</span>
				<PriceDisplay price={total} {locale} size="sm" />
				<span class="checkout-form__cost-preview-hint">
					{#if shippingEstimate}
						{localText('commerce_incl_shipping_and_tax')}
					{:else}
						{localText('commerce_shipping_and_tax_added_next')}
					{/if}
				</span>
			</div>
		</fieldset>
	{/if}

	<!-- Payment step -->
	{#if step === 'payment'}
		<fieldset class="checkout-form__section">
			<legend class="checkout-form__section-title">{localText('commerce_payment_method')}</legend>

			<div class="checkout-form__methods" role="radiogroup" aria-label={localText('commerce_select_payment_method')}>
				{#each paymentMethods as method (method.id)}
					<label
						class="checkout-form__method {selectedMethod === method.id ? 'checkout-form__method--selected' : ''}"
					>
						<input
							type="radio"
							name="cf-payment"
							value={method.id}
							bind:group={selectedMethod}
							class="checkout-form__radio"
						/>
						{#if method.icon}
							<img src={method.icon} alt="" class="checkout-form__method-icon" loading="lazy" />
						{/if}
						<span>{method.label}</span>
					</label>
				{/each}
			</div>
			{#if errors.method}
				<p class="checkout-form__error" role="alert">{errors.method}</p>
			{/if}

			<!-- Trust signals -->
			<div class="checkout-form__trust">
				<span class="checkout-form__trust-item">
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
						<path d="M7 1L1 4v4c0 3 2.5 5 6 6 3.5-1 6-3 6-6V4L7 1z" stroke="currentColor" stroke-width="1.25" fill="none"/>
						<path d="M4 7l2 2 4-4" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					{localText('commerce_ssl_secured')}
				</span>
				<span class="checkout-form__trust-item">
					{localText('commerce_trusted_checkout')}
				</span>
			</div>

			<!-- Order summary at payment -->
			<div class="checkout-form__order-summary">
				<div class="checkout-form__summary-row">
					<span>{localText('commerce_subtotal')}</span>
					<PriceDisplay price={subtotal} {locale} size="sm" />
				</div>
				<div class="checkout-form__summary-row">
					<span>{localText('commerce_shipping')}</span>
					{#if shippingEstimate}
						<PriceDisplay price={shippingEstimate} {locale} size="sm" />
					{:else}
						<span class="checkout-form__tbd">{localText('commerce_tbd')}</span>
					{/if}
				</div>
				<div class="checkout-form__summary-row">
					<span>{localText('commerce_tax')}</span>
					{#if taxEstimate}
						<PriceDisplay price={taxEstimate} {locale} size="sm" />
					{:else}
						<span class="checkout-form__tbd">{localText('commerce_tbd')}</span>
					{/if}
				</div>
				<div class="checkout-form__summary-row checkout-form__summary-row--total">
					<span>{localText('commerce_total')}</span>
					<PriceDisplay price={total} {locale} size="md" />
				</div>
			</div>
		</fieldset>
	{/if}

	<!-- Review step -->
	{#if step === 'review'}
		<div class="checkout-form__section">
			<h3 class="checkout-form__section-title">{localText('commerce_review_order')}</h3>
			<p class="checkout-form__review-line">
				<strong>{localText('commerce_contact')}:</strong> {email}
			</p>
			<p class="checkout-form__review-line">
				<strong>{localText('commerce_shipping')}:</strong>
				{firstName} {lastName}, {line1}, {city}, {postalCode} {countryCode}
			</p>
			<p class="checkout-form__review-line">
				<strong>{localText('commerce_payment')}:</strong>
				{paymentMethods.find(m => m.id === selectedMethod)?.label ?? selectedMethod}
			</p>
			<div class="checkout-form__summary-row checkout-form__summary-row--total" style="margin-top: 0.75rem">
				<span>{localText('commerce_order_total')}</span>
				<PriceDisplay price={total} {locale} size="lg" />
			</div>
		</div>
	{/if}

	<!-- Navigation -->
	<div class="checkout-form__nav">
		{#if stepIndex > 0}
			<button
				type="button"
				class="checkout-form__back-btn"
				onclick={goBack}
				disabled={loading}
			>
				{localText('commerce_back')}
			</button>
		{/if}

		{#if step === 'review'}
			<button
				type="button"
				class="checkout-form__submit-btn"
				onclick={handleSubmit}
				disabled={loading}
			>
				{loading ? localText('commerce_placing_order') : localText('commerce_place_order')}
			</button>
		{:else}
			<button
				type="button"
				class="checkout-form__next-btn"
				onclick={goNext}
				disabled={loading}
			>
				{localText('commerce_continue')}
			</button>
		{/if}
	</div>
</div>

<style>
	.checkout-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.checkout-form__progress {
		display: flex;
		align-items: center;
		gap: 0;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.checkout-form__progress::-webkit-scrollbar { display: none; }

	.checkout-form__step {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		white-space: nowrap;
	}

	.checkout-form__step-num {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		font-size: 0.75rem;
		font-weight: 600;
		flex-shrink: 0;
	}

	.checkout-form__step--done .checkout-form__step-num {
		background: var(--color-success, #166534);
		color: #fff;
	}

	.checkout-form__step--active .checkout-form__step-num {
		background: var(--color-primary, #2563eb);
		color: #fff;
	}

	.checkout-form__step--upcoming .checkout-form__step-num {
		background: var(--color-surface-subtle, #f3f4f6);
		color: var(--color-muted, #9ca3af);
	}

	.checkout-form__step-label {
		font-size: 0.8125rem;
	}

	.checkout-form__step--active .checkout-form__step-label {
		font-weight: 600;
		color: var(--color-text, #111827);
	}

	.checkout-form__step--done .checkout-form__step-label,
	.checkout-form__step--upcoming .checkout-form__step-label {
		color: var(--color-muted, #6b7280);
	}

	.checkout-form__step-connector {
		flex: 1;
		min-width: 1rem;
		height: 1px;
		background: var(--color-border, #e5e7eb);
		margin: 0 0.5rem;
	}

	.checkout-form__step-connector--done {
		background: var(--color-success, #166534);
	}

	.checkout-form__section {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		border: none;
		padding: 0;
		margin: 0;
	}

	.checkout-form__section-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text, #111827);
		margin: 0;
	}

	.checkout-form__row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.625rem;
	}

	.checkout-form__row--3 {
		grid-template-columns: 2fr 1fr 1fr;
	}

	@media (max-width: 480px) {
		.checkout-form__row,
		.checkout-form__row--3 { grid-template-columns: 1fr; }
	}

	.checkout-form__field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.checkout-form__label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-text, #374151);
	}

	.checkout-form__input {
		height: 2.5rem;
		padding: 0 0.75rem;
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.9375rem;
		color: var(--color-text, #111827);
		background: var(--color-surface, #fff);
		width: 100%;
		box-sizing: border-box;
		transition: border-color 0.1s, box-shadow 0.1s;
	}

	.checkout-form__input:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px var(--color-primary-subtle, #eff6ff);
	}

	.checkout-form__input[aria-invalid="true"] {
		border-color: var(--color-danger, #dc2626);
	}

	.checkout-form__error {
		font-size: 0.75rem;
		color: var(--color-danger, #dc2626);
		margin: 0;
	}

	.checkout-form__check-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-text, #374151);
		cursor: pointer;
	}

	.checkout-form__checkbox {
		width: 1rem;
		height: 1rem;
		accent-color: var(--color-primary, #2563eb);
		cursor: pointer;
	}

	.checkout-form__cost-preview {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 0.75rem;
		background: var(--color-primary-subtle, #eff6ff);
		border: 1px solid var(--color-primary-border, #bfdbfe);
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.875rem;
		flex-wrap: wrap;
	}

	.checkout-form__cost-preview-label {
		font-weight: 500;
		color: var(--color-primary, #1d4ed8);
	}

	.checkout-form__cost-preview-hint {
		font-size: 0.75rem;
		color: var(--color-primary, #3b82f6);
	}

	.checkout-form__methods {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.checkout-form__method {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
		cursor: pointer;
		font-size: 0.9375rem;
		transition: border-color 0.12s, background 0.12s;
	}

	.checkout-form__method--selected {
		border-color: var(--color-primary, #2563eb);
		background: var(--color-primary-subtle, #eff6ff);
	}

	.checkout-form__radio {
		width: 1rem;
		height: 1rem;
		accent-color: var(--color-primary, #2563eb);
		cursor: pointer;
		flex-shrink: 0;
	}

	.checkout-form__method-icon {
		height: 1.25rem;
		object-fit: contain;
	}

	.checkout-form__trust {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		padding: 0.5rem 0;
	}

	.checkout-form__trust-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: var(--color-muted, #6b7280);
	}

	.checkout-form__order-summary {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.75rem;
		background: var(--color-surface-subtle, #f9fafb);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
	}

	.checkout-form__summary-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
		color: var(--color-text-secondary, #374151);
	}

	.checkout-form__summary-row--total {
		padding-top: 0.375rem;
		margin-top: 0.375rem;
		border-top: 1px solid var(--color-border, #e5e7eb);
		font-weight: 700;
		color: var(--color-text, #111827);
	}

	.checkout-form__tbd {
		font-size: 0.75rem;
		color: var(--color-muted, #9ca3af);
		font-style: italic;
	}

	.checkout-form__review-line {
		font-size: 0.875rem;
		color: var(--color-text-secondary, #374151);
		margin: 0;
	}

	.checkout-form__nav {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.checkout-form__back-btn {
		height: 2.75rem;
		padding: 0 1.25rem;
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.9375rem;
		color: var(--color-text, #374151);
		cursor: pointer;
		transition: background 0.1s;
	}

	.checkout-form__back-btn:hover:not(:disabled) {
		background: var(--color-surface-hover, #f9fafb);
	}

	.checkout-form__next-btn,
	.checkout-form__submit-btn {
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

	.checkout-form__next-btn:hover:not(:disabled),
	.checkout-form__submit-btn:hover:not(:disabled) {
		background: var(--color-primary-hover, #1d4ed8);
	}

	.checkout-form__next-btn:disabled,
	.checkout-form__back-btn:disabled,
	.checkout-form__submit-btn:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.checkout-form__next-btn:focus-visible,
	.checkout-form__back-btn:focus-visible,
	.checkout-form__submit-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
	}
</style>
