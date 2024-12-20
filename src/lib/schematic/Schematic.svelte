<script lang="ts">
	import { T, useLoader, useThrelte } from '@threlte/core';
	import { BlockType, Facing, type Blockstate, type NBTBlockState } from '$lib/common_types';
	import Cuboid from './Cuboid.svelte';
	import { buildBlockStateArray, Vector3D, type Region } from '$lib/parse/schematic_parser';
	import { OrbitControls } from '@threlte/extras';
	import BlockTypesMap from '$lib/block_types.json';
	import { BlockNameResolver, type NamespaceFile } from '$lib/parse/block_name_resolver';
	import { MinecraftBlockResolver } from '$lib/minecraft_block_resolver';
	import { ServerMinecraftAssetsManager } from '$root/src/lib/assets_manager';

	interface Props {
		regions: Region<NBTBlockState>[];
	}

	let { regions }: Props = $props();

	const blockTypesMap = BlockTypesMap as { [key in NamespaceFile]: BlockType };

	const max = regions
		.map((r) => r.Position)
		.reduce((prev, curr) => {
			return Vector3D.fromNBTVector3D(prev).getMaxCorner(curr);
		});

	const middle = Vector3D.fromNBTVector3D(max).divide({ x: 2, z: 2, y: 1 });

	const serverAssetsManager = new ServerMinecraftAssetsManager();

	async function getBlocks() {
		const result: (NBTBlockState & {
			position: Vector3D;
			blockType: BlockType;
			resolver: MinecraftBlockResolver;
		})[] = [];

		for (const region of regions) {
			const { BlockStatePalette, BlockStates, Size, Position } = region;

			const blockStateArray = buildBlockStateArray(BlockStates, BlockStatePalette, Size, Position);

			await blockStateArray.traverse(async (block) => {
				const nameResolver = BlockNameResolver.parse(block.Name);
				const blockType = blockTypesMap[nameResolver.namespaceFile] ?? BlockType.default;
				if (blockType != BlockType.air && blockType != BlockType.fluid) {
					result.push({
						...block,
						position: block.position.substract({ ...middle, y: 0 }),
						blockType,
						resolver: new MinecraftBlockResolver(
							block.Properties,
							serverAssetsManager,
							BlockNameResolver.parse(block.Name)
						)
					});
				}
			});
		}
		return result;
	}
</script>

<T.PerspectiveCamera
	makeDefault
	position={[16 * 4, 16 * 4, 16 * 8]}
	on:create={({ ref }) => {
		ref.lookAt(0, 0, 0);
	}}
>
	<OrbitControls />
</T.PerspectiveCamera>

<T.Scene />

<T.AmbientLight />

<!-- <T.Mesh position.y={-8} rotation.x={-Math.PI / 2} receiveShadow>
	<T.PlaneGeometry args={[50 * 16, 50 * 16]} />
	<T.MeshStandardMaterial color="white" />
</T.Mesh> -->

{#await getBlocks()}
	<h1>Loading</h1>
{:then blocks}
	<T.Group>
		{#each blocks as block}
			<Cuboid resolver={block.resolver} blockType={block.blockType} position={block.position} />
		{/each}
	</T.Group>
{/await}
