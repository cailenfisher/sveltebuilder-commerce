<script lang="ts">
	import type { Collection, CollectionRule, CollectionRuleField, CollectionRuleOperator } from '$lib/type/commerce.js';
	import { localText } from 'svelte-hermes';
	import { untrack } from 'svelte';

	let {
		collection,
		previewCount = null,
		previewLoading = false,
		onchange,
		onpreviewrequest,
	}: {
		collection: Omit<Collection, 'id' | 'storeId'>;
		previewCount?: number | null;
		previewLoading?: boolean;
		onchange: (updated: Omit<Collection, 'id' | 'storeId'>) => void;
		onpreviewrequest?: (rules: CollectionRule[], mode: 'all' | 'any') => void;
	} = $props();

	const fields: { value: CollectionRuleField; label: string }[] = [
		{ value: 'product.tag', label: 'Tag' },
		{ value: 'product.price', label: 'Price' },
		{ value: 'product.inventory', label: 'Inventory' },
		{ value: 'product.category', label: 'Category' },
	];

	const operatorsByField: Record<CollectionRuleField, { value: CollectionRuleOperator; label: string }[]> = {
		'product.tag': [
			{ value: 'equals', label: 'equals (exact)' },
			{ value: 'contains', label: 'contains word' },
			{ value: 'starts_with', label: 'starts with' },
			{ value: 'ends_with', label: 'ends with' },
			{ value: 'not_equals', label: 'does not equal' },
		],
		'product.price': [
			{ value: 'greater_than', label: 'greater than' },
			{ value: 'less_than', label: 'less than' },
			{ value: 'equals', label: 'equals' },
		],
		'product.inventory': [
			{ value: 'greater_than', label: 'greater than' },
			{ value: 'less_than', label: 'less than' },
			{ value: 'equals', label: 'equals' },
		],
		'product.category': [
			{ value: 'equals', label: 'equals (exact)' },
			{ value: 'not_equals', label: 'does not equal' },
		],
	};

	let rules = $state<CollectionRule[]>(untrack(() => collection.rules.length > 0 ? [...collection.rules] : []));
	let ruleMode = $state<'all' | 'any'>(untrack(() => collection.ruleMode ?? 'all'));
	let manual = $state(untrack(() => collection.ruleMode === null));

	function addRule() {
		rules = [
			...rules,
			{ field: 'product.tag', operator: 'equals', value: '' },
		];
		emitChange();
	}

	function removeRule(index: number) {
		rules = rules.filter((_, i) => i !== index);
		emitChange();
	}

	function updateRule(index: number, patch: Partial<CollectionRule>) {
		rules = rules.map((r, i) => {
			if (i !== index) return r;
			const updated = { ...r, ...patch };
			if (patch.field && patch.field !== r.field) {
				updated.operator = operatorsByField[patch.field][0].value;
				updated.value = '';
			}
			return updated;
		});
		emitChange();
	}

	function emitChange() {
		onchange({ ruleMode: manual ? null : ruleMode, rules });
	}

	function handleModeChange(v: 'all' | 'any') {
		ruleMode = v;
		emitChange();
	}

	function handleManualChange(v: boolean) {
		manual = v;
		if (v) rules = [];
		emitChange();
	}

	function requestPreview() {
		onpreviewrequest?.(rules, ruleMode);
	}
</script>

