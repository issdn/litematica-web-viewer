<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Schematic from '../../lib/schematic/Schematic.svelte';

	export let data;

	const regions = Object.values(data);

	$: innerWidth = 0;
	$: innerHeight = 0;
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<Canvas
	rendererParameters={{
		antialias: false
	}}
	size={{ height: innerHeight, width: innerWidth }}
>
	<Schematic {regions} />
</Canvas>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
	}
</style>
