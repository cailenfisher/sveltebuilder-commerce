<script lang="ts">
	import type { InventoryLocation } from '$lib/type/commerce.js';
	import { localText } from 'svelte-hermes';

	type LocationWithMeta = InventoryLocation & {
		name: string;
		lowThreshold: number;
		reorderPoint: number | null;
	};

	let {
		productId,
		locations,
		loading = false,
		onadjust,
		onthresholdchange,
	}: {
		productId: number;
		locations: LocationWithMeta[];
		loading?: boolean;
		onadjust: (locationId: number, delta: number, reason: string) => void;
		onthresholdchange?: (locationId: number, lowThreshold: number, reorderPoint: number | null) => void;
	} = $props();

	type AdjustState = {
		delta: string;
		reason: string;
		open: boolean;
	};

	let adjustStates = $state<Record<number, AdjustState>>({});

	function getAdjustState(id: number): AdjustState {
		return adjustStates[id] ?? { delta: '', reason: '', open: false };
	}

	function toggleAdjustPanel(id: number) {
		const current = getAdjustState(id);
		adjustStates = { ...adjustStates, [id]: { ...current, open: !current.open } };
	}

	function submitAdjust(locationId: number) {
		const state = getAdjustState(locationId);
		const delta = parseInt(state.delta);
		if (isNaN(delta) || delta === 0) return;
		if (!state.reason.trim()) return;
		onadjust(locationId, delta, state.reason.trim());
		adjustStates = { ...adjustStates, [locationId]: { delta: '', reason: '', open: false } };
	}

	const totalStock = $derived(locations.reduce((s, l) => s + l.stock, 0));
	const totalAvailable = $derived(locations.reduce((s, l) => s + (l.stock - l.reserved), 0));
	const lowStockLocations = $derived(locations.filter(l => l.stock > 0 && l.stock <= l.lowThreshold));
	const outOfStockLocations = $derived(locations.filter(l => l.stock === 0));
</script>

