<script lang="ts">
	import type { MetricSnapshot, Money, StoreRole } from '$lib/type/commerce.js';
	import { localText } from 'svelte-hermes';
	import { untrack } from 'svelte';
	import PriceDisplay from './PriceDisplay.svelte';

	let {
		snapshots,
		loading = false,
		locale = 'en',
		role = 'owner',
		customFrom = '',
		customTo = '',
		oncustomrange,
	}: {
		snapshots: MetricSnapshot[];
		loading?: boolean;
		locale?: string;
		role?: StoreRole;
		customFrom?: string;
		customTo?: string;
		oncustomrange?: (from: string, to: string) => void;
	} = $props();

	const visibleMetrics: Record<StoreRole, string[]> = {
		owner:       ['revenue', 'orderCount', 'averageOrderValue', 'newCustomerCount'],
		manager:     ['revenue', 'orderCount', 'averageOrderValue', 'newCustomerCount'],
		cs_agent:    ['orderCount', 'newCustomerCount'],
		fulfillment: ['orderCount'],
	};

	const roleMetrics = $derived(visibleMetrics[role] ?? visibleMetrics.owner);

	const today = $derived(snapshots.find(s => s.period === 'today'));
	const mtd = $derived(snapshots.find(s => s.period === 'mtd'));
	const custom = $derived(snapshots.find(s => s.period === 'custom'));

	function formatExact(n: number): string {
		return new Intl.NumberFormat(locale).format(n);
	}

	let customFromInput = $state(untrack(() => customFrom));
	let customToInput = $state(untrack(() => customTo));

	function applyCustomRange() {
		if (customFromInput && customToInput) {
			oncustomrange?.(customFromInput, customToInput);
		}
	}
</script>

