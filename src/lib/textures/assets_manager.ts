import type { BlockModel, Blockstate, MCMeta } from '$lib/types/common';
import type { BlockNameResolver } from '../resolve/block_name_resolver';
import type { MinecraftAssetsManager } from './minecraft_assets_manager.i';

export class ServerMinecraftAssetsManager implements MinecraftAssetsManager {
	private cache: Map<string, Promise<object | string>> = new Map();
	rootName: string;

	constructor(rootName: string) {
		this.rootName = rootName;
	}

	async getBlockstate(resolver: BlockNameResolver): Promise<Blockstate> {
		const url = `${this.rootName}/${resolver.relativeBlockstatePath}`;
		if (this.cache.has(url)) return (await this.cache.get(url)) as Blockstate;
		const result = this.fetch<Blockstate>(url);
		this.cache.set(url, result);
		return await result;
	}

	async getBlockModel(resolver: BlockNameResolver): Promise<BlockModel> {
		const url = `${this.rootName}/${resolver.relativeBlockModelPath}`;
		if (this.cache.has(url)) return (await this.cache.get(url)) as BlockModel;
		const result = this.fetch<BlockModel>(url);
		this.cache.set(url, result);
		return await result;
	}

	async getAssets(resolver: BlockNameResolver) {
		const url = `${this.rootName}/${resolver.relativeTexturePath}`;
		let img: Promise<HTMLImageElement>;
		if (this.cache.has(url)) {
			img = this.cache.get(url) as Promise<HTMLImageElement>;
		} else {
			img = this.fetchTexture(url);
			this.cache.set(url, img);
		}
		return await img;
	}

	async getMCMeta(resolver: BlockNameResolver) {
		const url = `${this.rootName}/${resolver.relativeMCMetaPath}`;
		if (this.cache.has(url)) return (await this.cache.get(url)) as MCMeta;
		const result = this.fetch<MCMeta>(url);
		this.cache.set(url, result);
		return await result;
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
