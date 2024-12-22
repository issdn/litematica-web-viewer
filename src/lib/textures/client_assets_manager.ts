import type { Blockstate, BlockModel, MCMeta } from '$lib/types/common';
import type { BlockNameResolver } from '../resolve/block_name_resolver';
import type { MinecraftAssetsManager, ServerMinecraftAssetsManager } from './assets_manager';

class AssetError extends Error {}

export class ClientMinecraftAssetsManager implements MinecraftAssetsManager {
	files: Map<string, File>;
	reader: FileReader;
	rootName: string;
	serverAssetsManager: ServerMinecraftAssetsManager;

	constructor(files: FileList, serverAssetsManager: ServerMinecraftAssetsManager) {
		this.files = this.resolveFiles(files);
		this.reader = new FileReader();
		if (files.length === 0) throw new AssetError('Texturepack is empty.');
		this.rootName = files.item(0)!.webkitRelativePath.split('/')[0];
		this.serverAssetsManager = serverAssetsManager;
	}

	async getBlockstate(resolver: BlockNameResolver): Promise<Blockstate> {
		const url = `${this.rootName}/${resolver.relativeBlockstatePath}`;
		if (this.files.has(url)) {
			return await this.parseFile(this.files.get(url)!);
		}
		return await this.serverAssetsManager.getBlockstate(resolver);
	}

	async getBlockModel(resolver: BlockNameResolver): Promise<BlockModel> {
		const url = `${this.rootName}/${resolver.relativeBlockModelPath}`;
		if (this.files.has(url)) {
			return await this.parseFile(this.files.get(url)!);
		}
		return await this.serverAssetsManager.getBlockModel(resolver);
	}

	async getAssets(resolver: BlockNameResolver): Promise<HTMLImageElement> {
		const url = `${this.rootName}/${resolver.relativeTexturePath}`;
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
		const url = `${this.rootName}/${resolver.relativeMCMetaPath}`;
		if (this.files.has(url)) {
			return await this.parseFile(this.files.get(url)!);
		}
		return await this.serverAssetsManager.getMCMeta(resolver);
	}

	async parseFile<T>(file: File): Promise<T> {
		const result = await this.readFileAsync(file);
		if (result == null)
			throw new AssetError(`Couldn't find file with path: ${file.webkitRelativePath}`);
		return JSON.parse(result as string);
	}

	readFileAsync(file: File) {
		return new Promise<string | null>((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = () => resolve(reader.result as string | null);
			reader.onerror = () => reject(new Error('Failed to read file'));
			reader.readAsText(file, 'utf-8');
		});
	}

	resolveFiles(files: FileList) {
		const result = new Map<string, File>();

		for (let i = 0; i < files.length; i++) {
			const item = files.item(i)!;
			result.set(item.webkitRelativePath, item);
		}

		return result;
	}
}
