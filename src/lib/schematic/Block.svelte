<script lang="ts">
	import { T } from '@threlte/core';
	import type { NBTVector3D } from '../parse/schematic_parser';
	import { MinecraftBlockResolver } from '$root/src/lib/resolve/minecraft_block_resolver';
	import Model from './Model.svelte';
	import { BlockNameResolver, type NamespaceFile } from '../resolve/block_name_resolver';
	import type { FaceData, NBTBlockStateProperties } from '../types/common';
	import { useTexturepack } from '../resolve/texturepack.svelte';
	import { getColor } from '../render/color.svelte';

	interface Props {
		position: NBTVector3D;
		name: NamespaceFile;
		properties: NBTBlockStateProperties;
	}

	let { position, name, properties }: Props = $props();

	let { assetsManager } = useTexturepack();

	const nameResolver = BlockNameResolver.parse(name);

	const resolver = new MinecraftBlockResolver(properties, assetsManager, nameResolver);

	function getElementColor(tintindex: FaceData['tintindex']) {
		if (tintindex < 0) return undefined;
		return getColor(nameResolver.file!)?.(properties);
	}
</script>

{#await resolver.resolve()}
	<T.Mesh position.y={position.y * 16} position.x={position.x * 16} position.z={position.z * 16}>
		<T.BoxGeometry args={[16, 16, 16]} />
		<T.MeshBasicMaterial color="black" />
	</T.Mesh>
{:then blockDataArray}
	{#each blockDataArray as { blockModel, model }}
		<Model
			blockRotation={{ x: model.x ?? 0, y: model.y ?? 0 }}
			uvlock={model.uvlock ?? false}
			blockPosition={position}
			{getElementColor}
			{blockModel}
		/>
	{/each}
{:catch e}
	{console.log(e)}
{/await}
