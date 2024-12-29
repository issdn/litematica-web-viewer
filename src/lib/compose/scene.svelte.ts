import { buildBlockStateArray, Vector3D, type Region } from '../parse/schematic_parser';
import { BlockNameResolver, type NamespaceFile } from '../resolve/block_name_resolver';
import { ServerMinecraftAssetsManager } from '../textures/assets_manager';
import { ClientMinecraftAssetsManager } from '../textures/client_assets_manager';
import type { NBTBlockState, NBTBlockStateProperties } from '../types/common';

export type NBTBlockData = NBTBlockState & {
	instances: Vector3D[];
};

export type BlockInstanceData = {
	position: Vector3D;
};

const groundTypes = {
	grassBlock: {
		Name: 'minecraft:grass_block',
		Properties: { snowy: false }
	}
} as Record<string, { Name: NamespaceFile; Properties: NBTBlockStateProperties }>;

const serverAssetsManager = new ServerMinecraftAssetsManager('default');

class Scene {
	ground = $state(groundTypes.grassBlock);

	schematic = $state<Region<NBTBlockState>[] | null>(null);

	texturepack: FileList | null | undefined = $state();

	private _assetsManager = $derived(
		this.texturepack == null
			? serverAssetsManager
			: new ClientMinecraftAssetsManager(this.texturepack, serverAssetsManager)
	);

	private _scene = $derived.by(() => this.buildScene());

	get scene() {
		return this._scene;
	}

	get assetsManager() {
		return this._assetsManager;
	}

	async buildScene() {
		const { key, instances } = this.buildGround(this.ground);

		const blockInstances = new Map<string, Vector3D[]>();

		const uniqueBlocks: Omit<NBTBlockData, 'instances'>[] = [];

		uniqueBlocks.push(this.ground);

		blockInstances.set(key, instances);

		return this.buildSchematic(blockInstances, uniqueBlocks, this.schematic);
	}

	private buildGround(
		groundType: (typeof groundTypes)[keyof typeof groundTypes],
		size: number = 32
	) {
		const instances: Vector3D[] = [];

		for (let i = 0; i < size ** 2; i++) {
			instances.push(new Vector3D((i % size) - size / 2, -1, Math.floor(i / size) - size / 2));
		}

		const key = this.getBlockUniqueKey(groundType);

		return { key, instances };
	}

	private buildSchematic(
		blockInstances: Map<string, Vector3D[]>,
		uniqueBlocks: Omit<NBTBlockData, 'instances'>[],
		regions: Region<NBTBlockState>[] | null
	) {
		if (regions == null || regions.length == 0) return [] as NBTBlockData[];

		const max = regions
			.map((r) => r.Position)
			.reduce((prev, curr) => {
				return Vector3D.fromNBTVector3D(prev).getMaxCorner(curr);
			});

		const middle = Vector3D.fromNBTVector3D(max).divide({ x: 2, z: 2, y: 1 });

		for (const region of regions) {
			const { BlockStatePalette, BlockStates, Size, Position } = region;

			const { traverse } = buildBlockStateArray(BlockStates, BlockStatePalette, Size, Position);

			traverse((block) => {
				const nameResolver = BlockNameResolver.parse(block.Name);
				if (
					nameResolver.file != 'water' &&
					nameResolver.file != 'lava' &&
					nameResolver.file != 'air'
				) {
					const position = block.position.substract({ ...middle, y: 0 });
					const key = this.getBlockUniqueKey(block);
					if (blockInstances.has(key)) {
						const arr = blockInstances.get(key)!;
						blockInstances.set(key, [...arr, position]);
					} else {
						blockInstances.set(key, [position]);
						uniqueBlocks.push({
							...block
						});
					}
				}
			});
		}

		const result: NBTBlockData[] = [];

		uniqueBlocks.forEach((block) => {
			result.push({
				...block,
				instances: blockInstances.get(this.getBlockUniqueKey(block))!
			});
		});

		return result;
	}

	private getBlockUniqueKey<T extends { Name: NamespaceFile; Properties: NBTBlockStateProperties }>(
		block: T
	) {
		return `${block.Name}#${JSON.stringify(block.Properties)}`;
	}
}

export const scene = new Scene();
