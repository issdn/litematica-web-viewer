<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Schematic from '../../lib/schematic/Schematic.svelte';
	import { WebGLRenderer } from 'three';
	import { useTexturepack } from '$root/src/lib/resolve/texturepack.svelte';
	let { data } = $props();

	const regions = Object.values(data);

	let innerWidth = $state(0);
	let innerHeight = $state(0);

	const { setFiles } = useTexturepack();

	let files: FileList | null | undefined = $state();

	setFiles(files);
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<input
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
		<Schematic {regions} />
	</Canvas>
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
	}
</style>
