import { Vector3 } from 'three';
import {
	absoluteVector,
	buildBlockStateArray,
	getMaxCorners,
	type Region
} from '../parse/schematic_parser';
import { BlockNameResolver, type NamespaceFile } from '../resolve/block_name_resolver';
import { ServerMinecraftAssetsManager } from '../textures/assets_manager';
import { ClientMinecraftAssetsManager } from '../textures/client_assets_manager';
import type { NBTBlockState, NBTBlockStateProperties } from '../types/common';

export type NBTBlockData = NBTBlockState & {
	instances: Vector3[];
};

export type BlockInstanceData = {
	position: Vector3;
};

const groundTypes = {
	grassBlock: {
		Name: 'minecraft:grass_block',
		Properties: { snowy: false }
	}
} as Record<string, { Name: NamespaceFile; Properties: NBTBlockStateProperties }>;

const serverAssetsManager = new ServerMinecraftAssetsManager('default');

class Scene {
	groundType = $state(groundTypes.grassBlock);

	texturepack: FileList | null | undefined = $state();

	regions = $state<Region<NBTBlockState>[] | null>(null);

	max = $state({ x: 0, y: 0, z: 0 });

	middle: Vector3 = $state(new Vector3(0, 0, 0));

	private _ground = $derived.by(() => this.buildGround());

	private _schematic = $derived.by(() => this.buildSchematic(this.regions));

	get ground() {
		return this._ground;
	}

	get schematic() {
		return this._schematic;
	}

	private _assetsManager = $derived(
		this.texturepack == null
			? serverAssetsManager
			: new ClientMinecraftAssetsManager(this.texturepack, serverAssetsManager)
	);

	get assetsManager() {
		return this._assetsManager;
	}

	private async buildGround(size: number = 16) {
		const instances: Vector3[] = [];

		for (let i = 0; i < size ** 2; i++) {
			instances.push(new Vector3((i % size) - size / 2, -1, Math.floor(i / size) - size / 2));
		}

		return [{ ...this.groundType, instances }];
	}

	private async buildSchematic(regions: Region<NBTBlockState>[] | null) {
		if (regions == null || regions.length == 0) return [] as NBTBlockData[];

		const blockInstances = new Map<string, Vector3[]>();

		const uniqueBlocks: Omit<NBTBlockData, 'instances'>[] = [];

		this.max = regions
			.map((r) => r.Size)
			.reduce((prev, curr) => {
				return getMaxCorners(curr, new Vector3(...Object.values(prev)));
			});

		const newMiddle = absoluteVector(this.max).divide({ x: 2, z: 2, y: 1 });
		const { x, y, z } = newMiddle;
		newMiddle.set(Math.floor(x), Math.floor(y), Math.floor(z));
		this.middle = newMiddle;

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
					block.position.sub({ ...this.middle, y: 0 });
					const key = this.getBlockUniqueKey(block);
					if (blockInstances.has(key)) {
						const arr = blockInstances.get(key)!;
						blockInstances.set(key, [...arr, block.position]);
					} else {
						blockInstances.set(key, [block.position]);
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
