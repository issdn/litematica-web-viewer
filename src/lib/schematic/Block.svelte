<script lang="ts">
	import { T } from '@threlte/core';
	import type { NBTVector3D, Vector3D } from '../parse/schematic_parser';
	import { MinecraftBlockResolver } from '$root/src/lib/resolve/minecraft_block_resolver';
	import Model from './Model.svelte';
	import { BlockNameResolver, type NamespaceFile } from '../resolve/block_name_resolver';
	import type { NBTBlockStateProperties } from '../types/common';
	import { setContext } from 'svelte';
	import { degToRad } from 'three/src/math/MathUtils.js';
	import { scene } from '../compose/scene.svelte';

	interface Props {
		name: NamespaceFile;
		properties: NBTBlockStateProperties;
		instances: Vector3D[];
	}

	let { name, properties, instances }: Props = $props();

	const nameResolver = BlockNameResolver.parse(name);

	let resolver = $derived(
		new MinecraftBlockResolver(properties, scene.assetsManager, nameResolver)
	);
</script>

{#await resolver.resolve()}
	{console.log(`Loading ${name}`)}
{:then blockDataArray}
	{#each blockDataArray as { blockModel, model }}
		{setContext('block', {
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
