<script lang="ts">
	import { MinecraftBlockResolver } from '$root/src/lib/resolve/minecraft_block_resolver';
	import Model from './Model.svelte';
	import { BlockNameResolver, type NamespaceFile } from '$lib/resolve/block_name_resolver';
	import type { NBTBlockStateProperties } from '$lib/types/common';
	import { setContext } from 'svelte';
	import { scene } from '$lib/compose/scene.svelte';
	import Blocks from '$lib/blocks.json';
	import type { Vector3 } from 'three';

	interface Props {
		name: NamespaceFile;
		properties: NBTBlockStateProperties;
		instances: Vector3[];
	}

	let { name, properties, instances }: Props = $props();

	const nameResolver = BlockNameResolver.parse(name);

	let resolver = $derived(
		new MinecraftBlockResolver(properties, scene.assetsManager, nameResolver)
	);

	setContext('block', {
		name: nameResolver.file,
		properties,
		instances,
		transparent: Blocks[nameResolver.file as keyof typeof Blocks].transparent ?? true
	});
</script>

{#await resolver.resolve()}
	{console.log(`Loading ${name}`)}
{:then blockDataArray}
	{#each blockDataArray as { blockModel, model }}
		<Model {...blockModel} {...model} />
	{/each}
{:catch e}
	{console.log(e)}
{/await}
