<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Schematic from '$lib/components/schematic/Schematic.svelte';
	import { Vector3, WebGLRenderer } from 'three';
	import { scene } from '$lib/compose/scene.svelte';
	import Dropzone from '$lib/components/ui/dropzone.svelte';
	import { page } from '$app/state';
	import { stringifyVector3, tryParseVector3 } from '$lib/parse/camera_search_params.js';
	import * as Tabs from '$lib/components/ui/tabs';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Link } from 'lucide-svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { CameraType } from '$lib/types/schematic/schematic.js';
	import { toast } from 'svelte-sonner';

	const searchParams = page.url.searchParams;
	const givenCameraPosition = searchParams.get('position');
	const givenCameraTarget = searchParams.get('target');

	let { data } = $props();

	let camera: CameraType = $state(CameraType.Perspective);
	let cameraState: {
		cameraPosition: Vector3;
		target: Vector3;
	} | null = $state(null);

	let innerWidth = $state(0);
	let innerHeight = $state(0);

	scene.regions = Object.values(data);

	let maxAxis = $derived.by(() => {
		const { x, y, z } = scene.max;
		return Math.max(Math.max(x, y), z);
	});

	let cameraPosition = $derived(
		tryParseVector3(givenCameraPosition) ??
			new Vector3(maxAxis, maxAxis, maxAxis).multiply({ x: 16, y: 16, z: 16 })
	);

	let frustumSize = $derived(maxAxis * 16 * 2);

	const target = tryParseVector3(givenCameraTarget) ?? new Vector3(0, 0, 0);
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
		<Schematic bind:cameraState {camera} {cameraPosition} {frustumSize} {target} />
	</Canvas>
</div>

<div class="absolute bottom-10 left-1/2 -translate-x-1/2">
	<div class="flex flex-row gap-1">
		<Tabs.Root bind:value={camera}>
			<Tabs.List>
				<Tabs.Trigger value={CameraType.Perspective}>Perspective</Tabs.Trigger>
				<Tabs.Trigger value={CameraType.Orthographic}>Orthographic</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						size="icon"
						variant="outline"
						onclick={async () => {
							const url = new URL(page.url);
							url.searchParams.append(
								'position',
								stringifyVector3(cameraState?.cameraPosition ?? cameraPosition)
							);
							url.searchParams.append('target', stringifyVector3(cameraState?.target ?? target));
							navigator.clipboard.writeText(url.toString()).then(() => {
								toast.success('Copied!');
							});
						}}><Link /></Button
					>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Get a link with your specific camera setup!</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	</div>
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
	}
</style>
