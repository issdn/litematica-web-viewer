import { expect, describe, it, vi, beforeAll } from 'vitest';
import {
	Axis,
	type BlockModel,
	type Blockstate,
	type MCMeta,
	type NBTBlockStateProperties,
	type Variants
} from '$lib/common_types';
import { MinecraftBlockResolver, type MinecraftAssetsManager } from '$lib/minecraft_block_resolver';
import { BlockNameResolver } from '$lib/parse/block_name_resolver';
import * as fs from 'node:fs';

import SpruceLogBlockstate from '$root/static/default/assets/minecraft/blockstates/spruce_log.json';

class MockMinecraftAssetsManager implements MinecraftAssetsManager {
	static baseUrl = './static';

	async getBlockstate(resolver: BlockNameResolver): Promise<Blockstate> {
		return JSON.parse(
			fs.readFileSync(
				MockMinecraftAssetsManager.baseUrl + resolver.getRelativeBlockstatePath(),
				'utf-8'
			)
		) as Blockstate;
	}
	async getBlockModel(resolver: BlockNameResolver): Promise<BlockModel> {
		return JSON.parse(
			fs.readFileSync(
				MockMinecraftAssetsManager.baseUrl + resolver.getRelativeBlockModelPath(),
				'utf-8'
			)
		) as BlockModel;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async getAssets(resolver: BlockNameResolver): Promise<HTMLImageElement> {
		return new Image();
	}

	async getMCMeta(resolver: BlockNameResolver): Promise<MCMeta> {
		// Image will be always 16x32 so it will fetch MCMeta for all assets.
		try {
			return JSON.parse(
				fs.readFileSync(
					MockMinecraftAssetsManager.baseUrl + resolver.getRelativeMCMetaPath(),
					'utf-8'
				)
			) as MCMeta;
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (_) {
			return {} as MCMeta;
		}
	}
}

function overrideImage(w?: number, h?: number) {
	global.Image = vi.fn(
		(width, height) =>
			({
				src: '',
				width: width ?? w ?? 16,
				height: height ?? h ?? 16,
				onload: null,
				onerror: null
			}) as unknown as HTMLImageElement
	);
}

describe('Test BlockNameParser', () => {
	it('Should correctly parse full block name - namespace:folder/file', () => {
		const parsed = BlockNameResolver.parse('namespace:folder/file');

		expect(`${parsed.namespace}:${parsed.folder}/${parsed.file}`).toBe('namespace:folder/file');
	});

	it('Should correctly parse block namespace and name - namespace:file', () => {
		const parsed = BlockNameResolver.parse('namespace:file');

		expect(`${parsed.namespace}:${parsed.file}`).toBe('namespace:file');
	});
});

describe('Resolve textures for spruce log', () => {
	beforeAll(() => {
		overrideImage();
	});

	const blockResolver = new MinecraftBlockResolver(
		{
			axis: Axis.x
		} as NBTBlockStateProperties,
		new MockMinecraftAssetsManager(),
		BlockNameResolver.parse('minecraft:spruce_log')
	);

	it('Should correctly parse variants blockstate', () => {
		const models = blockResolver.fromVariants(SpruceLogBlockstate as Variants);

		const expected = [
			{
				model: 'minecraft:block/spruce_log_horizontal',
				x: 90,
				y: 90
			}
		];

		expect(models).toMatchObject(expected);
	});

	it('Should resolve piston head block model tree (variants)', async () => {
		const actualBlockModels = await blockResolver.resolve();

		const expected = {
			parent: 'block/block',
			elements: [
				{
					from: [0, 0, 0],
					to: [16, 16, 16],
					faces: {
						down: { texture: { asset: new Image(), animation: null }, cullface: 'down' },
						up: { texture: { asset: new Image(), animation: null }, rotation: 180, cullface: 'up' },
						north: { texture: { asset: new Image(), animation: null }, cullface: 'north' },
						south: { texture: { asset: new Image(), animation: null }, cullface: 'south' },
						west: { texture: { asset: new Image(), animation: null }, cullface: 'west' },
						east: { texture: { asset: new Image(), animation: null }, cullface: 'east' }
					}
				}
			],
			textures: {
				particle: 'minecraft:block/spruce_log',
				down: 'minecraft:block/spruce_log_top',
				up: 'minecraft:block/spruce_log_top',
				north: 'minecraft:block/spruce_log',
				east: 'minecraft:block/spruce_log',
				south: 'minecraft:block/spruce_log',
				west: 'minecraft:block/spruce_log'
			}
		};

		expect(actualBlockModels[0].blockModel).toMatchObject(expected);
	});
});

describe('Resolve textures for a piston head', () => {
	beforeAll(() => {
		overrideImage();
	});

	const blockResolver = new MinecraftBlockResolver(
		{
			facing: 'down',
			short: 'false',
			type: 'normal'
		} as NBTBlockStateProperties,
		new MockMinecraftAssetsManager(),
		BlockNameResolver.parse('minecraft:piston_head')
	);

	it('Should resolve model tree (variants)', async () => {
		const actualBlockModels = await blockResolver.resolve();

		const expected = {
			textures: {
				particle: 'minecraft:block/piston_top'
			},
			elements: [
				{
					from: [0, 0, 0],
					to: [16, 16, 4],
					faces: {
						down: {
							uv: [0, 0, 16, 4],
							texture: { asset: new Image(), animation: null },
							cullface: 'down',
							rotation: 180
						},
						up: {
							uv: [0, 0, 16, 4],
							texture: { asset: new Image(), animation: null },
							cullface: 'up'
						},
						north: {
							uv: [0, 0, 16, 16],
							texture: { asset: new Image(), animation: null },
							cullface: 'north'
						},
						south: { uv: [0, 0, 16, 16], texture: { asset: new Image(), animation: null } },
						west: {
							uv: [0, 0, 16, 4],
							texture: { asset: new Image(), animation: null },
							rotation: 270,
							cullface: 'west'
						},
						east: {
							uv: [0, 0, 16, 4],
							texture: { asset: new Image(), animation: null },
							rotation: 90,
							cullface: 'east'
						}
					}
				},
				{
					from: [6, 6, 4],
					to: [10, 10, 20],
					faces: {
						down: {
							uv: [0, 0, 16, 4],
							texture: { asset: new Image(), animation: null },
							rotation: 90
						},
						up: {
							uv: [0, 0, 16, 4],
							texture: { asset: new Image(), animation: null },
							rotation: 270
						},
						west: { uv: [16, 4, 0, 0], texture: { asset: new Image(), animation: null } },
						east: { uv: [0, 0, 16, 4], texture: { asset: new Image(), animation: null } }
					}
				}
			]
		};

		expect(actualBlockModels[0].blockModel).toMatchObject(expected);
	});
});

describe('Resolve textures for a redstone block', () => {
	beforeAll(() => {
		overrideImage();
	});

	const blockResolver = new MinecraftBlockResolver(
		{} as NBTBlockStateProperties,
		new MockMinecraftAssetsManager(),
		BlockNameResolver.parse('minecraft:redstone_block')
	);

	it('Should resolve model tree (variants)', async () => {
		const actualBlockModels = await blockResolver.resolve();

		const expected = {
			parent: 'block/block',
			elements: [
				{
					from: [0, 0, 0],
					to: [16, 16, 16],
					faces: {
						down: { texture: { asset: new Image(), animation: null }, cullface: 'down' },
						up: { texture: { asset: new Image(), animation: null }, cullface: 'up' },
						north: { texture: { asset: new Image(), animation: null }, cullface: 'north' },
						south: { texture: { asset: new Image(), animation: null }, cullface: 'south' },
						west: { texture: { asset: new Image(), animation: null }, cullface: 'west' },
						east: { texture: { asset: new Image(), animation: null }, cullface: 'east' }
					}
				}
			]
		};

		expect(actualBlockModels[0].blockModel).toMatchObject(expected);
	});
});

describe('Resolve textures for stonecutter', () => {
	beforeAll(() => {
		overrideImage(16, 32);
	});

	const blockResolver = new MinecraftBlockResolver(
		{ facing: 'west' } as NBTBlockStateProperties,
		new MockMinecraftAssetsManager(),
		BlockNameResolver.parse('minecraft:stonecutter')
	);

	it('Should resolve model tree (variants) including animations', async () => {
		const actualBlockModels = await blockResolver.resolve();

		const expected = {
			parent: 'block/block',
			textures: {
				particle: 'block/stonecutter_bottom',
				bottom: 'block/stonecutter_bottom',
				top: 'block/stonecutter_top',
				side: 'block/stonecutter_side',
				saw: 'block/stonecutter_saw'
			},
			elements: [
				{
					from: [0, 0, 0],
					to: [16, 9, 16],
					faces: {
						down: {
							uv: [0, 0, 16, 16],
							texture: { asset: new Image(), animation: {} },
							cullface: 'down'
						},
						up: { uv: [0, 0, 16, 16], texture: { asset: new Image(), animation: {} } },
						north: {
							uv: [0, 7, 16, 16],
							texture: { asset: new Image(), animation: {} },
							cullface: 'north'
						},
						south: {
							uv: [0, 7, 16, 16],
							texture: { asset: new Image(), animation: {} },
							cullface: 'south'
						},
						west: {
							uv: [0, 7, 16, 16],
							texture: { asset: new Image(), animation: {} },
							cullface: 'west'
						},
						east: {
							uv: [0, 7, 16, 16],
							texture: { asset: new Image(), animation: {} },
							cullface: 'east'
						}
					}
				},
				{
					from: [1, 9, 8],
					to: [15, 16, 8],
					faces: {
						north: {
							uv: [1, 9, 15, 16],
							texture: {
								asset: new Image(16, 32),
								animation: {
									animation: {
										interpolate: false,
										frametime: 1
									}
								}
							},
							tintindex: 0
						},
						south: {
							uv: [15, 9, 1, 16],
							texture: {
								asset: new Image(16, 32),
								animation: {
									animation: {
										interpolate: false,
										frametime: 1
									}
								}
							},
							tintindex: 0
						}
					}
				}
			]
		};

		expect(actualBlockModels[0].blockModel).toMatchObject(expected);
	});
});
