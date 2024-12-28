<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import { type NBTBlockState, type NBTBlockStateProperties } from '$lib/types/common';
	import { buildBlockStateArray, Vector3D, type Region } from '$lib/parse/schematic_parser';
	import { OrbitControls } from '@threlte/extras';
	import { BlockNameResolver, type NamespaceFile } from '$lib/resolve/block_name_resolver';
	import { type MinecraftAssetsManager } from '$lib/textures/assets_manager';
	import { Vector3 } from 'three';
	import Block from './Block.svelte';

	interface Props {
		regions: Region<NBTBlockState>[];
	}

	let { regions }: Props = $props();

	const { renderer } = useThrelte();

	type BlockData = NBTBlockState & {
		position: Vector3D;
		instances: Vector3D[];
	};

	const max = regions
		.map((r) => r.Position)
		.reduce((prev, curr) => {
			return Vector3D.fromNBTVector3D(prev).getMaxCorner(curr);
		});

	const middle = Vector3D.fromNBTVector3D(max).divide({ x: 2, z: 2, y: 1 });

	async function getBlocks() {
		const blocksWithoutInstances: Omit<BlockData, 'instances'>[] = [];

		const instances: Map<string, Vector3D[]> = new Map();

		const groundArr: Vector3D[] = [];

		for (let i = 0; i < 16 ** 2; i++) {
			groundArr.push(new Vector3D((i % 16) - 8, -1, Math.floor(i / 16) - 8));
		}

		const ground = {
			Name: 'minecraft:grass_block' as NamespaceFile,
			Properties: { snowy: false } as NBTBlockStateProperties
		};

		const groundKey = `${ground.Name}#${JSON.stringify(ground.Properties)}`;

		blocksWithoutInstances.push({ ...ground, position: groundArr[0] });

		instances.set(groundKey, groundArr);

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
					const key = `${block.Name}#${JSON.stringify(block.Properties)}`;
					if (instances.has(key)) {
						const arr = instances.get(key)!;
						instances.set(key, [...arr, position]);
					} else {
						instances.set(key, [position]);
						blocksWithoutInstances.push({
							...block,
							position
						});
					}
				}
			});
		}

		const result: BlockData[] = [];

		blocksWithoutInstances.forEach((block) => {
			result.push({
				...block,
				instances: instances.get(`${block.Name}#${JSON.stringify(block.Properties)}`)!
			});
		});

		return result;
	}
</script>

<T.PerspectiveCamera
	makeDefault
	position={Vector3D.fromNBTVector3D(max).add({ x: 16 * 8, y: 16 * 8, z: 16 * 8 }).values}
	oncreate={(ref) => {
		ref.lookAt(new Vector3(...middle.values));
	}}
>
	<OrbitControls />
</T.PerspectiveCamera>
<!-- onchange={() => console.log(renderer.info.render.calls)}  -->
<T.Scene />

<T.AmbientLight />

<!-- <T.DirectionalLight intensity={1} castShadow position={[4, 4, 12]} /> -->

<!-- <T.Mesh position.y={-8} rotation.x={-Math.PI / 2} receiveShadow>
	<T.PlaneGeometry args={[50 * 16, 50 * 16]} />
	<T.MeshStandardMaterial color="white" />
</T.Mesh> -->

{#snippet renderBlocks(blocks: BlockData[])}
	{#each blocks as { Name, Properties, position, instances }}
		<Block {instances} name={Name} properties={Properties} {position} />
	{/each}
{/snippet}

<!-- {@render renderBlocks(ground)} -->

{#await getBlocks()}
	<h1>Loading</h1>
{:then blocks}
	<T.Group>
		{@render renderBlocks(blocks)}
	</T.Group>
{/await}
