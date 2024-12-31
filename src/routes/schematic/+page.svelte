<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Schematic from '../../lib/schematic/Schematic.svelte';
	import { WebGLRenderer } from 'three';
	import { scene } from '$root/src/lib/compose/scene.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import { CameraType } from '$root/src/lib/types/schematic/schematic';
	let { data } = $props();

	let innerWidth = $state(0);
	let innerHeight = $state(0);

	scene.regions = Object.values(data);

	let camera: CameraType = $state(CameraType.Perspective);
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
		<Schematic {camera} />
	</Canvas>
</div>

<div class="absolute bottom-10 left-1/2 -translate-x-1/2">
	<Tabs.Root bind:value={camera} class="w-[100px]">
		<Tabs.List>
			<Tabs.Trigger value={CameraType.Perspective}>Perspective</Tabs.Trigger>
			<Tabs.Trigger value={CameraType.Orthographic}>Orthographic</Tabs.Trigger>
		</Tabs.List>
	</Tabs.Root>
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
	}
</style>
