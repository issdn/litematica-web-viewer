<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Schematic from '$lib/components/schematic/Schematic.svelte';
	import { Vector3, WebGLRenderer } from 'three';
	import { scene } from '$root/src/lib/compose/scene.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import { CameraType } from '$root/src/lib/types/schematic/schematic';
	import Dropzone from '$root/src/lib/components/ui/dropzone.svelte';
	let { data } = $props();

	let innerWidth = $state(0);
	let innerHeight = $state(0);

	scene.regions = Object.values(data);

	let camera: CameraType = $state(CameraType.Perspective);

	let maxAxis = $derived.by(() => {
		const { x, y, z } = scene.max;
		return Math.max(Math.max(x, y), z);
	});

	let cameraPosition = $derived(
		new Vector3(maxAxis, maxAxis, maxAxis).multiply({ x: 16, y: 16, z: 16 })
	);

	let frustumSize = $derived(maxAxis * 16 * 2);

	const target = new Vector3(0, 0, 0);
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<Dropzone />

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
		<Schematic {cameraPosition} {frustumSize} {target} {camera} />
	</Canvas>
</div>

<div class="absolute bottom-10 left-1/2 -translate-x-1/2">
	<Tabs.Root bind:value={camera} class="w-[100px] -translate-x-1/2">
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
