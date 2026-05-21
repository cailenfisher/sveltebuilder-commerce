<script lang="ts">
	import type { BulkEditField, BulkEditJob, Money } from '$lib/type/commerce.js';
	import { localText } from 'svelte-hermes';

	let {
		selectedIds,
		currency = 'USD',
		onsubmit,
		onundo,
		lastJob = null,
		onscheduled,
	}: {
		selectedIds: number[];
		currency?: string;
		onsubmit: (field: BulkEditField, value: unknown, scheduledAt?: string, expiresAt?: string) => void;
		onundo?: (jobId: string) => void;
		lastJob?: BulkEditJob | null;
		onscheduled?: (field: BulkEditField, value: unknown, scheduledAt: string, expiresAt?: string) => void;
	} = $props();

	let field = $state<BulkEditField>('price');
	let priceAmount = $state<string>('');
	let priceMode = $state<'set' | 'increase_pct' | 'decrease_pct'>('set');
	let stockAmount = $state<string>('');
	let stockMode = $state<'set' | 'adjust'>('set');
	let publishedValue = $state<'true' | 'false'>('true');
	let featuredValue = $state<'true' | 'false'>('false');

	let useSchedule = $state(false);
	let scheduledAt = $state('');
	let expiresAt = $state('');

	let errors = $state<Record<string, string>>({});

	function validate(): boolean {
		const next: Record<string, string> = {};
		if (field === 'price' || field === 'compare_at_price') {
			if (!priceAmount || isNaN(parseFloat(priceAmount))) {
				next.value = localText('commerce_error_invalid_price');
			}
		}
		if (field === 'stock') {
			if (!stockAmount || isNaN(parseInt(stockAmount))) {
				next.value = localText('commerce_error_invalid_stock');
			}
		}
		if (useSchedule) {
			if (!scheduledAt) next.scheduledAt = localText('commerce_error_scheduled_at_required');
		}
		errors = next;
		return Object.keys(next).length === 0;
	}

	function buildValue(): unknown {
		if (field === 'price' || field === 'compare_at_price') {
			const amount = Math.round(parseFloat(priceAmount) * 100);
			return { mode: priceMode, amount, currency };
		}
		if (field === 'stock') {
			return { mode: stockMode, amount: parseInt(stockAmount) };
		}
		if (field === 'published') return publishedValue === 'true';
		if (field === 'featured') return featuredValue === 'true';
		return null;
	}

	function handleSubmit() {
		if (!validate()) return;
		const value = buildValue();
		if (useSchedule) {
			onscheduled?.(field, value, scheduledAt, expiresAt || undefined);
			onsubmit(field, value, scheduledAt, expiresAt || undefined);
		} else {
			onsubmit(field, value);
		}
	}
</script>

