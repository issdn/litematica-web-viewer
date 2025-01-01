import type { Blockstate, BlockModel, MCMeta } from '$lib/types/common';
import type { BlockNameResolver } from '../resolve/block_name_resolver';
import type { DropzoneFile } from '../types/components/dropzone';
import type { MinecraftAssetsManager, ServerMinecraftAssetsManager } from './assets_manager';

class AssetError extends Error {}

export class ClientMinecraftAssetsManager implements MinecraftAssetsManager {
	files: Map<string, File>;
	reader: FileReader;
	rootName: string;
	serverAssetsManager: ServerMinecraftAssetsManager;

	constructor(
		files: Map<string, File>,
		serverAssetsManager: ServerMinecraftAssetsManager,
		rootName: string
	) {
		this.reader = new FileReader();
		this.files = files;
		this.rootName = rootName;
		this.serverAssetsManager = serverAssetsManager;
	}

	async getBlockstate(resolver: BlockNameResolver): Promise<Blockstate> {
		const url = this.getPathWithRoot(resolver.relativeBlockstatePath);
		if (this.files.has(url)) {
			return await this.parseFile(this.files.get(url)!);
		}
		return await this.serverAssetsManager.getBlockstate(resolver);
	}

	async getBlockModel(resolver: BlockNameResolver): Promise<BlockModel> {
		const url = this.getPathWithRoot(resolver.relativeBlockModelPath);
		if (this.files.has(url)) {
			return await this.parseFile(this.files.get(url)!);
		}
		return await this.serverAssetsManager.getBlockModel(resolver);
	}

	async getAssets(resolver: BlockNameResolver): Promise<HTMLImageElement> {
		const url = this.getPathWithRoot(resolver.relativeTexturePath);
		if (this.files.has(url)) {
			const fileImg = this.files.get(url)!;
			const img = new Image();
			img.src = URL.createObjectURL(fileImg);
			await img.decode();
			return img;
		}
		return await this.serverAssetsManager.getAssets(resolver);
	}

	async getMCMeta(resolver: BlockNameResolver): Promise<MCMeta> {
		const url = this.getPathWithRoot(resolver.relativeMCMetaPath);
		if (this.files.has(url)) {
			return await this.parseFile(this.files.get(url)!);
		}
		return await this.serverAssetsManager.getMCMeta(resolver);
	}

	async parseFile<T>(file: File): Promise<T> {
		const result = await this.readFileAsync(file);
		if (result == null) throw new AssetError(`Couldn't find file: "${file.name}"`);
		return JSON.parse(result as string);
	}

	getPathWithRoot(relative: string) {
		return `${this.rootName}/${relative}`;
	}

	readFileAsync(file: File) {
		return new Promise<string | null>((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = () => resolve(reader.result as string | null);
			reader.onerror = () => reject(new Error('Failed to read file'));
			reader.readAsText(file, 'utf-8');
		});
	}

	static resolveFilesFromFileInput(files: FileList) {
		const result = new Map<string, File>();

		for (let i = 0; i < files.length; i++) {
			const item = files.item(i)!;
			result.set(item.webkitRelativePath, item);
		}

		return result;
	}

	static resolveFilesFromDropzone(files: DropzoneFile[]) {
		const result = new Map<string, File>();

		files.forEach(({ path, file }) => {
			result.set(path, file);
		});

		return result;
	}
}