<div class="dashboard-metric" aria-label={localText('commerce_dashboard_metrics')}>
	<!-- Custom range picker -->
	{#if role === 'owner' || role === 'manager'}
		<div class="dashboard-metric__range-picker">
			<div class="dashboard-metric__range-fields">
				<label class="dashboard-metric__range-label" for="dm-from">
					{localText('commerce_date_from')}
				</label>
				<input
					id="dm-from"
					type="date"
					bind:value={customFromInput}
					class="dashboard-metric__date-input"
					aria-label={localText('commerce_date_from')}
				/>
				<label class="dashboard-metric__range-label" for="dm-to">
					{localText('commerce_date_to')}
				</label>
				<input
					id="dm-to"
					type="date"
					bind:value={customToInput}
					class="dashboard-metric__date-input"
					aria-label={localText('commerce_date_to')}
				/>
				<button
					type="button"
					class="dashboard-metric__range-btn"
					onclick={applyCustomRange}
					disabled={!customFromInput || !customToInput}
				>
					{localText('commerce_apply')}
				</button>
			</div>
		</div>
	{/if}

	{#if loading}
		<div class="dashboard-metric__grid" aria-busy="true" aria-label={localText('commerce_loading')}>
			{#each { length: 4 } as _, i (i)}
				<div class="dashboard-metric__skeleton" aria-hidden="true"></div>
			{/each}
		</div>
	{:else}
		<div class="dashboard-metric__grid">
			{#if roleMetrics.includes('revenue')}
				<div class="dashboard-metric__card" aria-label={localText('commerce_metric_revenue')}>
					<h3 class="dashboard-metric__card-title">{localText('commerce_metric_revenue')}</h3>
					<div class="dashboard-metric__values">
						{#if today}
							<div class="dashboard-metric__value-group">
								<span class="dashboard-metric__period-label">{localText('commerce_period_today')}</span>
								<PriceDisplay price={today.revenue} {locale} size="lg" />
							</div>
						{/if}
						{#if mtd}
							<div class="dashboard-metric__value-group">
								<span class="dashboard-metric__period-label">{localText('commerce_period_mtd')}</span>
								<PriceDisplay price={mtd.revenue} {locale} size="md" />
							</div>
						{/if}
						{#if custom}
							<div class="dashboard-metric__value-group">
								<span class="dashboard-metric__period-label">{localText('commerce_period_custom')}</span>
								<PriceDisplay price={custom.revenue} {locale} size="md" />
							</div>
						{/if}
					</div>
				</div>
			{/if}

			{#if roleMetrics.includes('orderCount')}
				<div class="dashboard-metric__card" aria-label={localText('commerce_metric_orders')}>
					<h3 class="dashboard-metric__card-title">{localText('commerce_metric_orders')}</h3>
					<div class="dashboard-metric__values">
						{#if today}
							<div class="dashboard-metric__value-group">
								<span class="dashboard-metric__period-label">{localText('commerce_period_today')}</span>
								<span class="dashboard-metric__count dashboard-metric__count--lg">{formatExact(today.orderCount)}</span>
							</div>
						{/if}
						{#if mtd}
							<div class="dashboard-metric__value-group">
								<span class="dashboard-metric__period-label">{localText('commerce_period_mtd')}</span>
								<span class="dashboard-metric__count">{formatExact(mtd.orderCount)}</span>
							</div>
						{/if}
						{#if custom}
							<div class="dashboard-metric__value-group">
								<span class="dashboard-metric__period-label">{localText('commerce_period_custom')}</span>
								<span class="dashboard-metric__count">{formatExact(custom.orderCount)}</span>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			{#if roleMetrics.includes('averageOrderValue')}
				<div class="dashboard-metric__card" aria-label={localText('commerce_metric_aov')}>
					<h3 class="dashboard-metric__card-title">{localText('commerce_metric_aov')}</h3>
					<div class="dashboard-metric__values">
						{#if today}
							<div class="dashboard-metric__value-group">
								<span class="dashboard-metric__period-label">{localText('commerce_period_today')}</span>
								<PriceDisplay price={today.averageOrderValue} {locale} size="lg" />
							</div>
						{/if}
						{#if mtd}
							<div class="dashboard-metric__value-group">
								<span class="dashboard-metric__period-label">{localText('commerce_period_mtd')}</span>
								<PriceDisplay price={mtd.averageOrderValue} {locale} size="md" />
							</div>
						{/if}
						{#if custom}
							<div class="dashboard-metric__value-group">
								<span class="dashboard-metric__period-label">{localText('commerce_period_custom')}</span>
								<PriceDisplay price={custom.averageOrderValue} {locale} size="md" />
							</div>
						{/if}
					</div>
				</div>
			{/if}

			{#if roleMetrics.includes('newCustomerCount')}
				<div class="dashboard-metric__card" aria-label={localText('commerce_metric_new_customers')}>
					<h3 class="dashboard-metric__card-title">{localText('commerce_metric_new_customers')}</h3>
					<div class="dashboard-metric__values">
						{#if today}
							<div class="dashboard-metric__value-group">
								<span class="dashboard-metric__period-label">{localText('commerce_period_today')}</span>
								<span class="dashboard-metric__count dashboard-metric__count--lg">{formatExact(today.newCustomerCount)}</span>
							</div>
						{/if}
						{#if mtd}
							<div class="dashboard-metric__value-group">
								<span class="dashboard-metric__period-label">{localText('commerce_period_mtd')}</span>
								<span class="dashboard-metric__count">{formatExact(mtd.newCustomerCount)}</span>
							</div>
						{/if}
						{#if custom}
							<div class="dashboard-metric__value-group">
								<span class="dashboard-metric__period-label">{localText('commerce_period_custom')}</span>
								<span class="dashboard-metric__count">{formatExact(custom.newCustomerCount)}</span>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.dashboard-metric {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.dashboard-metric__range-picker {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.dashboard-metric__range-fields {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.dashboard-metric__range-label {
		font-size: 0.75rem;
		color: var(--color-muted, #6b7280);
		white-space: nowrap;
	}

	.dashboard-metric__date-input {
		height: 2rem;
		padding: 0 0.5rem;
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.875rem;
		background: var(--color-surface, #fff);
		color: var(--color-text, #111827);
	}

	.dashboard-metric__date-input:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
	}

	.dashboard-metric__range-btn {
		height: 2rem;
		padding: 0 0.875rem;
		background: var(--color-primary, #2563eb);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.8125rem;
		cursor: pointer;
		transition: background 0.12s;
	}

	.dashboard-metric__range-btn:hover:not(:disabled) {
		background: var(--color-primary-hover, #1d4ed8);
	}

	.dashboard-metric__range-btn:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.dashboard-metric__range-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
	}

	.dashboard-metric__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
		gap: 1rem;
	}

	.dashboard-metric__skeleton {
		height: 7rem;
		border-radius: var(--radius-lg, 0.75rem);
		background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
		background-size: 200% 100%;
		animation: shimmer 1.4s infinite;
	}

	@keyframes shimmer {
		0%   { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.dashboard-metric__card {
		padding: 1rem 1.25rem;
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-lg, 0.75rem);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.dashboard-metric__card-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-muted, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
	}

	.dashboard-metric__values {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.dashboard-metric__value-group {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.dashboard-metric__period-label {
		font-size: 0.75rem;
		color: var(--color-muted, #9ca3af);
		white-space: nowrap;
	}

	.dashboard-metric__count {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--color-text, #111827);
		font-size: 0.9375rem;
	}

	.dashboard-metric__count--lg {
		font-size: 1.25rem;
	}
</style>
