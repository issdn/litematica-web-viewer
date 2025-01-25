import type { BlockModel, Blockstate, MCMeta } from '$lib/types/common';
import type { BlockNameResolver } from '../resolve/block_name_resolver';
import { AssetCache } from './asset_cache';
import type { MinecraftAssetsManager } from './minecraft_assets_manager.i';

export class ServerMinecraftAssetsManager implements MinecraftAssetsManager {
	private cache = new AssetCache();
	rootName: string;

	constructor(rootName: string) {
		this.rootName = rootName;
	}

	async getBlockstate(resolver: BlockNameResolver): Promise<Blockstate> {
		const url = `${this.rootName}/${resolver.relativeBlockstatePath}`;
		return await this.cache.get<Blockstate>(url, this.fetch);
	}

	async getBlockModel(resolver: BlockNameResolver): Promise<BlockModel> {
		const url = `${this.rootName}/${resolver.relativeBlockModelPath}`;
		return await this.cache.get<BlockModel>(url, this.fetch);
	}

	async getAssets(resolver: BlockNameResolver) {
		const url = `${this.rootName}/${resolver.relativeTexturePath}`;
		return await this.cache.get<HTMLImageElement>(url, this.fetchTexture);
	}

	async getMCMeta(resolver: BlockNameResolver) {
		const url = `${this.rootName}/${resolver.relativeMCMetaPath}`;
		return await this.cache.get<MCMeta>(url, this.fetch);
	}

	async fetchTexture(url: string) {
		const blob = await (await fetch(url)).blob();
		const img = new Image();
		img.src = URL.createObjectURL(blob);
		await img.decode();
		return img;
	}

	async fetch<T>(url: string) {
		return (await (await fetch(url)).json()) as T;
	}
}
