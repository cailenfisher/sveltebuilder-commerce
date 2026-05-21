<script lang="ts">
	import { localText } from 'svelte-hermes';

	type FileUploadState = {
		id: string;
		file: File;
		status: 'pending' | 'uploading' | 'done' | 'error';
		progress: number;
		url: string | null;
		error: string | null;
	};

	let {
		accept = 'image/*',
		maxFiles = 20,
		maxSizeBytes = 10 * 1024 * 1024,
		onupload,
		onreorder,
	}: {
		accept?: string;
		maxFiles?: number;
		maxSizeBytes?: number;
		onupload: (file: File) => Promise<string>;
		onreorder?: (urls: string[]) => void;
	} = $props();

	let files = $state<FileUploadState[]>([]);
	let dragOver = $state(false);
	let inputEl = $state<HTMLInputElement | undefined>();

	let dragSrcIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	function generateId(): string {
		return Math.random().toString(36).slice(2);
	}

	async function processFiles(incoming: FileList | null) {
		if (!incoming) return;
		const toAdd = Array.from(incoming).slice(0, maxFiles - files.length);
		for (const file of toAdd) {
			if (file.size > maxSizeBytes) {
				const entry: FileUploadState = {
					id: generateId(),
					file,
					status: 'error',
					progress: 0,
					url: null,
					error: localText('commerce_upload_too_large', {
						name: file.name,
						max: Math.round(maxSizeBytes / (1024 * 1024)),
					}),
				};
				files = [...files, entry];
				continue;
			}

			const entry: FileUploadState = {
				id: generateId(),
				file,
				status: 'uploading',
				progress: 0,
				url: null,
				error: null,
			};
			files = [...files, entry];

			try {
				const url = await onupload(file);
				files = files.map(f =>
					f.id === entry.id ? { ...f, status: 'done', progress: 100, url } : f
				);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : localText('commerce_upload_failed');
				files = files.map(f =>
					f.id === entry.id
						? { ...f, status: 'error', error: message }
						: f
				);
			}
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		processFiles(e.dataTransfer?.files ?? null);
	}

	function handleDragStart(i: number, e: DragEvent) {
		dragSrcIndex = i;
		e.dataTransfer!.effectAllowed = 'move';
	}

	function handleDragEnterItem(i: number) {
		if (dragSrcIndex === null || dragSrcIndex === i) return;
		dragOverIndex = i;
	}

	function handleDragEnd() {
		if (dragSrcIndex !== null && dragOverIndex !== null && dragSrcIndex !== dragOverIndex) {
			const next = [...files];
			const [item] = next.splice(dragSrcIndex, 1);
			next.splice(dragOverIndex, 0, item);
			files = next;
			const urls = next.filter(f => f.url).map(f => f.url!);
			onreorder?.(urls);
		}
		dragSrcIndex = null;
		dragOverIndex = null;
	}

	function removeFile(id: string) {
		files = files.filter(f => f.id !== id);
		const urls = files.filter(f => f.url).map(f => f.url!);
		onreorder?.(urls);
	}

	function retryFile(id: string) {
		const entry = files.find(f => f.id === id);
		if (!entry) return;
		files = files.map(f =>
			f.id === id ? { ...f, status: 'uploading', progress: 0, error: null } : f
		);
		onupload(entry.file)
			.then(url => {
				files = files.map(f =>
					f.id === id ? { ...f, status: 'done', progress: 100, url } : f
				);
			})
			.catch((err: unknown) => {
				const message = err instanceof Error ? err.message : localText('commerce_upload_failed');
				files = files.map(f =>
					f.id === id ? { ...f, status: 'error', error: message } : f
				);
			});
	}

	const uploading = $derived(files.some(f => f.status === 'uploading'));
	const errorCount = $derived(files.filter(f => f.status === 'error').length);
	const doneCount = $derived(files.filter(f => f.status === 'done').length);
</script>

<div class="media-uploader">
	<!-- Drop zone -->
	<div
		class="media-uploader__zone {dragOver ? 'media-uploader__zone--active' : ''}"
		role="button"
		tabindex="0"
		aria-label={localText('commerce_upload_drop_zone')}
		ondragover={(e) => { e.preventDefault(); dragOver = true; }}
		ondragleave={() => (dragOver = false)}
		ondrop={handleDrop}
		onclick={() => inputEl?.click()}
		onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputEl?.click(); } }}
	>
		<svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
			<path d="M16 4v16M8 12l8-8 8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			<path d="M4 24v2a2 2 0 002 2h20a2 2 0 002-2v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
		</svg>
		<p class="media-uploader__zone-text">
			{localText('commerce_upload_drop_or_click')}
		</p>
		<p class="media-uploader__zone-hint">
			{localText('commerce_upload_hint', {
				max: Math.round(maxSizeBytes / (1024 * 1024)),
				accept,
			})}
		</p>
		<input
			bind:this={inputEl}
			type="file"
			{accept}
			multiple
			class="media-uploader__input"
			aria-hidden="true"
			tabindex="-1"
			onchange={(e) => processFiles((e.target as HTMLInputElement).files)}
		/>
	</div>

	<!-- Status summary -->
	{#if files.length > 0}
		<div class="media-uploader__summary" aria-live="polite" role="status">
			{#if uploading}
				<span class="media-uploader__status media-uploader__status--loading">
					{localText('commerce_upload_in_progress')}
				</span>
			{:else if errorCount > 0}
				<span class="media-uploader__status media-uploader__status--error">
					{localText('commerce_upload_partial', { done: doneCount, errors: errorCount })}
				</span>
			{:else}
				<span class="media-uploader__status media-uploader__status--done">
					{localText('commerce_upload_complete', { count: doneCount })}
				</span>
			{/if}
		</div>
	{/if}

	<!-- File list with drag-to-reorder -->
	{#if files.length > 0}
		<ul
			class="media-uploader__list"
			aria-label={localText('commerce_uploaded_files')}
		>
			{#each files as file, i (file.id)}
				<li
					class="media-uploader__item {dragOverIndex === i && dragSrcIndex !== i ? 'media-uploader__item--drag-over' : ''}"
					draggable="true"
					ondragstart={(e) => handleDragStart(i, e)}
					ondragenter={() => handleDragEnterItem(i)}
					ondragend={handleDragEnd}
					ondragover={(e) => e.preventDefault()}
					aria-label="{file.file.name} — {localText(`commerce_upload_status_${file.status}`)}"
				>
					<span class="media-uploader__drag-handle" aria-hidden="true">⠿</span>

					{#if file.url}
						<img
							src={file.url}
							alt=""
							class="media-uploader__thumb"
							loading="lazy"
							decoding="async"
						/>
					{:else}
						<div class="media-uploader__thumb-placeholder" aria-hidden="true">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
								<rect width="20" height="20" rx="2" fill="#f3f4f6"/>
								<path d="M4 15l4-5 3 4 3-3 4 4H4z" fill="#d1d5db"/>
							</svg>
						</div>
					{/if}

					<div class="media-uploader__file-info">
						<span class="media-uploader__filename" title={file.file.name}>{file.file.name}</span>
						{#if file.status === 'uploading'}
							<div class="media-uploader__progress-bar" role="progressbar" aria-valuenow={file.progress} aria-valuemin={0} aria-valuemax={100}>
								<div class="media-uploader__progress-fill" style="width: {file.progress}%"></div>
							</div>
						{:else if file.status === 'error' && file.error}
							<span class="media-uploader__file-error">{file.error}</span>
						{:else if file.status === 'done'}
							<span class="media-uploader__file-done">
								{localText('commerce_upload_status_done')}
							</span>
						{/if}
					</div>

					<div class="media-uploader__item-actions">
						{#if file.status === 'error'}
							<button
								type="button"
								class="media-uploader__action-btn"
								onclick={() => retryFile(file.id)}
								aria-label={localText('commerce_retry_upload')}
							>
								{localText('commerce_retry')}
							</button>
						{/if}
						<button
							type="button"
							class="media-uploader__action-btn media-uploader__action-btn--remove"
							onclick={() => removeFile(file.id)}
							aria-label={localText('commerce_remove_file', { name: file.file.name })}
						>
							×
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.media-uploader {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.media-uploader__zone {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 2rem 1rem;
		border: 2px dashed var(--color-border, #d1d5db);
		border-radius: var(--radius-lg, 0.75rem);
		background: var(--color-surface-subtle, #f9fafb);
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
		color: var(--color-muted, #6b7280);
		text-align: center;
	}

	.media-uploader__zone:hover,
	.media-uploader__zone--active {
		border-color: var(--color-primary, #2563eb);
		background: var(--color-primary-subtle, #eff6ff);
		color: var(--color-primary, #2563eb);
	}

	.media-uploader__zone:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
	}

	.media-uploader__zone-text {
		font-size: 0.9375rem;
		font-weight: 500;
		margin: 0;
	}

	.media-uploader__zone-hint {
		font-size: 0.75rem;
		margin: 0;
	}

	.media-uploader__input {
		position: absolute;
		inset: 0;
		opacity: 0;
		pointer-events: none;
		width: 100%;
		height: 100%;
	}

	.media-uploader__summary {
		font-size: 0.8125rem;
	}

	.media-uploader__status {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		border-radius: var(--radius-sm, 0.25rem);
	}

	.media-uploader__status--loading {
		background: var(--color-primary-subtle, #eff6ff);
		color: var(--color-primary, #1d4ed8);
	}

	.media-uploader__status--error {
		background: var(--color-danger-subtle, #fef2f2);
		color: var(--color-danger, #dc2626);
	}

	.media-uploader__status--done {
		background: var(--color-success-subtle, #f0fdf4);
		color: var(--color-success, #166534);
	}

	.media-uploader__list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.media-uploader__item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.5rem 0.625rem;
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
		transition: border-color 0.12s;
	}

	.media-uploader__item--drag-over {
		border-color: var(--color-primary, #2563eb);
		background: var(--color-primary-subtle, #eff6ff);
	}

	.media-uploader__drag-handle {
		cursor: grab;
		color: var(--color-muted, #9ca3af);
		font-size: 1rem;
		flex-shrink: 0;
		user-select: none;
	}

	.media-uploader__drag-handle:active {
		cursor: grabbing;
	}

	.media-uploader__thumb {
		width: 2.5rem;
		height: 2.5rem;
		object-fit: cover;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.media-uploader__thumb-placeholder {
		width: 2.5rem;
		height: 2.5rem;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.media-uploader__file-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.media-uploader__filename {
		font-size: 0.8125rem;
		color: var(--color-text, #374151);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.media-uploader__file-error {
		font-size: 0.75rem;
		color: var(--color-danger, #dc2626);
	}

	.media-uploader__file-done {
		font-size: 0.75rem;
		color: var(--color-success, #166534);
	}

	.media-uploader__progress-bar {
		height: 4px;
		background: var(--color-border, #e5e7eb);
		border-radius: 2px;
		overflow: hidden;
	}

	.media-uploader__progress-fill {
		height: 100%;
		background: var(--color-primary, #2563eb);
		transition: width 0.2s;
	}

	.media-uploader__item-actions {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.media-uploader__action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 1.75rem;
		padding: 0 0.5rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-surface, #fff);
		font-size: 0.75rem;
		cursor: pointer;
		color: var(--color-text, #374151);
		transition: background 0.1s;
	}

	.media-uploader__action-btn:hover {
		background: var(--color-surface-hover, #f3f4f6);
	}

	.media-uploader__action-btn--remove {
		color: var(--color-danger, #dc2626);
		font-size: 1rem;
		font-weight: 400;
	}

	.media-uploader__action-btn--remove:hover {
		background: var(--color-danger-subtle, #fef2f2);
	}

	.media-uploader__action-btn:focus-visible {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 1px;
	}
</style>
