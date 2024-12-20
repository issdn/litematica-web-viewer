<script lang="ts">
	import { T } from '@threlte/core';
	import {
		type Blockstate,
		type NBTBlockStateProperties,
		BlockType,
		type SimpleVector3D,
		type BlockModel
	} from '../common_types';
	import Block from './Block.svelte';
	import type { NBTVector3D } from '../parse/schematic_parser';
	import { MinecraftBlockResolver } from '$lib/minecraft_block_resolver';
	import { MinecraftBlock } from '$lib/render/block_renderer';

	interface Props {
		position: NBTVector3D;
		geometry?: SimpleVector3D;
		blockType: BlockType;
		resolver: MinecraftBlockResolver;
	}

	let { position, geometry = [16, 16, 16], blockType, resolver }: Props = $props();
</script>

{#await resolver.resolve()}
	<T.Mesh
		position.y={position.y * geometry[0]}
		position.x={position.x * geometry[1]}
		position.z={position.z * geometry[2]}
	>
		<T.BoxGeometry args={geometry} />
		<T.MeshBasicMaterial color="black" />
	</T.Mesh>
{:then blockData}
	{#each blockData as { blockModel, model }}
		<Block
			block={new MinecraftBlock(
				position,
				blockModel,
				{ x: model.x, y: model.y },
				model.uvlock ?? false,
				blockType,
				resolver.blockstateName,
				resolver.properties
			)}
		/>
	{/each}
{/await}