<div class="inventory-panel">
	<!-- Summary row -->
	<div class="inventory-panel__summary">
		<div class="inventory-panel__metric">
			<span class="inventory-panel__metric-value">{totalStock}</span>
			<span class="inventory-panel__metric-label">{localText('commerce_total_stock')}</span>
		</div>
		<div class="inventory-panel__metric">
			<span class="inventory-panel__metric-value">{totalAvailable}</span>
			<span class="inventory-panel__metric-label">{localText('commerce_available_stock')}</span>
		</div>
		{#if lowStockLocations.length > 0}
			<div class="inventory-panel__alert inventory-panel__alert--low" role="alert">
				{localText('commerce_low_stock_at_locations', { count: lowStockLocations.length })}
			</div>
		{/if}
		{#if outOfStockLocations.length > 0}
			<div class="inventory-panel__alert inventory-panel__alert--out" role="alert">
				{localText('commerce_out_of_stock_at_locations', { count: outOfStockLocations.length })}
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="inventory-panel__loading" aria-label={localText('commerce_loading')} aria-busy="true">
			{#each { length: 3 } as _, i (i)}
				<div class="inventory-panel__skeleton" aria-hidden="true"></div>
			{/each}
		</div>
	{:else}
		<ul class="inventory-panel__locations" aria-label={localText('commerce_inventory_locations')}>
			{#each locations as loc (loc.id)}
				{@const state = getAdjustState(loc.id)}
				{@const available = loc.stock - loc.reserved}
				{@const stockLevel = loc.stock === 0 ? 'out' : loc.stock <= loc.lowThreshold ? 'low' : 'ok'}

				<li class="inventory-panel__location">
					<div class="inventory-panel__location-header">
						<span class="inventory-panel__location-name">{loc.name}</span>
						<div class="inventory-panel__location-stats">
							<span class="inventory-panel__stock-num inventory-panel__stock-num--{stockLevel}">
								{loc.stock}
							</span>
							<span class="inventory-panel__stock-meta">
								/ {available} {localText('commerce_available')}
								{#if loc.reserved > 0}
									· {loc.reserved} {localText('commerce_reserved')}
								{/if}
							</span>
						</div>
						<button
							type="button"
							class="inventory-panel__adjust-toggle"
							onclick={() => toggleAdjustPanel(loc.id)}
							aria-expanded={state.open}
							aria-controls="adjust-panel-{loc.id}"
						>
							{localText('commerce_adjust_stock')}
						</button>
					</div>

					{#if loc.lowThreshold > 0 || loc.reorderPoint !== null}
						<div class="inventory-panel__thresholds">
							{#if loc.lowThreshold > 0}
								<span class="inventory-panel__threshold">
									{localText('commerce_low_threshold')}: {loc.lowThreshold}
								</span>
							{/if}
							{#if loc.reorderPoint !== null}
								<span class="inventory-panel__threshold">
									{localText('commerce_reorder_point')}: {loc.reorderPoint}
								</span>
							{/if}
						</div>
					{/if}

					{#if state.open}
						<div
							id="adjust-panel-{loc.id}"
							class="inventory-panel__adjust-panel"
						>
							<div class="inventory-panel__adjust-fields">
								<div class="inventory-panel__adjust-field">
									<label
										class="inventory-panel__label"
										for="adj-delta-{loc.id}"
									>
										{localText('commerce_stock_delta')}
										<span class="inventory-panel__label-hint">
											{localText('commerce_stock_delta_hint')}
										</span>
									</label>
									<input
										id="adj-delta-{loc.id}"
										type="number"
										value={state.delta}
										oninput={(e) => {
											adjustStates = {
												...adjustStates,
												[loc.id]: { ...state, delta: (e.target as HTMLInputElement).value }
											};
										}}
										class="inventory-panel__input"
										placeholder="+10 or -5"
										aria-label={localText('commerce_stock_delta')}
									/>
								</div>
								<div class="inventory-panel__adjust-field">
									<label
										class="inventory-panel__label"
										for="adj-reason-{loc.id}"
									>
										{localText('commerce_adjustment_reason')}
										<span class="inventory-panel__required" aria-hidden="true">*</span>
									</label>
									<input
										id="adj-reason-{loc.id}"
										type="text"
										value={state.reason}
										oninput={(e) => {
											adjustStates = {
												...adjustStates,
												[loc.id]: { ...state, reason: (e.target as HTMLInputElement).value }
											};
										}}
										class="inventory-panel__input"
										placeholder={localText('commerce_adjustment_reason_placeholder')}
									/>
								</div>
								<button
									type="button"
									class="inventory-panel__submit-btn"
									onclick={() => submitAdjust(loc.id)}
									disabled={!state.delta || !state.reason.trim() || parseInt(state.delta) === 0 || isNaN(parseInt(state.delta))}
								>
									{localText('commerce_save_adjustment')}
								</button>
							</div>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.inventory-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.inventory-panel__summary {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		flex-wrap: wrap;
		padding: 0.875rem 1rem;
		background: var(--color-surface-subtle, #f9fafb);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
	}

	.inventory-panel__metric {
		display: flex;
		flex-direction: column;
	}

	.inventory-panel__metric-value {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text, #111827);
		font-variant-numeric: tabular-nums;
	}

	.inventory-panel__metric-label {
		font-size: 0.75rem;
		color: var(--color-muted, #6b7280);
	}

	.inventory-panel__alert {
		display: flex;
		align-items: center;
		padding: 0.25rem 0.625rem;
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.75rem;
		font-weight: 500;
	}

	.inventory-panel__alert--low {
		background: var(--color-warning-subtle, #fffbeb);
		color: var(--color-warning, #92400e);
		border: 1px solid var(--color-warning-border, #fde68a);
	}

	.inventory-panel__alert--out {
		background: var(--color-neutral-subtle, #f3f4f6);
		color: var(--color-neutral, #6b7280);
	}

	.inventory-panel__loading {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.inventory-panel__skeleton {
		height: 3.5rem;
		background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
		background-size: 200% 100%;
		border-radius: var(--radius-sm, 0.25rem);
		animation: shimmer 1.4s infinite;
	}

	@keyframes shimmer {
		0%   { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.inventory-panel__locations {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.inventory-panel__location {
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
		overflow: hidden;
	}

	.inventory-panel__location-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0.875rem;
		background: var(--color-surface, #fff);
		flex-wrap: wrap;
	}

	.inventory-panel__location-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text, #111827);
		flex: 1;
	}

	.inventory-panel__location-stats {
		display: flex;
		align-items: baseline;
		gap: 0.375rem;
	}

	.inventory-panel__stock-num {
		font-size: 1rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.inventory-panel__stock-num--ok    { color: var(--color-success, #166534); }
	.inventory-panel__stock-num--low   { color: var(--color-warning, #92400e); }
	.inventory-panel__stock-num--out   { color: var(--color-neutral, #6b7280); }

	.inventory-panel__stock-meta {
		font-size: 0.75rem;
		color: var(--color-muted, #9ca3af);
	}

	.inventory-panel__adjust-toggle {
		height: 1.75rem;
		padding: 0 0.625rem;
		background: var(--color-surface-subtle, #f9fafb);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.75rem;
		cursor: pointer;
		color: var(--color-text, #374151);
		transition: background 0.1s;
	}

	.inventory-panel__adjust-toggle:hover {
		background: var(--color-surface-hover, #f3f4f6);
	}

	.inventory-panel__adjust-toggle:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 1px;
	}

	.inventory-panel__thresholds {
		display: flex;
		gap: 1rem;
		padding: 0.25rem 0.875rem;
		background: var(--color-surface-subtle, #f9fafb);
		border-top: 1px solid var(--color-border, #f3f4f6);
	}

	.inventory-panel__threshold {
		font-size: 0.75rem;
		color: var(--color-muted, #6b7280);
	}

	.inventory-panel__adjust-panel {
		padding: 0.875rem;
		background: var(--color-surface-subtle, #f9fafb);
		border-top: 1px solid var(--color-border, #e5e7eb);
	}

	.inventory-panel__adjust-fields {
		display: flex;
		gap: 0.625rem;
		align-items: flex-end;
		flex-wrap: wrap;
	}

	.inventory-panel__adjust-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
		min-width: 120px;
	}

	.inventory-panel__label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text, #374151);
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.inventory-panel__label-hint {
		font-weight: 400;
		color: var(--color-muted, #9ca3af);
	}

	.inventory-panel__required {
		color: var(--color-danger, #dc2626);
	}

	.inventory-panel__input {
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

	.inventory-panel__input:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px var(--color-primary-subtle, #eff6ff);
	}

	.inventory-panel__submit-btn {
		height: 2.125rem;
		padding: 0 0.875rem;
		background: var(--color-primary, #2563eb);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: background 0.12s;
	}

	.inventory-panel__submit-btn:hover:not(:disabled) {
		background: var(--color-primary-hover, #1d4ed8);
	}

	.inventory-panel__submit-btn:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.inventory-panel__submit-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
	}
</style>
