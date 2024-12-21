import type { BlockModel, Blockstate, MCMeta } from '../common_types';
import type { BlockNameResolver } from '../resolve/block_name_resolver';

export interface MinecraftAssetsManager {
	getBlockstate(resolver: BlockNameResolver): Promise<Blockstate>;

	getBlockModel(resolver: BlockNameResolver): Promise<BlockModel>;

	getAssets(resolver: BlockNameResolver): Promise<HTMLImageElement>;

	getMCMeta(resolver: BlockNameResolver): Promise<MCMeta>;
}

export class ServerMinecraftAssetsManager implements MinecraftAssetsManager {
	cache: Map<string, object | string> = new Map();

	async getBlockstate(resolver: BlockNameResolver): Promise<Blockstate> {
		const url = resolver.getRelativeBlockstatePath();
		if (this.cache.has(url)) return this.cache.get(url) as Blockstate;
		const result = await (await fetch(url)).json();
		this.cache.set(url, result);
		return result;
	}

	async getBlockModel(resolver: BlockNameResolver): Promise<BlockModel> {
		const url = resolver.getRelativeBlockModelPath();
		if (this.cache.has(url)) return this.cache.get(url) as BlockModel;
		const result = (await (await fetch(url)).json()) as BlockModel;
		this.cache.set(url, result);
		return result;
	}

	async getAssets(resolver: BlockNameResolver) {
		const url = resolver.getRelativeTexturePath();
		let img: HTMLImageElement;
		if (this.cache.has(url)) {
			img = this.cache.get(url) as HTMLImageElement;
		} else {
			const blob = await (await fetch(url)).blob();
			img = new Image();
			img.src = URL.createObjectURL(blob);
			await img.decode();
			this.cache.set(url, img);
		}
		return img;
	}

	async getMCMeta(resolver: BlockNameResolver) {
		const url = resolver.getRelativeMCMetaPath();
		if (this.cache.has(url)) return this.cache.get(url) as MCMeta;
		const json = await (await fetch(url)).json();
		this.cache.set(url, json);
		return json as MCMeta;
	}
}
