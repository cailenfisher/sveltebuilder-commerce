<script lang="ts">
	import type { Order, OrderItem, FulfillmentItem, Return } from '$lib/type/commerce.js';
	import { localText } from 'svelte-hermes';
	import { untrack } from 'svelte';

	type ActiveTab = 'fulfill' | 'refund' | 'return';

	let {
		order,
		items,
		existingReturns = [],
		onfulfill,
		onrefund,
		oninitatereturn,
	}: {
		order: Order;
		items: OrderItem[];
		existingReturns?: Return[];
		onfulfill: (items: FulfillmentItem[], trackingNumber: string, carrier: string) => void;
		onrefund?: (amount: number, reason: string) => void;
		oninitatereturn?: (items: FulfillmentItem[], reason: string) => void;
	} = $props();

	let activeTab = $state<ActiveTab>('fulfill');

	// Fulfill tab
	let fulfillQuantities = $state<Record<number, number>>(
		untrack(() => Object.fromEntries(items.map(item => [item.id, item.quantity])))
	);
	let trackingNumber = $state('');
	let carrier = $state('');
	let fulfillErrors = $state<Record<string, string>>({});

	// Refund tab
	let refundAmount = $state<string>('');
	let refundReason = $state('');
	let refundErrors = $state<Record<string, string>>({});

	// Return tab
	let returnQuantities = $state<Record<number, number>>(
		untrack(() => Object.fromEntries(items.map(item => [item.id, 0])))
	);
	let returnReason = $state('');
	let returnErrors = $state<Record<string, string>>({});

	function buildFulfillItems(): FulfillmentItem[] {
		return items
			.map(item => ({
				orderItemId: item.id,
				quantity: fulfillQuantities[item.id] ?? 0,
			}))
			.filter(fi => fi.quantity > 0);
	}

	function buildReturnItems(): FulfillmentItem[] {
		return items
			.map(item => ({
				orderItemId: item.id,
				quantity: returnQuantities[item.id] ?? 0,
			}))
			.filter(fi => fi.quantity > 0);
	}

	function validateFulfill(): boolean {
		const next: Record<string, string> = {};
		const fulfillItems = buildFulfillItems();
		if (fulfillItems.length === 0) next.items = localText('commerce_error_no_items_selected');
		errors = next;
		fulfillErrors = next;
		return Object.keys(next).length === 0;
	}

	let errors = $state<Record<string, string>>({});

	function handleFulfill() {
		if (!validateFulfill()) return;
		onfulfill(buildFulfillItems(), trackingNumber.trim(), carrier.trim());
	}

	function handleRefund() {
		const next: Record<string, string> = {};
		const amount = parseFloat(refundAmount);
		if (isNaN(amount) || amount <= 0) next.amount = localText('commerce_error_invalid_refund_amount');
		if (!refundReason.trim()) next.reason = localText('commerce_error_reason_required');
		refundErrors = next;
		if (Object.keys(next).length > 0) return;
		onrefund?.(Math.round(amount * 100), refundReason.trim());
	}

	function handleReturn() {
		const next: Record<string, string> = {};
		const returnItems = buildReturnItems();
		if (returnItems.length === 0) next.items = localText('commerce_error_no_items_selected');
		if (!returnReason.trim()) next.reason = localText('commerce_error_reason_required');
		returnErrors = next;
		if (Object.keys(next).length > 0) return;
		oninitatereturn?.(returnItems, returnReason.trim());
	}

	function productName(item: OrderItem): string {
		return localText('name', undefined, 'product', item.productId);
	}
</script>

