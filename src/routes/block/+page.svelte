<script lang="ts">
	import { page } from '$app/state';
	import Scene from '$lib/components/schematic/Scene.svelte';
	import { Vector3 } from 'three';
	import type { NBTBlockStateProperties } from '$root/src/lib/types/common';
	import { parseNBTBlockData } from '$root/src/lib/parse/search_params';
	import type { NBTBlockData } from '$root/src/lib/compose/scene.svelte';

	const { Name, Properties } = parseNBTBlockData(page.url);

	const block: NBTBlockData = {
		Properties: Properties ?? ({ snowy: 'false' } as NBTBlockStateProperties),
		Name: Name.namespaceFile,
		instances: [new Vector3(0, 0, 0)]
	};

	const maxAxis = 2;

	const additionalUrlParams = {
		...block.Properties,
		name: Name.file
	};
</script>

<Scene {additionalUrlParams} {maxAxis} blocks={[block]} />
