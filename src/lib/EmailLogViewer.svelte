<script lang="ts">
	import type { EmailLog, PageInfo } from '$lib/type/commerce.js';
	import { Badge, Button, Skeleton } from 'sveltebuilder-coreui';
	import { localText } from 'svelte-hermes';
	import Pagination from './internal/Pagination.svelte';

	let {
		logs,
		loading = false,
		locale = 'en',
		pageInfo,
		onpagechange,
		onresend,
	}: {
		logs: EmailLog[];
		loading?: boolean;
		locale?: string;
		pageInfo?: PageInfo;
		onpagechange?: (page: number) => void;
		onresend?: (logId: number) => void;
	} = $props();

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString(locale, {
			year: 'numeric', month: 'short', day: 'numeric',
			hour: '2-digit', minute: '2-digit',
		});
	}

	function statusVariant(status: string): 'secondary' | 'success' | 'warning' | 'danger' {
		if (status === 'sent') return 'success';
		if (status === 'failed') return 'danger';
		if (status === 'bounced') return 'warning';
		return 'secondary';
	}
</script>

<div class="email-log-viewer">
	<div class="email-log-viewer__header">
		<h3 class="email-log-viewer__title">{localText('commerce_email_log_title')}</h3>
		<p class="email-log-viewer__subtitle">{localText('commerce_email_log_subtitle')}</p>
	</div>

	{#if loading}
		<div class="email-log-viewer__loading" aria-busy="true" aria-label={localText('commerce_loading')}>
			{#each { length: 5 } as _, i (i)}
				<Skeleton height="2.5rem" rounded="sm" />
			{/each}
		</div>
	{:else if logs.length === 0}
		<p class="email-log-viewer__empty" role="status">
			{localText('commerce_no_emails_sent')}
		</p>
	{:else}
		<div class="email-log-viewer__scroll" role="region" aria-label={localText('commerce_email_log_title')}>
			<table class="email-log-viewer__table">
				<thead>
					<tr>
						<th class="email-log-viewer__th" scope="col">{localText('commerce_email_col_status')}</th>
						<th class="email-log-viewer__th" scope="col">{localText('commerce_email_col_template')}</th>
						<th class="email-log-viewer__th" scope="col">{localText('commerce_email_col_recipient')}</th>
						<th class="email-log-viewer__th" scope="col">{localText('commerce_email_col_sent_at')}</th>
						<th class="email-log-viewer__th" scope="col">{localText('commerce_email_col_order')}</th>
						<th class="email-log-viewer__th" scope="col"></th>
					</tr>
				</thead>
				<tbody>
					{#each logs as log (log.id)}
						<tr class="email-log-viewer__row">
							<td class="email-log-viewer__td">
								<Badge variant={statusVariant(log.status)} size="md">
									{localText(`commerce_email_status_${log.status}`)}
								</Badge>
							</td>
							<td class="email-log-viewer__td email-log-viewer__td--mono">
								{log.templateSlug}
							</td>
							<td class="email-log-viewer__td">
								{log.recipient}
							</td>
							<td class="email-log-viewer__td email-log-viewer__td--muted">
								{#if log.sentAt}
									<time datetime={log.sentAt}>{formatDate(log.sentAt)}</time>
								{:else}
									—
								{/if}
							</td>
							<td class="email-log-viewer__td email-log-viewer__td--muted">
								{#if log.orderId}
									#{log.orderId}
								{:else}
									—
								{/if}
							</td>
							<td class="email-log-viewer__td email-log-viewer__td--actions">
								{#if onresend && (log.status === 'failed' || log.status === 'bounced')}
									<Button
										type="button"
										variant="ghost"
										size="xs"
										onclick={() => onresend?.(log.id)}
									>
										{localText('commerce_resend_email')}
									</Button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if pageInfo && onpagechange}
		<Pagination {pageInfo} onchange={onpagechange} />
	{/if}
</div>

<style>
	.email-log-viewer {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.email-log-viewer__header {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.email-log-viewer__title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text, #111827);
		margin: 0;
	}

	.email-log-viewer__subtitle {
		font-size: 0.8125rem;
		color: var(--color-muted, #6b7280);
		margin: 0;
	}

	.email-log-viewer__loading {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.email-log-viewer__empty {
		font-size: 0.875rem;
		color: var(--color-muted, #9ca3af);
		padding: 1.5rem;
		text-align: center;
		margin: 0;
		border: 1px dashed var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
	}

	.email-log-viewer__scroll {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.email-log-viewer__table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.email-log-viewer__th {
		padding: 0.5rem 0.75rem;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-muted, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		background: var(--color-surface-subtle, #f9fafb);
		border-bottom: 1px solid var(--color-border, #e5e7eb);
		white-space: nowrap;
	}

	.email-log-viewer__row {
		border-bottom: 1px solid var(--color-border-subtle, #f3f4f6);
	}

	.email-log-viewer__row:last-child {
		border-bottom: none;
	}

	.email-log-viewer__td {
		padding: 0.625rem 0.75rem;
		color: var(--color-text, #374151);
		vertical-align: middle;
	}

	.email-log-viewer__td--mono {
		font-size: 0.8125rem;
		font-family: ui-monospace, monospace;
		color: var(--color-muted, #6b7280);
	}

	.email-log-viewer__td--muted {
		font-size: 0.8125rem;
		color: var(--color-muted, #6b7280);
		white-space: nowrap;
	}

	.email-log-viewer__td--actions {
		text-align: right;
	}

</style>