<div class="rule-builder" aria-label={localText('commerce_collection_rule_builder')}>
	<!-- Manual vs automatic toggle -->
	<fieldset class="rule-builder__mode-set">
		<legend class="rule-builder__section-title">{localText('commerce_collection_type')}</legend>
		<div class="rule-builder__radio-group">
			<label class="rule-builder__radio-label">
				<input
					type="radio"
					name="rbc-manual"
					value="false"
					checked={!manual}
					onchange={() => handleManualChange(false)}
					class="rule-builder__radio"
				/>
				{localText('commerce_collection_automated')}
			</label>
			<label class="rule-builder__radio-label">
				<input
					type="radio"
					name="rbc-manual"
					value="true"
					checked={manual}
					onchange={() => handleManualChange(true)}
					class="rule-builder__radio"
				/>
				{localText('commerce_collection_manual')}
			</label>
		</div>
	</fieldset>

	{#if !manual}
		<!-- Match mode -->
		<div class="rule-builder__match-mode">
			<span class="rule-builder__match-label">{localText('commerce_collection_products_matching')}</span>
			<select
				bind:value={ruleMode}
				onchange={() => handleModeChange(ruleMode)}
				class="rule-builder__select rule-builder__select--inline"
				aria-label={localText('commerce_collection_match_mode')}
			>
				<option value="all">{localText('commerce_match_all')}</option>
				<option value="any">{localText('commerce_match_any')}</option>
			</select>
			<span>{localText('commerce_collection_of_the_conditions')}</span>
		</div>

		<!-- Rules list -->
		{#if rules.length > 0}
			<ul class="rule-builder__rules" aria-label={localText('commerce_collection_rules')}>
				{#each rules as rule, i (i)}
					<li class="rule-builder__rule">
						<div class="rule-builder__rule-fields">
							<select
								value={rule.field}
								onchange={(e) => updateRule(i, { field: (e.target as HTMLSelectElement).value as CollectionRuleField })}
								class="rule-builder__select"
								aria-label={localText('commerce_rule_field_label')}
							>
								{#each fields as f (f.value)}
									<option value={f.value}>{f.label}</option>
								{/each}
							</select>

							<select
								value={rule.operator}
								onchange={(e) => updateRule(i, { operator: (e.target as HTMLSelectElement).value as CollectionRuleOperator })}
								class="rule-builder__select"
								aria-label={localText('commerce_rule_operator_label')}
							>
								{#each operatorsByField[rule.field] as op (op.value)}
									<option value={op.value}>{op.label}</option>
								{/each}
							</select>

							<input
								type={rule.field === 'product.price' || rule.field === 'product.inventory' ? 'number' : 'text'}
								value={rule.value}
								oninput={(e) => updateRule(i, { value: (e.target as HTMLInputElement).value })}
								class="rule-builder__input"
								placeholder={localText('commerce_rule_value_placeholder')}
								aria-label={localText('commerce_rule_value_label')}
								min={rule.field === 'product.price' || rule.field === 'product.inventory' ? '0' : undefined}
							/>
						</div>

						<button
							type="button"
							class="rule-builder__remove-btn"
							onclick={() => removeRule(i)}
							aria-label={localText('commerce_remove_rule_n', { n: i + 1 })}
						>
							<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
								<path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
							</svg>
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="rule-builder__no-rules">{localText('commerce_no_rules_yet')}</p>
		{/if}

		<button type="button" class="rule-builder__add-btn" onclick={addRule}>
			+ {localText('commerce_add_rule')}
		</button>

		<!-- Live preview -->
		{#if rules.length > 0 && onpreviewrequest}
			<div class="rule-builder__preview">
				<button
					type="button"
					class="rule-builder__preview-btn"
					onclick={requestPreview}
					disabled={previewLoading}
				>
					{localText('commerce_preview_matches')}
				</button>

				{#if previewLoading}
					<span class="rule-builder__preview-loading">{localText('commerce_loading')}</span>
				{:else if previewCount !== null}
					<span class="rule-builder__preview-count" aria-live="polite">
						{localText('commerce_preview_product_count', { count: previewCount })}
					</span>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.rule-builder {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.rule-builder__section-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text, #111827);
		margin-bottom: 0.5rem;
	}

	.rule-builder__mode-set {
		border: none;
		padding: 0;
		margin: 0;
	}

	.rule-builder__radio-group {
		display: flex;
		gap: 1.5rem;
	}

	.rule-builder__radio-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-text, #374151);
		cursor: pointer;
	}

	.rule-builder__radio {
		width: 1rem;
		height: 1rem;
		cursor: pointer;
		accent-color: var(--color-primary, #2563eb);
	}

	.rule-builder__match-mode {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-text, #374151);
		flex-wrap: wrap;
	}

	.rule-builder__match-label {
		font-weight: 500;
	}

	.rule-builder__select {
		height: 2.125rem;
		padding: 0 0.5rem;
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.875rem;
		background: var(--color-surface, #fff);
		cursor: pointer;
	}

	.rule-builder__select--inline {
		width: auto;
	}

	.rule-builder__select:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px var(--color-primary-subtle, #eff6ff);
	}

	.rule-builder__input {
		flex: 1;
		height: 2.125rem;
		padding: 0 0.5rem;
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.875rem;
		color: var(--color-text, #111827);
		background: var(--color-surface, #fff);
		min-width: 100px;
	}

	.rule-builder__input:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px var(--color-primary-subtle, #eff6ff);
	}

	.rule-builder__rules {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.rule-builder__rule {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.rule-builder__rule-fields {
		display: flex;
		flex: 1;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.rule-builder__remove-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		flex-shrink: 0;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-surface, #fff);
		color: var(--color-muted, #6b7280);
		cursor: pointer;
		transition: background 0.1s, color 0.1s;
	}

	.rule-builder__remove-btn:hover {
		background: var(--color-danger-subtle, #fef2f2);
		color: var(--color-danger, #dc2626);
		border-color: var(--color-danger, #dc2626);
	}

	.rule-builder__remove-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 1px;
	}

	.rule-builder__no-rules {
		font-size: 0.875rem;
		color: var(--color-muted, #9ca3af);
		padding: 0.75rem;
		text-align: center;
		border: 1px dashed var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
		margin: 0;
	}

	.rule-builder__add-btn {
		align-self: flex-start;
		background: none;
		border: 1px dashed var(--color-border, #d1d5db);
		color: var(--color-primary, #2563eb);
		padding: 0.375rem 0.75rem;
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 0.1s, border-color 0.1s;
	}

	.rule-builder__add-btn:hover {
		background: var(--color-primary-subtle, #eff6ff);
		border-color: var(--color-primary, #2563eb);
	}

	.rule-builder__add-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
	}

	.rule-builder__preview {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--color-surface-subtle, #f9fafb);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
	}

	.rule-builder__preview-btn {
		height: 2rem;
		padding: 0 0.875rem;
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.8125rem;
		cursor: pointer;
		transition: background 0.1s;
	}

	.rule-builder__preview-btn:hover:not(:disabled) {
		background: var(--color-surface-hover, #f3f4f6);
	}

	.rule-builder__preview-btn:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.rule-builder__preview-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
	}

	.rule-builder__preview-loading {
		font-size: 0.8125rem;
		color: var(--color-muted, #9ca3af);
	}

	.rule-builder__preview-count {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text, #374151);
	}
</style>
