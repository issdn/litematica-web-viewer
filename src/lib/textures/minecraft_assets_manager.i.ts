import type { BlockNameResolver } from '../resolve/block_name_resolver';
import type { BlockModel, Blockstate, MCMeta } from '../types/common';

export interface MinecraftAssetsManager {
	rootName: string;

	getBlockstate(resolver: BlockNameResolver): Promise<Blockstate>;

	getBlockModel(resolver: BlockNameResolver): Promise<BlockModel>;

	getAssets(resolver: BlockNameResolver): Promise<HTMLImageElement>;

	getMCMeta(resolver: BlockNameResolver): Promise<MCMeta>;
}
