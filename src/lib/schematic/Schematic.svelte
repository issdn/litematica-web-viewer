<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import { Color, OrthographicCamera, Vector3 } from 'three';
	import Block from './Block.svelte';
	import { scene, type NBTBlockData } from '../compose/scene.svelte';

	const { scene: threeScene, renderer } = useThrelte();

	let innerWidth = $state(0);
	let innerHeight = $state(0);

	threeScene.background = new Color('#E2EAF4');

	let aspect = $derived(innerWidth / innerHeight);

	let cam: OrthographicCamera | undefined = $state(undefined);

	$effect(() => {
		renderer.setSize(innerWidth, innerHeight);
		cam?.updateProjectionMatrix();
		cam?.updateMatrixWorld();
	});

	let maxAxis = $derived.by(() => {
		const { x, y, z } = scene.max;
		return Math.max(Math.max(x, y), z);
	});

	let cameraPosition = $derived(
		new Vector3(maxAxis, maxAxis, maxAxis).multiply({ x: 16, y: 16, z: 16 }).toArray()
	);

	let frustumSize = $derived(scene.max.y * 16 * 8);
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<!-- <T.PerspectiveCamera
	makeDefault
	position={new Array(3).fill(8 * 16) as SimpleVector3D}
	oncreate={(ref) => {
		ref.lookAt(new Vector3(2 * 16, 2 * 16, 2 * 16));
	}}
>
	<OrbitControls />
</T.PerspectiveCamera> -->

<T.OrthographicCamera
	bind:ref={cam}
	makeDefault
	manual={true}
	position={cameraPosition}
	left={(-frustumSize * aspect) / 2}
	right={(frustumSize * aspect) / 2}
	top={frustumSize / 2}
	bottom={-frustumSize / 2}
	oncreate={(ref) => {
		ref.lookAt(new Vector3(...Object.values(scene.max)));
		ref.updateProjectionMatrix();
		ref.updateMatrixWorld();
	}}
>
	<OrbitControls /></T.OrthographicCamera
>
<!-- {console.log('ahha')} -->
<T.Scene />

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
