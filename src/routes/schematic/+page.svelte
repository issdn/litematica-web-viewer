<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Schematic from '../../lib/schematic/Schematic.svelte';
	import { WebGLRenderer } from 'three';
	import { setBiome } from '$lib/render/biome.svelte';
	import { ServerMinecraftAssetsManager } from '$root/src/lib/textures/assets_manager';
	import { ClientMinecraftAssetsManager } from '$root/src/lib/textures/client_assets_manager';

	let { data } = $props();

	const regions = Object.values(data);

	let innerWidth = $state(0);
	let innerHeight = $state(0);

	let files: FileList | null | undefined = $state();

	const serverAssetsManager = new ServerMinecraftAssetsManager('default');
	let assetsManager = $derived(
		files == null
			? serverAssetsManager
			: new ClientMinecraftAssetsManager(files, serverAssetsManager)
	);
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<input
	bind:files
	webkitdirectory
	multiple
	onchange={(e) => console.log(e)}
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
				alpha: true,
				antialias: false
			});
		}}
	>
		<Schematic {assetsManager} {regions} />
	</Canvas>
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
	}
</style>
