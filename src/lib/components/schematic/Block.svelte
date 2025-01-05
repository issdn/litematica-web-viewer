<script lang="ts">
	import { MinecraftBlockResolver } from '$root/src/lib/resolve/minecraft_block_resolver';
	import Model from './Model.svelte';
	import { BlockNameResolver, type NamespaceFile } from '$lib/resolve/block_name_resolver';
	import type { NBTBlockStateProperties } from '$lib/types/common';
	import { setContext } from 'svelte';
	import { scene } from '$lib/compose/scene.svelte';
	import Blocks from '$lib/blocks.json';
	import type { Vector3 } from 'three';
	import { toast } from 'svelte-sonner';

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

	async function resolveBlock() {
		try {
			return await resolver.resolve();
		} catch (e) {
			if (e instanceof Error) {
				switch (e.name) {
					case 'ResolvingError':
						toast.error(e.message);
						break;
					default:
						toast.error("Couldn't resolve the block from given properties.");
						break;
				}
			}
			return null;
		}
	}
</script>

{#await resolveBlock()}
	{console.log(`Loading ${name}`)}
{:then blockDataArray}
	{#if blockDataArray != null}
		{#each blockDataArray as { blockModel, model }}
			<Model {...blockModel} {...model} />
		{/each}
	{/if}
{/await}
