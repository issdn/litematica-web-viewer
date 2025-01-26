<script lang="ts">
	import { type BlockData } from '$root/src/lib/resolve/minecraft_block_resolver';
	import Model from './Model.svelte';
	import { BlockNameResolver } from '$lib/resolve/block_name_resolver';
	import { setContext } from 'svelte';
	import { type NBTBlockData } from '$lib/compose/scene.svelte';
	import Blocks from '$lib/blocks.json';

	let {
		instances,
		nameResolver,
		Properties,
		data
	}: NBTBlockData & { nameResolver: BlockNameResolver; data: BlockData[] } = $props();

	setContext('block', {
		name: nameResolver.file,
		properties: Properties,
		instances,
		transparent: Blocks[nameResolver.file as keyof typeof Blocks].transparent ?? true
	});
</script>

{#each data as { blockModel, model }}
	<Model {...blockModel} {...model} />
{/each}
