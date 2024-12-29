<script lang="ts">
	import { Canvas, useThrelte } from '@threlte/core';
	import Schematic from '../../lib/schematic/Schematic.svelte';
	import { WebGLRenderer } from 'three';
	import { scene } from '$root/src/lib/compose/scene.svelte';
	let { data } = $props();

	const regions = Object.values(data);

	let innerWidth = $state(0);
	let innerHeight = $state(0);

	scene.schematic = regions;
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<input
	onchange={({ target }) => {
		scene.texturepack = (target as HTMLInputElement | null)?.files;
	}}
	webkitdirectory
	multiple
	class="absolute left-0 top-0 z-10"
	type="file"
	name="resourcepack"
	id="resourcepack"
/>

<div style="width: {innerWidth}px; height: {innerHeight}px;">
	<Canvas
		createRenderer={(canvas) => {
			return new WebGLRenderer({
				canvas,
				alpha: false,
				antialias: false
			});
		}}
	>
		<Schematic />
	</Canvas>
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
	}
</style>
