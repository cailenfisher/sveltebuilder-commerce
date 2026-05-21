<script lang="ts">
	import type { ScheduledEdit } from '$lib/type/commerce.js';
	import { Badge, Button, Skeleton } from 'sveltebuilder-coreui';
	import { localText } from 'svelte-hermes';

	let {
		scheduled,
		loading = false,
		locale = 'en',
		oncancel,
	}: {
		scheduled: ScheduledEdit[];
		loading?: boolean;
		locale?: string;
		oncancel?: (editId: number) => void;
	} = $props();

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString(locale, {
			year: 'numeric', month: 'short', day: 'numeric',
			hour: '2-digit', minute: '2-digit',
		});
	}

	const pending = $derived(scheduled.filter(s => !s.applied));
	const applied = $derived(scheduled.filter(s => s.applied));
</script>

<div class="scheduled-edit-panel">
	<h3 class="scheduled-edit-panel__title">{localText('commerce_scheduled_edits_title')}</h3>
	<p class="scheduled-edit-panel__subtitle">{localText('commerce_scheduled_edits_subtitle')}</p>

	{#if loading}
		<div class="scheduled-edit-panel__loading" aria-busy="true" aria-label={localText('commerce_loading')}>
			{#each { length: 3 } as _, i (i)}
				<Skeleton height="3.5rem" rounded="sm" />
			{/each}
		</div>
	{:else if scheduled.length === 0}
		<p class="scheduled-edit-panel__empty" role="status">
			{localText('commerce_no_scheduled_edits')}
		</p>
	{:else}
		{#if pending.length > 0}
			<section>
				<h4 class="scheduled-edit-panel__section-title">{localText('commerce_scheduled_pending')}</h4>
				<ul class="scheduled-edit-panel__list">
					{#each pending as edit (edit.id)}
						<li class="scheduled-edit-panel__item">
							<div class="scheduled-edit-panel__item-info">
								<span class="scheduled-edit-panel__target">
									{localText(`commerce_target_type_${edit.targetType}`)} #{edit.targetId}
								</span>
								<span class="scheduled-edit-panel__field">
									{localText(`commerce_field_${edit.field}`)}: <code class="scheduled-edit-panel__value">{JSON.stringify(edit.value)}</code>
								</span>
								<span class="scheduled-edit-panel__times">
									<span>
										{localText('commerce_scheduled_at')}: <time datetime={edit.scheduledAt}>{formatDate(edit.scheduledAt)}</time>
									</span>
									{#if edit.expiresAt}
										<span>
											· {localText('commerce_expires_at')}: <time datetime={edit.expiresAt}>{formatDate(edit.expiresAt)}</time>
										</span>
									{/if}
								</span>
							</div>
							{#if oncancel}
								<Button
									type="button"
									variant="outline"
									size="xs"
									class="scheduled-edit-panel__cancel-btn"
									onclick={() => oncancel?.(edit.id)}
								>
									{localText('commerce_cancel_edit')}
								</Button>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if applied.length > 0}
			<section>
				<h4 class="scheduled-edit-panel__section-title">{localText('commerce_scheduled_applied')}</h4>
				<ul class="scheduled-edit-panel__list">
					{#each applied as edit (edit.id)}
						<li class="scheduled-edit-panel__item scheduled-edit-panel__item--applied">
							<div class="scheduled-edit-panel__item-info">
								<span class="scheduled-edit-panel__target">
									{localText(`commerce_target_type_${edit.targetType}`)} #{edit.targetId}
								</span>
								<span class="scheduled-edit-panel__field">
									{localText(`commerce_field_${edit.field}`)}: <code class="scheduled-edit-panel__value">{JSON.stringify(edit.value)}</code>
								</span>
								<span class="scheduled-edit-panel__times">
									{localText('commerce_applied_at')}: <time datetime={edit.scheduledAt}>{formatDate(edit.scheduledAt)}</time>
								</span>
							</div>
							<Badge variant="success" size="sm">{localText('commerce_applied')}</Badge>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/if}
</div>

<style>
	.scheduled-edit-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.scheduled-edit-panel__title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text, #111827);
		margin: 0;
	}

	.scheduled-edit-panel__subtitle {
		font-size: 0.8125rem;
		color: var(--color-muted, #6b7280);
		margin: 0;
	}

	.scheduled-edit-panel__loading {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.scheduled-edit-panel__empty {
		font-size: 0.875rem;
		color: var(--color-muted, #9ca3af);
		padding: 1.5rem;
		text-align: center;
		margin: 0;
		border: 1px dashed var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
	}

	.scheduled-edit-panel__section-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-muted, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.5rem;
	}

	.scheduled-edit-panel__list {
		list-style: none;
		padding: 0;
		margin: 0 0 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.scheduled-edit-panel__item {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.625rem 0.875rem;
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
	}

	.scheduled-edit-panel__item--applied {
		opacity: 0.65;
	}

	.scheduled-edit-panel__item-info {
		display: flex;
		flex-direction: column;
		gap: 0.1875rem;
		min-width: 0;
	}

	.scheduled-edit-panel__target {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text, #111827);
	}

	.scheduled-edit-panel__field {
		font-size: 0.8125rem;
		color: var(--color-text-secondary, #374151);
	}

	.scheduled-edit-panel__value {
		font-family: ui-monospace, monospace;
		font-size: 0.75rem;
		background: var(--color-surface-subtle, #f3f4f6);
		padding: 0.0625rem 0.25rem;
		border-radius: 2px;
	}

	.scheduled-edit-panel__times {
		font-size: 0.75rem;
		color: var(--color-muted, #9ca3af);
	}

	:global(.scheduled-edit-panel__cancel-btn) {
		height: 1.75rem;
		color: var(--color-danger, #dc2626);
		white-space: nowrap;
		flex-shrink: 0;
	}
</style>
