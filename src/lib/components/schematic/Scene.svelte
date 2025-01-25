<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Schematic from '$lib/components/schematic/Schematic.svelte';
	import { Vector3, WebGLRenderer } from 'three';
	import { page } from '$app/state';
	import { stringifyVector3, tryParseVector3 } from '$root/src/lib/parse/search_params.js';
	import * as Tabs from '$lib/components/ui/tabs';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Link, Rotate3D } from 'lucide-svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { CameraType, type Props as SchematicProps } from '$lib/types/schematic/schematic.js';
	import { toast } from 'svelte-sonner';
	import CC from 'camera-controls';
	import { scene } from '../../compose/scene.svelte';
	import { TextureAtlas } from '../../textures/texture_atlas';
	import Dropzone from '../ui/Dropzone.svelte';

	const {
		blocks,
		maxAxis,
		additionalUrlParams
	}: Pick<SchematicProps, 'blocks'> & {
		maxAxis: number;
		additionalUrlParams?: Record<string, string>;
	} = $props();

	function createUrl(camera: SchematicProps['cameraState']) {
		const url = new URL(page.url.origin);
		url.pathname = page.url.pathname;
		if (camera != null) {
			const { cameraPosition, target } = camera;
			url.searchParams.append('cameraPosition', stringifyVector3(cameraPosition ?? cameraPosition));
			url.searchParams.append('cameraTarget', stringifyVector3(target ?? target));
		}
		if (additionalUrlParams != null) {
			Object.entries(additionalUrlParams).forEach(([key, value]) => {
				url.searchParams.append(key, value);
			});
		}
		return url;
	}

	scene.atlas = new TextureAtlas();

	const searchParams = page.url.searchParams;
	const givenCameraPosition = searchParams.get('cameraPosition');
	const givenCameraTarget = searchParams.get('cameraTarget');

	let cameraControls: CC | null = $state(null);

	let camera: CameraType = $state(CameraType.Perspective);
	let cameraState: SchematicProps['cameraState'] = $state(null);

	let innerWidth = $state(0);
	let innerHeight = $state(0);

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
		<Schematic
			bind:cameraState
			bind:cameraControls
			{blocks}
			{camera}
			{cameraPosition}
			{frustumSize}
			{target}
		/>
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
							cameraState = { cameraPosition, target };
							cameraControls?.setLookAt(...cameraPosition.toArray(), ...target.toArray(), true);
						}}><Rotate3D /></Button
					>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Reset camera to the initial state.</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						size="icon"
						variant="outline"
						onclick={async () => {
							navigator.clipboard.writeText(createUrl(cameraState).toString()).then(() => {
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
