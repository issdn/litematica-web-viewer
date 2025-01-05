<script lang="ts">
	import { scene } from '$lib/compose/scene.svelte';
	import Scene from '$lib/components/schematic/Scene.svelte';

	let { data } = $props();

	scene.regions = Object.values(data);

	let maxAxis = $derived.by(() => {
		const { x, y, z } = scene.max;
		return Math.max(Math.max(x, y), z);
	});
</script>

{#await scene.schematic}
	<h1>Loading</h1>
{:then blocks}
	<Scene {maxAxis} {blocks} />
{/await}
