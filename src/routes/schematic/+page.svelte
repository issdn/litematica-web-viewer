<script lang="ts">
	import { scene } from '$lib/compose/scene.svelte';
	import Scene from '$lib/components/schematic/Scene.svelte';

	let { data } = $props();

	scene.schematic = scene.buildSchematic(data.regions);

	let maxAxis = $derived.by(() => {
		const { x, y, z } = scene.max;
		return Math.max(Math.max(x, y), z);
	});
</script>

<Scene {maxAxis} />
