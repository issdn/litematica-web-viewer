import { Vector3 } from 'three';
import {
	absoluteVector,
	buildBlockStateArray,
	getMaxCorners,
	type Region
} from '../parse/schematic_parser';
import { BlockNameResolver, type NamespaceFile } from '../resolve/block_name_resolver';
import { ServerMinecraftAssetsManager } from '../textures/assets_manager';
import type { NBTBlockState, NBTBlockStateProperties, ResolvedBlock } from '../types/common';
import type { MinecraftAssetsManager } from '../textures/minecraft_assets_manager.i';
import { TextureAtlas } from '../textures/texture_atlas';
import { MinecraftBlockResolver, ResolvingError } from '../resolve/minecraft_block_resolver';
import { toast } from 'svelte-sonner';

export type NBTBlockData = NBTBlockState & {
	instances: Vector3[];
};

export type BlockInstanceData = {
	position: Vector3;
};

const groundTypes = {
	grassBlock: {
		Name: 'minecraft:grass_block',
		Properties: { snowy: 'false' }
	}
} as Record<string, { Name: NamespaceFile; Properties: NBTBlockStateProperties }>;

export const serverAssetsManager = new ServerMinecraftAssetsManager('default');

// files.item(0)!.webkitRelativePath.split('/')[0]

class Scene {
	private _schematic: Promise<NBTBlockData[]> | null = $state(null);

	private _assetsManager: MinecraftAssetsManager = $state(serverAssetsManager);

	private _atlas: TextureAtlas | null = null;

	private _ground = $derived.by(() => this.buildGround());

	groundType = $state(groundTypes.grassBlock);

	max = $state({ x: 0, y: 0, z: 0 });

	middle: Vector3 = $state(new Vector3(0, 0, 0));

	ready: boolean = $state(false);

	instance = $derived.by(async () => {
		return await this.buildTexturedBlocks({
			assetsManager: this._assetsManager,
			schematic: await this._schematic!
		});
	});

	get atlas() {
		return this._atlas!;
	}

	get ground() {
		return this._ground;
	}

	set schematic(value: Promise<NBTBlockData[]>) {
		this._schematic = value;
	}

	set assetsManager(value: MinecraftAssetsManager | null) {
		value ??= serverAssetsManager;
		this._assetsManager = value;
	}

	get assetsManager(): MinecraftAssetsManager {
		return this._assetsManager;
	}

	private async buildGround(size: number = 16) {
		const instances: Vector3[] = [];

		for (let i = 0; i < size ** 2; i++) {
			instances.push(new Vector3((i % size) - size / 2, -1, Math.floor(i / size) - size / 2));
		}

		return [{ ...this.groundType, instances }];
	}

	async buildSchematic(regions: Region<NBTBlockState>[] | null) {
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

	private async buildTexturedBlocks({
		schematic,
		assetsManager
	}: {
		schematic: NBTBlockData[];
		assetsManager: MinecraftAssetsManager;
	}) {
		if (schematic === null) return [];
		const atlas = new TextureAtlas();

		const result = await Promise.allSettled(
			schematic.map(({ Name, Properties, instances }: NBTBlockData) => {
				const nameResolver = BlockNameResolver.parse(Name);
				return (async () => ({
					data: await new MinecraftBlockResolver(
						Properties,
						assetsManager,
						nameResolver,
						atlas
					).resolve(),
					Name,
					Properties,
					instances,
					nameResolver
				}))();
			})
		);

		atlas.create();

		const blocks = result.reduce((prev, value) => {
			if (value.status === 'rejected') {
				if (value.reason instanceof Error) {
					switch (value.reason.name) {
						case 'ResolvingError':
							toast.error(value.reason.message);
							break;
					}
				}
				toast.error("A block couldn't be resolved.");
				return prev;
			} else {
				return [...prev, value.value];
			}
		}, [] as ResolvedBlock[]);

		this._atlas = atlas;
		this.ready = true;

		return blocks;
	}
}

export let scene = new Scene();
