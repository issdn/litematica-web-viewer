<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import { OrthographicCamera, Vector3, type Vector3Tuple } from 'three';
	import Block from './Block.svelte';
	import { scene, type NBTBlockData } from '$lib/compose/scene.svelte';
	import { CameraType } from '$lib/types/schematic/schematic';
	import CameraControls from '../../compose/CameraControls.svelte';
	import CC from 'camera-controls';

	const {
		camera,
		cameraPosition,
		frustumSize,
		target
	}: { camera: CameraType; cameraPosition: Vector3; frustumSize: number; target: Vector3 } =
		$props();

	const { renderer } = useThrelte();

	let innerWidth = $state(0);
	let innerHeight = $state(0);
	let aspect = $derived(innerWidth / innerHeight);

	let cam: OrthographicCamera | undefined = $state(undefined);

	let cameraState: {
		cameraPosition: Vector3;
		target: Vector3;
	} | null = $state(null);

	$effect(() => {
		renderer.setSize(innerWidth, innerHeight);
		cam?.updateProjectionMatrix();
		cam?.updateMatrixWorld();
	});
</script>

<svelte:window bind:innerWidth bind:innerHeight />

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
		<CameraControls
			oncreate={(ref) => {
				ref.setLookAt(
					...(cameraState?.cameraPosition.toArray() ?? cameraPosition.toArray()),
					...(cameraState?.target.toArray() ?? target.toArray())
				);
			}}
			oncontrolend={(e) => {
				const target = (e as any).target as CC;
				cameraState = {
					cameraPosition: target.camera.position,
					target: target.getTarget(new Vector3())
				};
			}}
		/>
	</T.OrthographicCamera>
{:else}
	<T.PerspectiveCamera makeDefault>
		<CameraControls
			oncreate={(ref) => {
				ref.setLookAt(
					...(cameraState?.cameraPosition.toArray() ?? cameraPosition.toArray()),
					...(cameraState?.target.toArray() ?? target.toArray())
				);
			}}
			oncontrolend={(e) => {
				const target = (e as any).target as CC;
				cameraState = {
					cameraPosition: target.camera.position,
					target: target.getTarget(new Vector3())
				};
			}}
		/>
	</T.PerspectiveCamera>
{/if}

<!-- <Sky elevation={0.8} /> -->

<T.AmbientLight />

<!-- <T.DirectionalLight intensity={1} castShadow position={[4, 4, 12]} /> -->

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

{#await scene.schematic}
	<h1>Loading</h1>
{:then blocks}
	<T.Group>
		{@render renderBlocks(blocks)}
	</T.Group>
{/await}

<!-- {#await scene.ground then blocks}
	<T.Group>
		{@render renderBlocks(blocks)}
	</T.Group>
{/await} -->