<div class="fulfillment-panel">
	<!-- Tab nav -->
	<div class="fulfillment-panel__tabs" role="tablist">
		<button
			type="button"
			role="tab"
			class="fulfillment-panel__tab {activeTab === 'fulfill' ? 'fulfillment-panel__tab--active' : ''}"
			onclick={() => (activeTab = 'fulfill')}
			aria-selected={activeTab === 'fulfill'}
			aria-controls="fp-fulfill"
			id="fp-tab-fulfill"
		>
			{localText('commerce_fulfill_tab')}
		</button>
		{#if onrefund}
			<button
				type="button"
				role="tab"
				class="fulfillment-panel__tab {activeTab === 'refund' ? 'fulfillment-panel__tab--active' : ''}"
				onclick={() => (activeTab = 'refund')}
				aria-selected={activeTab === 'refund'}
				aria-controls="fp-refund"
				id="fp-tab-refund"
			>
				{localText('commerce_refund_tab')}
			</button>
		{/if}
		{#if oninitatereturn}
			<button
				type="button"
				role="tab"
				class="fulfillment-panel__tab {activeTab === 'return' ? 'fulfillment-panel__tab--active' : ''}"
				onclick={() => (activeTab = 'return')}
				aria-selected={activeTab === 'return'}
				aria-controls="fp-return"
				id="fp-tab-return"
			>
				{localText('commerce_return_tab')}
			</button>
		{/if}
	</div>

	<!-- Fulfill tab -->
	{#if activeTab === 'fulfill'}
		<div id="fp-fulfill" role="tabpanel" aria-labelledby="fp-tab-fulfill" class="fulfillment-panel__panel">
			<form onsubmit={(e) => { e.preventDefault(); handleFulfill(); }} novalidate>
				<div class="fulfillment-panel__items">
					{#each items as item (item.id)}
						<div class="fulfillment-panel__item">
							<span class="fulfillment-panel__item-name">{productName(item)}</span>
							<div class="fulfillment-panel__qty-row">
								<span class="fulfillment-panel__qty-label">
									{localText('commerce_ordered_qty', { qty: item.quantity })}
								</span>
								<label class="fulfillment-panel__label" for="fp-qty-{item.id}">
									{localText('commerce_fulfill_qty')}
								</label>
								<input
									id="fp-qty-{item.id}"
									type="number"
									bind:value={fulfillQuantities[item.id]}
									min="0"
									max={item.quantity}
									class="fulfillment-panel__qty-input"
								/>
							</div>
						</div>
					{/each}
				</div>
				{#if fulfillErrors.items}
					<p class="fulfillment-panel__error" role="alert">{fulfillErrors.items}</p>
				{/if}

				<div class="fulfillment-panel__shipping">
					<div class="fulfillment-panel__field">
						<label class="fulfillment-panel__label" for="fp-carrier">
							{localText('commerce_carrier')}
						</label>
						<input
							id="fp-carrier"
							type="text"
							bind:value={carrier}
							class="fulfillment-panel__input"
							placeholder={localText('commerce_carrier_placeholder')}
						/>
					</div>
					<div class="fulfillment-panel__field">
						<label class="fulfillment-panel__label" for="fp-tracking">
							{localText('commerce_tracking_number')}
						</label>
						<input
							id="fp-tracking"
							type="text"
							bind:value={trackingNumber}
							class="fulfillment-panel__input"
							placeholder={localText('commerce_tracking_placeholder')}
						/>
					</div>
				</div>

				<div class="fulfillment-panel__actions">
					<button type="submit" class="fulfillment-panel__submit-btn">
						{localText('commerce_mark_fulfilled')}
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Refund tab -->
	{#if activeTab === 'refund' && onrefund}
		<div id="fp-refund" role="tabpanel" aria-labelledby="fp-tab-refund" class="fulfillment-panel__panel">
			<form onsubmit={(e) => { e.preventDefault(); handleRefund(); }} novalidate>
				<div class="fulfillment-panel__field">
					<label class="fulfillment-panel__label" for="fp-refund-amount">
						{localText('commerce_refund_amount')}
						<span aria-hidden="true">*</span>
					</label>
					<input
						id="fp-refund-amount"
						type="number"
						bind:value={refundAmount}
						min="0"
						step="0.01"
						class="fulfillment-panel__input"
						aria-describedby={refundErrors.amount ? 'fp-refund-amount-err' : undefined}
						aria-invalid={refundErrors.amount ? 'true' : undefined}
					/>
					{#if refundErrors.amount}
						<p id="fp-refund-amount-err" class="fulfillment-panel__error" role="alert">{refundErrors.amount}</p>
					{/if}
				</div>
				<div class="fulfillment-panel__field">
					<label class="fulfillment-panel__label" for="fp-refund-reason">
						{localText('commerce_refund_reason')}
						<span aria-hidden="true">*</span>
					</label>
					<textarea
						id="fp-refund-reason"
						bind:value={refundReason}
						rows="3"
						class="fulfillment-panel__textarea"
						aria-describedby={refundErrors.reason ? 'fp-refund-reason-err' : undefined}
						aria-invalid={refundErrors.reason ? 'true' : undefined}
					></textarea>
					{#if refundErrors.reason}
						<p id="fp-refund-reason-err" class="fulfillment-panel__error" role="alert">{refundErrors.reason}</p>
					{/if}
				</div>
				<div class="fulfillment-panel__actions">
					<button type="submit" class="fulfillment-panel__submit-btn fulfillment-panel__submit-btn--danger">
						{localText('commerce_issue_refund')}
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Return tab -->
	{#if activeTab === 'return' && oninitatereturn}
		<div id="fp-return" role="tabpanel" aria-labelledby="fp-tab-return" class="fulfillment-panel__panel">
			<form onsubmit={(e) => { e.preventDefault(); handleReturn(); }} novalidate>
				<div class="fulfillment-panel__items">
					{#each items as item (item.id)}
						<div class="fulfillment-panel__item">
							<span class="fulfillment-panel__item-name">{productName(item)}</span>
							<div class="fulfillment-panel__qty-row">
								<label class="fulfillment-panel__label" for="fp-return-{item.id}">
									{localText('commerce_return_qty')}
								</label>
								<input
									id="fp-return-{item.id}"
									type="number"
									bind:value={returnQuantities[item.id]}
									min="0"
									max={item.quantity}
									class="fulfillment-panel__qty-input"
								/>
							</div>
						</div>
					{/each}
				</div>
				{#if returnErrors.items}
					<p class="fulfillment-panel__error" role="alert">{returnErrors.items}</p>
				{/if}
				<div class="fulfillment-panel__field">
					<label class="fulfillment-panel__label" for="fp-return-reason">
						{localText('commerce_return_reason')}
						<span aria-hidden="true">*</span>
					</label>
					<textarea
						id="fp-return-reason"
						bind:value={returnReason}
						rows="3"
						class="fulfillment-panel__textarea"
						aria-describedby={returnErrors.reason ? 'fp-return-reason-err' : undefined}
						aria-invalid={returnErrors.reason ? 'true' : undefined}
					></textarea>
					{#if returnErrors.reason}
						<p id="fp-return-reason-err" class="fulfillment-panel__error" role="alert">{returnErrors.reason}</p>
					{/if}
				</div>
				<div class="fulfillment-panel__actions">
					<button type="submit" class="fulfillment-panel__submit-btn">
						{localText('commerce_initiate_return')}
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Existing returns -->
	{#if existingReturns.length > 0}
		<div class="fulfillment-panel__existing-returns">
			<h4 class="fulfillment-panel__returns-title">{localText('commerce_existing_returns')}</h4>
			{#each existingReturns as ret (ret.id)}
				<div class="fulfillment-panel__return-item">
					<span class="fulfillment-panel__return-status fulfillment-panel__return-status--{ret.status}">
						{localText(`commerce_return_status_${ret.status}`)}
					</span>
					<span class="fulfillment-panel__return-reason">{ret.reason}</span>
					<time class="fulfillment-panel__return-date" datetime={ret.createdAt}>
						{new Date(ret.createdAt).toLocaleDateString()}
					</time>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.fulfillment-panel {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.fulfillment-panel__tabs {
		display: flex;
		border-bottom: 1px solid var(--color-border, #e5e7eb);
		gap: 0;
	}

	.fulfillment-panel__tab {
		padding: 0.625rem 1rem;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		font-size: 0.875rem;
		color: var(--color-muted, #6b7280);
		cursor: pointer;
		transition: color 0.12s, border-color 0.12s;
		margin-bottom: -1px;
	}

	.fulfillment-panel__tab:hover {
		color: var(--color-text, #374151);
	}

	.fulfillment-panel__tab--active {
		color: var(--color-primary, #2563eb);
		border-bottom-color: var(--color-primary, #2563eb);
		font-weight: 500;
	}

	.fulfillment-panel__tab:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 1px;
	}

	.fulfillment-panel__panel {
		padding: 1rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.fulfillment-panel__items {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.375rem;
	}

	.fulfillment-panel__item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-surface-subtle, #f9fafb);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
		flex-wrap: wrap;
	}

	.fulfillment-panel__item-name {
		font-size: 0.875rem;
		color: var(--color-text, #374151);
		flex: 1;
	}

	.fulfillment-panel__qty-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.fulfillment-panel__qty-label {
		font-size: 0.75rem;
		color: var(--color-muted, #9ca3af);
	}

	.fulfillment-panel__label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text, #374151);
	}

	.fulfillment-panel__qty-input {
		width: 4rem;
		height: 1.875rem;
		padding: 0 0.375rem;
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.875rem;
		text-align: center;
		color: var(--color-text, #111827);
		background: var(--color-surface, #fff);
	}

	.fulfillment-panel__qty-input:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
	}

	.fulfillment-panel__shipping {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.625rem;
	}

	@media (max-width: 480px) {
		.fulfillment-panel__shipping { grid-template-columns: 1fr; }
	}

	.fulfillment-panel__field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.fulfillment-panel__input {
		height: 2.125rem;
		padding: 0 0.5rem;
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.875rem;
		color: var(--color-text, #111827);
		background: var(--color-surface, #fff);
		width: 100%;
		box-sizing: border-box;
	}

	.fulfillment-panel__input:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px var(--color-primary-subtle, #eff6ff);
	}

	.fulfillment-panel__input[aria-invalid="true"] {
		border-color: var(--color-danger, #dc2626);
	}

	.fulfillment-panel__textarea {
		padding: 0.375rem 0.5rem;
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.875rem;
		color: var(--color-text, #111827);
		background: var(--color-surface, #fff);
		width: 100%;
		box-sizing: border-box;
		font-family: inherit;
		resize: vertical;
	}

	.fulfillment-panel__textarea:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px var(--color-primary-subtle, #eff6ff);
	}

	.fulfillment-panel__textarea[aria-invalid="true"] {
		border-color: var(--color-danger, #dc2626);
	}

	.fulfillment-panel__error {
		font-size: 0.75rem;
		color: var(--color-danger, #dc2626);
		margin: 0;
	}

	.fulfillment-panel__actions {
		display: flex;
		justify-content: flex-end;
	}

	.fulfillment-panel__submit-btn {
		height: 2.125rem;
		padding: 0 1rem;
		background: var(--color-primary, #2563eb);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.12s;
	}

	.fulfillment-panel__submit-btn:hover:not(:disabled) {
		background: var(--color-primary-hover, #1d4ed8);
	}

	.fulfillment-panel__submit-btn--danger {
		background: var(--color-danger, #dc2626);
	}

	.fulfillment-panel__submit-btn--danger:hover:not(:disabled) {
		background: var(--color-danger-hover, #b91c1c);
	}

	.fulfillment-panel__submit-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
	}

	.fulfillment-panel__existing-returns {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border, #e5e7eb);
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.fulfillment-panel__returns-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text, #374151);
		margin: 0 0 0.375rem;
	}

	.fulfillment-panel__return-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-size: 0.8125rem;
	}

	.fulfillment-panel__return-status {
		padding: 0.125rem 0.375rem;
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 500;
	}

	.fulfillment-panel__return-status--requested  { background: #fffbeb; color: #92400e; }
	.fulfillment-panel__return-status--approved   { background: #f0fdf4; color: #166534; }
	.fulfillment-panel__return-status--received   { background: #f0f9ff; color: #0369a1; }
	.fulfillment-panel__return-status--refunded   { background: #f5f3ff; color: #6d28d9; }
	.fulfillment-panel__return-status--rejected   { background: #fef2f2; color: #dc2626; }

	.fulfillment-panel__return-reason {
		flex: 1;
		color: var(--color-text-secondary, #374151);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.fulfillment-panel__return-date {
		color: var(--color-muted, #9ca3af);
		white-space: nowrap;
	}
</style>