<div class="bulk-toolbar" role="region" aria-label={localText('commerce_bulk_edit')}>
	<div class="bulk-toolbar__header">
		<span class="bulk-toolbar__count">
			{localText('commerce_n_selected', { count: selectedIds.length })}
		</span>

		{#if lastJob && lastJob.canUndo && onundo}
			<button
				type="button"
				class="bulk-toolbar__undo-btn"
				onclick={() => onundo?.(lastJob!.id)}
			>
				{localText('commerce_undo_last')}
			</button>
		{/if}
	</div>

	<!-- Previous job result -->
	{#if lastJob && (lastJob.status === 'done' || lastJob.status === 'failed')}
		<div
			class="bulk-toolbar__result {lastJob.failureCount > 0 ? 'bulk-toolbar__result--partial' : 'bulk-toolbar__result--success'}"
			role="status"
			aria-live="polite"
		>
			{#if lastJob.failureCount === 0}
				<span>{localText('commerce_bulk_all_success', { count: lastJob.successCount })}</span>
			{:else}
				<span>{localText('commerce_bulk_partial', { done: lastJob.successCount, failed: lastJob.failureCount })}</span>
				{#if lastJob.failures.length > 0}
					<details class="bulk-toolbar__failures">
						<summary class="bulk-toolbar__failures-summary">
							{localText('commerce_bulk_show_failures')}
						</summary>
						<ul class="bulk-toolbar__failures-list">
							{#each lastJob.failures as f (f.productId)}
								<li>ID {f.productId}: {f.reason}</li>
							{/each}
						</ul>
					</details>
				{/if}
			{/if}
		</div>
	{/if}

	{#if lastJob?.status === 'running'}
		<div class="bulk-toolbar__progress" role="status" aria-live="polite" aria-label={localText('commerce_bulk_running')}>
			<div class="bulk-toolbar__progress-bar">
				<div class="bulk-toolbar__progress-fill bulk-toolbar__progress-fill--indeterminate"></div>
			</div>
			<span class="bulk-toolbar__progress-text">{localText('commerce_bulk_running')}</span>
		</div>
	{/if}

	<form
		onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}
		class="bulk-toolbar__form"
		novalidate
	>
		<div class="bulk-toolbar__row">
			<div class="bulk-toolbar__field">
				<label class="bulk-toolbar__label" for="bt-field">
					{localText('commerce_bulk_field_label')}
				</label>
				<select id="bt-field" bind:value={field} class="bulk-toolbar__select">
					<option value="price">{localText('commerce_field_price')}</option>
					<option value="compare_at_price">{localText('commerce_field_compare_at_price')}</option>
					<option value="stock">{localText('commerce_field_stock')}</option>
					<option value="published">{localText('commerce_field_published')}</option>
					<option value="featured">{localText('commerce_field_featured')}</option>
				</select>
			</div>

			{#if field === 'price' || field === 'compare_at_price'}
				<div class="bulk-toolbar__field">
					<label class="bulk-toolbar__label" for="bt-price-mode">
						{localText('commerce_bulk_change_mode')}
					</label>
					<select id="bt-price-mode" bind:value={priceMode} class="bulk-toolbar__select">
						<option value="set">{localText('commerce_price_mode_set')}</option>
						<option value="increase_pct">{localText('commerce_price_mode_increase')}</option>
						<option value="decrease_pct">{localText('commerce_price_mode_decrease')}</option>
					</select>
				</div>
				<div class="bulk-toolbar__field">
					<label class="bulk-toolbar__label" for="bt-price">
						{priceMode === 'set'
							? localText('commerce_new_price')
							: localText('commerce_percentage')}
					</label>
					<input
						id="bt-price"
						type="number"
						bind:value={priceAmount}
						min="0"
						step={priceMode === 'set' ? '0.01' : '1'}
						class="bulk-toolbar__input"
						aria-describedby={errors.value ? 'bt-value-err' : undefined}
						aria-invalid={errors.value ? 'true' : undefined}
					/>
				</div>
			{:else if field === 'stock'}
				<div class="bulk-toolbar__field">
					<label class="bulk-toolbar__label" for="bt-stock-mode">
						{localText('commerce_bulk_change_mode')}
					</label>
					<select id="bt-stock-mode" bind:value={stockMode} class="bulk-toolbar__select">
						<option value="set">{localText('commerce_stock_mode_set')}</option>
						<option value="adjust">{localText('commerce_stock_mode_adjust')}</option>
					</select>
				</div>
				<div class="bulk-toolbar__field">
					<label class="bulk-toolbar__label" for="bt-stock">
						{localText('commerce_new_value')}
					</label>
					<input
						id="bt-stock"
						type="number"
						bind:value={stockAmount}
						class="bulk-toolbar__input"
						aria-describedby={errors.value ? 'bt-value-err' : undefined}
						aria-invalid={errors.value ? 'true' : undefined}
					/>
				</div>
			{:else if field === 'published'}
				<div class="bulk-toolbar__field">
					<label class="bulk-toolbar__label" for="bt-published">
						{localText('commerce_set_to')}
					</label>
					<select id="bt-published" bind:value={publishedValue} class="bulk-toolbar__select">
						<option value="true">{localText('commerce_published_yes')}</option>
						<option value="false">{localText('commerce_published_no')}</option>
					</select>
				</div>
			{:else if field === 'featured'}
				<div class="bulk-toolbar__field">
					<label class="bulk-toolbar__label" for="bt-featured">
						{localText('commerce_set_to')}
					</label>
					<select id="bt-featured" bind:value={featuredValue} class="bulk-toolbar__select">
						<option value="true">{localText('commerce_yes')}</option>
						<option value="false">{localText('commerce_no')}</option>
					</select>
				</div>
			{/if}
		</div>

		{#if errors.value}
			<p id="bt-value-err" class="bulk-toolbar__error" role="alert">{errors.value}</p>
		{/if}

		<!-- Scheduled edit toggle -->
		<div class="bulk-toolbar__schedule-toggle">
			<label class="bulk-toolbar__check-label">
				<input type="checkbox" bind:checked={useSchedule} class="bulk-toolbar__checkbox" />
				{localText('commerce_schedule_edit')}
			</label>
		</div>

		{#if useSchedule}
			<div class="bulk-toolbar__row">
				<div class="bulk-toolbar__field">
					<label class="bulk-toolbar__label" for="bt-scheduled-at">
						{localText('commerce_scheduled_at')}
						<span aria-hidden="true">*</span>
					</label>
					<input
						id="bt-scheduled-at"
						type="datetime-local"
						bind:value={scheduledAt}
						class="bulk-toolbar__input"
						aria-describedby={errors.scheduledAt ? 'bt-sched-err' : undefined}
						aria-invalid={errors.scheduledAt ? 'true' : undefined}
					/>
					{#if errors.scheduledAt}
						<p id="bt-sched-err" class="bulk-toolbar__error" role="alert">{errors.scheduledAt}</p>
					{/if}
				</div>
				<div class="bulk-toolbar__field">
					<label class="bulk-toolbar__label" for="bt-expires-at">
						{localText('commerce_expires_at')}
					</label>
					<input
						id="bt-expires-at"
						type="datetime-local"
						bind:value={expiresAt}
						class="bulk-toolbar__input"
					/>
				</div>
			</div>
		{/if}

		<div class="bulk-toolbar__actions">
			<button
				type="submit"
				class="bulk-toolbar__submit-btn"
				disabled={selectedIds.length === 0 || lastJob?.status === 'running'}
			>
				{useSchedule ? localText('commerce_schedule_bulk') : localText('commerce_apply_bulk')}
			</button>
		</div>
	</form>
</div>

<style>
	.bulk-toolbar {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--color-primary-subtle, #eff6ff);
		border: 1px solid var(--color-primary-border, #bfdbfe);
		border-radius: var(--radius-lg, 0.75rem);
	}

	.bulk-toolbar__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.bulk-toolbar__count {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-primary, #1d4ed8);
	}

	.bulk-toolbar__undo-btn {
		background: none;
		border: 1px solid var(--color-primary, #2563eb);
		color: var(--color-primary, #2563eb);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.8125rem;
		cursor: pointer;
		transition: background 0.1s;
	}

	.bulk-toolbar__undo-btn:hover {
		background: var(--color-surface, #fff);
	}

	.bulk-toolbar__undo-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
	}

	.bulk-toolbar__result {
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.875rem;
	}

	.bulk-toolbar__result--success {
		background: var(--color-success-subtle, #f0fdf4);
		color: var(--color-success, #166534);
		border: 1px solid var(--color-success-border, #bbf7d0);
	}

	.bulk-toolbar__result--partial {
		background: var(--color-warning-subtle, #fffbeb);
		color: var(--color-warning, #92400e);
		border: 1px solid var(--color-warning-border, #fde68a);
	}

	.bulk-toolbar__failures {
		margin-top: 0.375rem;
	}

	.bulk-toolbar__failures-summary {
		font-size: 0.8125rem;
		cursor: pointer;
		color: inherit;
	}

	.bulk-toolbar__failures-list {
		margin: 0.25rem 0 0 1rem;
		padding: 0;
		font-size: 0.8125rem;
	}

	.bulk-toolbar__progress {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.bulk-toolbar__progress-bar {
		flex: 1;
		height: 4px;
		background: var(--color-border, #e5e7eb);
		border-radius: 2px;
		overflow: hidden;
	}

	.bulk-toolbar__progress-fill {
		height: 100%;
		background: var(--color-primary, #2563eb);
	}

	.bulk-toolbar__progress-fill--indeterminate {
		width: 40%;
		animation: indeterminate 1.2s ease-in-out infinite;
	}

	@keyframes indeterminate {
		0%   { transform: translateX(-100%); }
		100% { transform: translateX(350%); }
	}

	.bulk-toolbar__progress-text {
		font-size: 0.8125rem;
		color: var(--color-primary, #1d4ed8);
		white-space: nowrap;
	}

	.bulk-toolbar__form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.bulk-toolbar__row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.625rem;
		align-items: flex-end;
	}

	.bulk-toolbar__field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 120px;
	}

	.bulk-toolbar__label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text, #374151);
	}

	.bulk-toolbar__input {
		height: 2.125rem;
		padding: 0 0.5rem;
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.875rem;
		color: var(--color-text, #111827);
		background: var(--color-surface, #fff);
		box-sizing: border-box;
		width: 100%;
	}

	.bulk-toolbar__input:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px var(--color-primary-subtle, #eff6ff);
	}

	.bulk-toolbar__input[aria-invalid="true"] {
		border-color: var(--color-danger, #dc2626);
	}

	.bulk-toolbar__select {
		height: 2.125rem;
		padding: 0 0.5rem;
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.875rem;
		background: var(--color-surface, #fff);
		cursor: pointer;
		width: 100%;
	}

	.bulk-toolbar__select:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px var(--color-primary-subtle, #eff6ff);
	}

	.bulk-toolbar__error {
		font-size: 0.75rem;
		color: var(--color-danger, #dc2626);
		margin: 0;
	}

	.bulk-toolbar__schedule-toggle {
		padding-top: 0.25rem;
	}

	.bulk-toolbar__check-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-text, #374151);
		cursor: pointer;
	}

	.bulk-toolbar__checkbox {
		width: 1rem;
		height: 1rem;
		accent-color: var(--color-primary, #2563eb);
		cursor: pointer;
	}

	.bulk-toolbar__actions {
		display: flex;
		justify-content: flex-end;
	}

	.bulk-toolbar__submit-btn {
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

	.bulk-toolbar__submit-btn:hover:not(:disabled) {
		background: var(--color-primary-hover, #1d4ed8);
	}

	.bulk-toolbar__submit-btn:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.bulk-toolbar__submit-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
	}
</style>
