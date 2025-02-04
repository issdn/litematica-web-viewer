<script lang="ts">
	import { page } from '$app/state';
	import Scene from '$lib/components/schematic/Scene.svelte';
	import { Vector3 } from 'three';
	import type { NBTBlockStateProperties } from '$root/src/lib/types/common';
	import { parseNBTBlockData } from '$root/src/lib/parse/search_params';
	import { scene, type NBTBlockData } from '$root/src/lib/compose/scene.svelte';
	import Controls from './Controls.svelte';

	const { Name, Properties } = parseNBTBlockData(page.url, 'stone');

	const block: NBTBlockData = {
		Properties: Properties ?? ({} as NBTBlockStateProperties),
		Name: Name.namespaceFile,
		instances: [new Vector3(0, 0, 0)]
	};

	const maxAxis = 2;

	const additionalUrlParams = {
		...block.Properties,
		name: Name.file
	};

	scene.schematic = Promise.resolve([block]);
</script>

<Scene {additionalUrlParams} {maxAxis} />

<Controls />
