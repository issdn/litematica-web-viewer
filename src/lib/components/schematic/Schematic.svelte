<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import { OrthographicCamera, Vector3 } from 'three';
	import Block from './Block.svelte';
	import { type NBTBlockData } from '$lib/compose/scene.svelte';
	import { CameraType, type Props } from '$lib/types/schematic/schematic';
	import CameraControls from '../../compose/CameraControls.svelte';
	import CC from 'camera-controls';
	import { Sky } from '@threlte/extras';
	let {
		cameraPosition,
		frustumSize,
		target,
		camera,
		cameraState = $bindable(null),
		blocks,
		cameraControls = $bindable(null)
	}: Props = $props();

	const { renderer } = useThrelte();

	let innerWidth = $state(0);
	let innerHeight = $state(0);
	let aspect = $derived(innerWidth / innerHeight);

	let cam: OrthographicCamera | undefined = $state(undefined);

	$effect(() => {
		renderer.setSize(innerWidth, innerHeight);
		cam?.updateProjectionMatrix();
		cam?.updateMatrixWorld();
	});
</script>

<svelte:window bind:innerWidth bind:innerHeight />

{#snippet cc()}
	<CameraControls
		oncreate={(ref) => {
			ref.setLookAt(
				...(cameraState?.cameraPosition.toArray() ?? cameraPosition.toArray()),
				...(cameraState?.target.toArray() ?? target.toArray())
			);
			cameraControls = ref;
		}}
		oncontrolend={(e) => {
			console.log(renderer.info.render);
			const target = (e as any).target as CC;
			cameraState = {
				cameraPosition: target.camera.position,
				target: target.getTarget(new Vector3())
			};
		}}
	/>
{/snippet}

{#if camera == CameraType.Orthographic}
	<T.OrthographicCamera
		bind:ref={cam}
		makeDefault
		manual={true}
		left={(-frustumSize * aspect) / 2}
		right={(frustumSize * aspect) / 2}
		top={frustumSize / 2}
		bottom={-frustumSize / 2}
	>
		{@render cc()}
	</T.OrthographicCamera>
{:else}
	<T.PerspectiveCamera makeDefault>
		{@render cc()}
	</T.PerspectiveCamera>
{/if}

<!-- <Sky elevation={1} /> -->

<T.AmbientLight />

<T.DirectionalLight intensity={1} castShadow position={[4, 4, 12]} />

<!-- <T.Mesh position.y={-8} rotation.x={-Math.PI / 2} receiveShadow>
	<T.PlaneGeometry args={[50 * 16, 50 * 16]} />
	<T.MeshStandardMaterial color="white" />
</T.Mesh> -->

{#snippet renderBlocks(blocks: NBTBlockData[])}
	{#each blocks as { Name, Properties, instances }}
		<Block {instances} name={Name} properties={Properties} />
	{/each}
{/snippet}

<!-- {@render renderBlocks(ground)} -->

<T.Group>
	{@render renderBlocks(blocks)}
</T.Group>

<!-- {#await scene.ground then blocks}
	<T.Group>
		{@render renderBlocks(blocks)}
	</T.Group>
{/await} -->
