<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Schematic from '$lib/components/schematic/Schematic.svelte';
	import { Vector3, WebGLRenderer } from 'three';
	import { page } from '$app/state';
	import { stringifyVector3, tryParseVector3 } from '$root/src/lib/parse/search_params.js';
	import * as Tabs from '$lib/components/ui/tabs';
	import Button from '$lib/components/ui/button/button.svelte';
	import { FolderX, Link, Rotate3D } from 'lucide-svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { CameraType, type Props as SchematicProps } from '$lib/types/schematic/schematic.js';
	import { toast } from 'svelte-sonner';
	import CC from 'camera-controls';
	import Dropzone from '../ui/Dropzone.svelte';
	import { scene } from '../../compose/scene.svelte';
	import { buttonVariants } from '../ui/button';

	const {
		maxAxis,
		additionalUrlParams
	}: {
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

	const searchParams = page.url.searchParams;
	const givenCameraPosition = searchParams.get('cameraPosition');
	const givenCameraTarget = searchParams.get('cameraTarget');

	let cameraControls: CC | null = $state(null);

	let cameraType: CameraType = $state(CameraType.Perspective);
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

{#if scene.ready}
	<Dropzone />
{/if}

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
			{cameraType}
			{cameraPosition}
			{frustumSize}
			{target}
		/>
	</Canvas>
</div>

<div class="absolute bottom-10 left-1/2 -translate-x-1/2">
	<div class="flex flex-col gap-1">
		<Tabs.Root bind:value={cameraType}>
			<Tabs.List>
				<Tabs.Trigger value={CameraType.Perspective}>Perspective</Tabs.Trigger>
				<Tabs.Trigger value={CameraType.Orthographic}>Orthographic</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
		<div class="flex flex-row gap-1">
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger
						onclick={async () => {
							cameraState = { cameraPosition, target };
							cameraControls?.setLookAt(...cameraPosition.toArray(), ...target.toArray(), true);
						}}
						class={buttonVariants({ variant: 'outline', size: 'icon' })}
					>
						<Rotate3D />
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Reset camera to the initial state.</p>
					</Tooltip.Content>
				</Tooltip.Root>
				<Tooltip.Root>
					<Tooltip.Trigger
						onclick={async () => {
							navigator.clipboard.writeText(createUrl(cameraState).toString()).then(() => {
								toast.success('Copied!');
							});
						}}
						class={buttonVariants({ variant: 'outline', size: 'icon' })}
					>
						<Link />
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Get a link with your specific camera setup!</p>
					</Tooltip.Content>
				</Tooltip.Root>
				<Tooltip.Root>
					<Tooltip.Trigger
						onclick={() => (scene.assetsManager = null)}
						class={buttonVariants({ variant: 'outline', size: 'icon' })}
					>
						<FolderX />
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Remove texture pack</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</div>
	</div>
</div>
