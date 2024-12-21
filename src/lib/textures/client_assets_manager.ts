import type { Blockstate, BlockModel, MCMeta } from '../common_types';
import type { BlockNameResolver } from '../resolve/block_name_resolver';
import type { MinecraftAssetsManager } from './assets_manager';

export class ClientMinecraftAssetsManager implements MinecraftAssetsManager {
	getBlockstate(resolver: BlockNameResolver): Promise<Blockstate> {
		throw new Error('Method not implemented.');
	}
	getBlockModel(resolver: BlockNameResolver): Promise<BlockModel> {
		throw new Error('Method not implemented.');
	}
	getAssets(resolver: BlockNameResolver): Promise<HTMLImageElement> {
		throw new Error('Method not implemented.');
	}
	getMCMeta(resolver: BlockNameResolver): Promise<MCMeta> {
		throw new Error('Method not implemented.');
	}
}
