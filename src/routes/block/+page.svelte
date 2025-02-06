<script lang="ts">
	import { page } from '$app/state';
	import Scene from '$lib/components/schematic/Scene.svelte';
	import type { NBTBlockStateProperties } from '$root/src/lib/types/common';
	import { parseNBTBlockData } from '$root/src/lib/parse/search_params';
	import Controls from './Controls.svelte';
	import { scene } from '$root/src/lib/compose/scene.svelte';
	import { Vector3 } from 'three';

	// svelte-ignore non_reactive_update
	let { Name, Properties } = parseNBTBlockData(page.url, 'stone');

	Properties ??= {} as NBTBlockStateProperties;

	scene.schematic = Promise.resolve([
		{
			Properties: Properties,
			Name: Name.namespaceFile,
			instances: [new Vector3(0, 0, 0)]
		}
	]);

	let additionalUrlParams = $state({
		...Properties,
		name: Name.file
	});
</script>

<Scene {additionalUrlParams} maxAxis={2} />

<Controls bind:additionalUrlParams blockName={Name.file} properties={Properties} />
