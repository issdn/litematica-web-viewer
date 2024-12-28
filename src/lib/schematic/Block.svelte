<script lang="ts">
	import { T } from '@threlte/core';
	import type { NBTVector3D, Vector3D } from '../parse/schematic_parser';
	import { MinecraftBlockResolver } from '$root/src/lib/resolve/minecraft_block_resolver';
	import Model from './Model.svelte';
	import { BlockNameResolver, type NamespaceFile } from '../resolve/block_name_resolver';
	import type { NBTBlockStateProperties } from '../types/common';
	import { useTexturepack } from '../resolve/texturepack.svelte';
	import { setContext } from 'svelte';
	import { degToRad } from 'three/src/math/MathUtils.js';

	interface Props {
		position: NBTVector3D;
		name: NamespaceFile;
		properties: NBTBlockStateProperties;
		instances: Vector3D[];
	}

	let { position, name, properties, instances }: Props = $props();

	let { assetsManager } = useTexturepack();

	const nameResolver = BlockNameResolver.parse(name);

	const resolver = new MinecraftBlockResolver(properties, assetsManager, nameResolver);
</script>

{#await resolver.resolve()}
	<T.Mesh position.y={position.y * 16} position.x={position.x * 16} position.z={position.z * 16}>
		<T.BoxGeometry args={[16, 16, 16]} />
		<T.MeshBasicMaterial color="black" />
	</T.Mesh>
{:then blockDataArray}
	{#each blockDataArray as { blockModel, model }}
		{setContext('block', {
			position,
			name: nameResolver.file,
			properties,
			instances,
			uvlock: model.uvlock ?? false,
			rotation: { x: model.x ?? 0, y: model.y ?? 0 },
			radiansRotation: { x: degToRad(model.x ?? 0), y: degToRad(model.y ?? 0) }
		})}
		<Model {blockModel} />
	{/each}
{:catch e}
	{console.log(e)}
{/await}
