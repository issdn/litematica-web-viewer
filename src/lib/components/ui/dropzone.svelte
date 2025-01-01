<script lang="ts">
	import { scene, serverAssetsManager } from '../../compose/scene.svelte';
	import { ClientMinecraftAssetsManager } from '../../textures/client_assets_manager';

	let isDropping = $state(false);
	let count = 0;

	let done = $state(true);

	async function readFiles(items: DataTransferItemList | undefined) {
		done = false;
		const result = (
			await Promise.all(
				Array.from(items ?? []).map((entry) => {
					const item = entry.webkitGetAsEntry();
					return readEntry(item);
				})
			)
		).flat();

		const files = ClientMinecraftAssetsManager.resolveFilesFromDropzone(result);
		const rootName = result[0].path.split('/')[0];
		isDropping = false;
		done = true;
		scene.assetsManager = new ClientMinecraftAssetsManager(files, serverAssetsManager, rootName);
	}

	async function readEntry(entry: FileSystemEntry | null): Promise<{ file: File; path: string }[]> {
		if (entry != null) {
			if (entry.isDirectory) {
				const directory = entry as FileSystemDirectoryEntry;
				let directoryReader = directory.createReader();
				const a = (await readEntriesFromDirectory(directoryReader)).flat();
				console.log(directory.fullPath, a);
				return a;
			} else {
				const fileEntry = entry as FileSystemFileEntry;
				const file = await readFileEntry(fileEntry);
				return [{ file, path: fileEntry.fullPath.substring(1) }];
			}
		}
		return [];
	}

	async function readEntriesFromDirectory(reader: FileSystemDirectoryReader) {
		const entries: FileSystemEntry[] = [];
		let allRead = false;
		do {
			const result = await readFileDirectory(reader);
			entries.push(...result);
			if (result.length === 0) allRead = true;
		} while (!allRead);
		return await Promise.all(entries.map((entry) => readEntry(entry)));
	}

	// Only reads 100 per readEntries() call;
	async function readFileDirectory(reader: FileSystemDirectoryReader) {
		return new Promise<FileSystemEntry[]>((resolve, reject) => {
			reader.readEntries(
				(entries) => resolve(entries),
				(error) => reject(error)
			);
		});
	}

	async function readFileEntry(file: FileSystemFileEntry) {
		return new Promise<File>((resolve, reject) =>
			file.file(
				(file) => resolve(file),
				(error) => reject(error)
			)
		);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class={`absolute left-0 top-0 z-50 h-full w-full bg-popover p-4 text-popover-foreground opacity-80 ${isDropping ? '' : 'pointer-events-none invisible'}`}
>
	<div
		class="border-border-input rounded-card border-border-input flex h-full w-full items-center justify-center border-2 border-dashed bg-transparent font-semibold text-muted-foreground"
	></div>
</div>

<svelte:document
	ondragleave={(e) => {
		count--;
		if (count === 0) {
			isDropping = false;
		}
	}}
	ondragenter={(e) => {
		count++;
		if (count === 1) {
			isDropping = true;
		}
	}}
	ondragover={(e) => {
		e.preventDefault();
	}}
	ondrop={(e) => {
		e.preventDefault();
		readFiles(e.dataTransfer?.items);
	}}
/>

<!-- <svelte:window
	
/> -->
