<script lang="ts">
	import { scene, serverAssetsManager } from '../compose/scene.svelte';
	import { ClientMinecraftAssetsManager } from '../textures/client_assets_manager';
	import { ZipFileService } from '../textures/zip_file_service';
	import { StandardFileService } from '../textures/standard_file_service';
	import { FolderArchive, FolderUp } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { getRegions } from '../parse/schematic_parser';

	const { isSchematic }: { isSchematic: boolean } = $props();

	class UploadException extends Error {}

	let isDropping = $state(false);
	let isUploading = $state(false);

	let count = 0;

	async function readFiles(items: DataTransferItemList | undefined) {
		// TODO Multiple resourcepacks
		if (items == null) throw new UploadException("Couldn't access any files.");
		const item = items[0].webkitGetAsEntry();
		if (item?.name.includes('.')) {
			switch (item.name.split('.').at(-1)) {
				case 'zip':
					await handleZipTxt(item as FileSystemFileEntry);
					break;
				case 'litematic': {
					if (isSchematic) await handleLitematic(item);
					else throw new UploadException('Switch to schematic viewer to load .litematic');
					break;
				}
				default:
					throw new UploadException('Only .zip and .litematic allowed.');
			}
		} else {
			await handleFolderTxt(item);
		}
	}

	async function handleLitematic(item: FileSystemEntry) {
		const file = (await readEntry(item))[0].file;
		scene.schematic = scene.buildSchematic(await getRegions(await file.arrayBuffer()));
	}

	async function handleZipTxt(item: FileSystemFileEntry) {
		const jszip = await import('jszip');
		const zipResult = await jszip.loadAsync(await readFileEntry(item), {
			createFolders: false
		});
		const fileService = new ZipFileService(zipResult);
		scene.assetsManager = new ClientMinecraftAssetsManager(fileService, serverAssetsManager, '');
	}

	async function handleFolderTxt(item: FileSystemEntry | null) {
		const result = (await readEntry(item)).flat();
		const files = ClientMinecraftAssetsManager.resolveFilesFromDropzone(result);
		const fileService = new StandardFileService(files);
		const rootName = result[0].path.split('/')[0];
		scene.assetsManager = new ClientMinecraftAssetsManager(
			fileService,
			serverAssetsManager,
			rootName
		);
	}

	async function readEntry(entry: FileSystemEntry | null): Promise<{ file: File; path: string }[]> {
		if (entry != null) {
			if (entry.isDirectory) {
				const directory = entry as FileSystemDirectoryEntry;
				let directoryReader = directory.createReader();
				return (await readEntriesFromDirectory(directoryReader)).flat();
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
	class={`absolute left-0 top-0 z-50 h-full w-full bg-popover p-8 text-xl text-popover-foreground opacity-80 ${isDropping || isUploading ? '' : 'pointer-events-none invisible'}`}
>
	<div
		class="border-border-input rounded-card border-border-input flex h-full w-full flex-col items-center justify-center border-2 border-dashed bg-transparent font-semibold text-muted-foreground"
	>
		{#if isUploading}
			<FolderUp size={84} />
			<span>Loading...</span>
		{:else}
			<FolderArchive size={84} />
			<span
				>Drop your texturepack
				{#if isSchematic}
					or a .litematic
				{/if}
				here!</span
			>
		{/if}
	</div>
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
	ondrop={async (e) => {
		e.preventDefault();
		isDropping = false;
		isUploading = true;
		count = 0;
		try {
			await readFiles(e.dataTransfer?.items);
		} catch (e) {
			if (e instanceof Error) {
				toast.error(e.message);
			} else {
				toast.error('Unknown error occured while loading the texturepack.');
			}
		}
		isUploading = false;
	}}
/>

<!-- <svelte:window
	
/> -->
