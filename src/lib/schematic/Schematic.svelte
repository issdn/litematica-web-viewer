<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import type { SimpleVector3D } from '$lib/types/common';
	import { OrbitControls } from '@threlte/extras';
	import { Vector3 } from 'three';
	import Block from './Block.svelte';
	import { scene, type NBTBlockData } from '../compose/scene.svelte';
</script>

<T.PerspectiveCamera
	makeDefault
	position={new Array(3).fill(8 * 16) as SimpleVector3D}
	oncreate={(ref) => {
		ref.lookAt(new Vector3(2 * 16, 2 * 16, 2 * 16));
	}}
>
	<OrbitControls />
</T.PerspectiveCamera>
<!-- onchange={() => console.log(renderer.info.render.calls)}  -->
<T.Scene />

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

{#await scene.ground then blocks}
	<T.Group>
		{@render renderBlocks(blocks)}
	</T.Group>
{/await}

{#await scene.schematic}
	<h1>Loading</h1>
{:then blocks}
	<T.Group>
		{@render renderBlocks(blocks)}
	</T.Group>
{/await}
