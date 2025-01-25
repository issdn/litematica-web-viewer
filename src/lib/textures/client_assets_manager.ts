import type { Blockstate, BlockModel, MCMeta } from '$lib/types/common';
import type { BlockNameResolver } from '../resolve/block_name_resolver';
import type { DropzoneFile } from '../types/components/dropzone';
import { AssetCache } from './asset_cache';
import type { ServerMinecraftAssetsManager } from './assets_manager';
import type { FileService } from './file_service.i';
import type { MinecraftAssetsManager } from './minecraft_assets_manager.i';

class AssetError extends Error {}

export class ClientMinecraftAssetsManager implements MinecraftAssetsManager {
	private cache = new AssetCache();
	private fileService: FileService;
	rootName: string;
	serverAssetsManager: ServerMinecraftAssetsManager;

	constructor(
		fileService: FileService,
		serverAssetsManager: ServerMinecraftAssetsManager,
		rootName: string
	) {
		this.fileService = fileService;
		this.rootName = rootName;
		this.serverAssetsManager = serverAssetsManager;
	}

	async getBlockstate(resolver: BlockNameResolver): Promise<Blockstate> {
		const url = this.getPathWithRoot(resolver.relativeBlockstatePath);
		return this.cache.get(url, async (url) => {
			const blob = await this.fileService.getFile(url);
			if (blob == null) {
				return await this.serverAssetsManager.getBlockstate(resolver);
			}
			return await this.parseFile(blob, url);
		});
	}

	async getBlockModel(resolver: BlockNameResolver): Promise<BlockModel> {
		const url = this.getPathWithRoot(resolver.relativeBlockModelPath);
		return this.cache.get(url, async (url) => {
			const blob = await this.fileService.getFile(url);
			if (blob == null) {
				return await this.serverAssetsManager.getBlockModel(resolver);
			}
			return await this.parseFile(blob, url);
		});
	}

	async getAssets(resolver: BlockNameResolver): Promise<HTMLImageElement> {
		const url = this.getPathWithRoot(resolver.relativeTexturePath);
		return this.cache.get<HTMLImageElement>(url, async (url) => {
			const blob = await this.fileService.getFile(url);
			if (blob == null) {
				return await this.serverAssetsManager.getAssets(resolver);
			}
			return await this.createImage(blob);
		});
	}

	async getMCMeta(resolver: BlockNameResolver): Promise<MCMeta> {
		const url = this.getPathWithRoot(resolver.relativeMCMetaPath);
		return this.cache.get(url, async (url) => {
			const blob = await this.fileService.getFile(url);
			if (blob == null) {
				return await this.serverAssetsManager.getMCMeta(resolver);
			}
			return await this.parseFile(blob, url);
		});
	}

	async parseFile<T>(file: Blob, path: string): Promise<T> {
		const result = await this.readFileAsync(file);
		if (result == null) throw new AssetError(`Couldn't find file with path: "${path}"`);
		return JSON.parse(result as string);
	}

	private async createImage(blob: Blob) {
		const img = new Image();
		img.src = URL.createObjectURL(blob);
		await img.decode();
		URL.revokeObjectURL(img.src);
		return img;
	}

	private getPathWithRoot(relative: string) {
		if (this.rootName.length == 0) {
			return relative;
		}
		return `${this.rootName}/${relative}`;
	}

	private readFileAsync(file: Blob) {
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
