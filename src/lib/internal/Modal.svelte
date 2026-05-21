<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = false,
		size = 'md',
		onclose,
		header,
		children,
		footer,
	}: {
		open?: boolean;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		onclose?: () => void;
		header?: Snippet;
		children?: Snippet;
		footer?: Snippet;
	} = $props();

	let dialogEl = $state<HTMLDialogElement | undefined>();

	$effect(() => {
		if (!dialogEl) return;
		if (open) {
			dialogEl.showModal();
		} else {
			dialogEl.close();
		}
	});

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === dialogEl) onclose?.();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose?.();
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialogEl}
	class="modal modal--{size}"
	aria-modal="true"
	onclick={handleBackdropClick}
	onkeydown={handleKeydown}
>
	<div class="modal__panel" role="document">
		{#if header}
			<div class="modal__header">
				{@render header()}
				<button
					type="button"
					class="modal__close"
					aria-label="Close"
					onclick={onclose}
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
						<path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
					</svg>
				</button>
			</div>
		{/if}
		<div class="modal__body">
			{#if children}{@render children()}{/if}
		</div>
		{#if footer}
			<div class="modal__footer">
				{@render footer()}
			</div>
		{/if}
	</div>
</dialog>

<style>
	dialog {
		padding: 0;
		border: none;
		border-radius: var(--radius-lg, 0.75rem);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
		background: var(--color-surface, #fff);
		max-height: 90dvh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(2px);
	}

	dialog[open] {
		animation: modal-in 0.18s ease-out;
	}

	@keyframes modal-in {
		from { opacity: 0; transform: translateY(6px) scale(0.98); }
		to   { opacity: 1; transform: translateY(0) scale(1); }
	}

	.modal--sm  { width: min(90vw, 400px); }
	.modal--md  { width: min(90vw, 560px); }
	.modal--lg  { width: min(90vw, 720px); }
	.modal--xl  { width: min(94vw, 960px); }

	.modal__panel {
		display: flex;
		flex-direction: column;
		max-height: 90dvh;
		overflow: hidden;
	}

	.modal__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--color-border, #e5e7eb);
		flex-shrink: 0;
	}

	.modal__close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: none;
		border-radius: var(--radius-sm, 0.25rem);
		background: transparent;
		color: var(--color-muted, #6b7280);
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.12s, color 0.12s;
	}

	.modal__close:hover {
		background: var(--color-surface-hover, #f3f4f6);
		color: var(--color-text, #111827);
	}

	.modal__close:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 1px;
	}

	.modal__body {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
	}

	.modal__footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--color-border, #e5e7eb);
		flex-shrink: 0;
	}
</style>
