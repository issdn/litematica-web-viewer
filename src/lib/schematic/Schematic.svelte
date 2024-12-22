<script lang="ts">
	import { T } from '@threlte/core';
	import { type NBTBlockState } from '$lib/types/common';
	import { buildBlockStateArray, Vector3D, type Region } from '$lib/parse/schematic_parser';
	import { OrbitControls } from '@threlte/extras';
	import { BlockNameResolver } from '$lib/resolve/block_name_resolver';
	import { type MinecraftAssetsManager } from '$lib/textures/assets_manager';
	import { Vector3 } from 'three';
	import Block from './Block.svelte';

	interface Props {
		regions: Region<NBTBlockState>[];
	}

	let { regions }: Props = $props();

	type Blocks = (NBTBlockState & {
		position: Vector3D;
	})[];

	const max = regions
		.map((r) => r.Position)
		.reduce((prev, curr) => {
			return Vector3D.fromNBTVector3D(prev).getMaxCorner(curr);
		});

	const middle = Vector3D.fromNBTVector3D(max).divide({ x: 2, z: 2, y: 1 });

	async function getBlocks() {
		const result: Blocks = [];

		for (const region of regions) {
			const { BlockStatePalette, BlockStates, Size, Position } = region;

			const blockStateArray = buildBlockStateArray(BlockStates, BlockStatePalette, Size, Position);

			await blockStateArray.traverse(async (block) => {
				const nameResolver = BlockNameResolver.parse(block.Name);
				if (
					nameResolver.file != 'water' &&
					nameResolver.file != 'lava' &&
					nameResolver.file != 'air'
				) {
					const position = block.position.substract({ ...middle, y: 0 });
					result.push({
						...block,
						position
					});
				}
			});
		}
		return result;
	}

	const maxAxis = Math.max(Math.max(max.x, max.y), max.z) * 16 * 2;

	const ground = new Array(maxAxis ** 2)
		.fill({ Name: 'minecraft:grass_block', Properties: { snowy: false } })
		.map((block, i) => ({
			...block,
			position: new Vector3D(i % maxAxis, -1, Math.floor(i / maxAxis))
		}));

	console.log(ground);
</script>

<T.PerspectiveCamera
	makeDefault
	position={Vector3D.fromNBTVector3D(max).add({ x: 16 * 8, y: 16 * 8, z: 16 * 8 }).values}
	oncreate={(ref) => {
		ref.lookAt(new Vector3(...middle.values));
	}}
>
	<OrbitControls maxDistance={maxAxis} />
</T.PerspectiveCamera>

<T.Scene />

<T.AmbientLight />

<T.DirectionalLight intensity={1} castShadow position={[4, 4, 12]} />

<!-- <T.Mesh position.y={-8} rotation.x={-Math.PI / 2} receiveShadow>
	<T.PlaneGeometry args={[50 * 16, 50 * 16]} />
	<T.MeshStandardMaterial color="white" />
</T.Mesh> -->

{#snippet renderBlocks(blocks: Blocks)}
	{#each blocks as { Name, Properties, position }}
		<Block name={Name} properties={Properties} {position} />
	{/each}
{/snippet}

{@render renderBlocks(ground)}

{#await getBlocks()}
	<h1>Loading</h1>
{:then blocks}
	<T.Group>
		{@render renderBlocks(blocks)}
	</T.Group>
{/await}
