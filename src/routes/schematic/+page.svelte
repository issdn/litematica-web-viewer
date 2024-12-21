<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Schematic from '../../lib/schematic/Schematic.svelte';
	import { WebGLRenderer } from 'three';
	import { setBiome } from '$lib/render/biome.svelte';

	let { data } = $props();

	const regions = Object.values(data);

	let innerWidth = $state(0);
	let innerHeight = $state(0);
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<div style="width: {innerWidth}px; height: {innerHeight}px;">
	<Canvas
		createRenderer={(canvas) => {
			return new WebGLRenderer({
				canvas,
				alpha: true,
				antialias: false
			});
		}}
	>
		<Schematic {regions} />
	</Canvas>
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
	}
</style>
