<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import {
		Box3,
		Group,
		OrthographicCamera,
		PerspectiveCamera,
		Sphere,
		Vector3,
		type Object3DEventMap
	} from 'three';
	import Block from './Block.svelte';
	import { resolveAllBlocks, scene, type NBTBlockData } from '$lib/compose/scene.svelte';
	import { CameraType, type Props } from '$lib/types/schematic/schematic';
	import CC from 'camera-controls';
	import CameraControls from '../../compose/camera_controls';

	let {
		cameraPosition,
		frustumSize,
		target,
		cameraType,
		cameraState = $bindable(null),
		blocks,
		cameraControls = $bindable(null)
	}: Props = $props();

	const { renderer, dom, invalidate } = useThrelte();

	let innerWidth = $state(0);
	let innerHeight = $state(0);
	let aspect = $derived(innerWidth / innerHeight);

	let initCamera =
		cameraType == CameraType.Perspective ? new PerspectiveCamera() : new OrthographicCamera();

	let camera: OrthographicCamera | PerspectiveCamera = $state(initCamera);

	$effect(() => {
		renderer.setSize(innerWidth, innerHeight);
		camera.updateProjectionMatrix();
		camera.updateMatrixWorld();
	});

	resolveAllBlocks(blocks, scene.assetsManager);

	let schem: Group<Object3DEventMap> = $state(new Group());

	let far = $derived.by(() => {
		const boundingSphere = new Sphere();

		new Box3().setFromObject(schem).getBoundingSphere(boundingSphere);

		const distance = cameraPosition.distanceTo(boundingSphere.center);

		const maxDistance = distance + boundingSphere.radius;

		return maxDistance;
	});

	cameraControls = new CameraControls(dom, initCamera);
	cameraControls.addEventListener('controlend', (e) => {
		const target = (e as any).target as CC;
		cameraState = {
			cameraPosition: target.camera.position,
			target: target.getTarget(new Vector3())
		};
	});
	cameraControls.setLookAt(
		...(cameraState?.cameraPosition.toArray() ?? cameraPosition.toArray()),
		...(cameraState?.target.toArray() ?? target.toArray())
	);

	$effect(() => {
		cameraControls.camera = camera;
		cameraControls.maxDistance = far * 1.75;
		cameraControls.update(0);
	});

	useTask(
		(delta) => {
			if (cameraControls.update(delta)) {
				invalidate();
			}
		},
		{ autoInvalidate: false }
	);
</script>

<svelte:window bind:innerWidth bind:innerHeight />

{#if cameraType == CameraType.Orthographic}
	<T.OrthographicCamera
		bind:ref={camera as OrthographicCamera}
		makeDefault
		manual={true}
		far={far * 2}
		left={(-frustumSize * aspect) / 2}
		right={(frustumSize * aspect) / 2}
		top={frustumSize / 2}
		bottom={-frustumSize / 2}
	/>
{:else}
	<T.PerspectiveCamera bind:ref={camera as PerspectiveCamera} makeDefault far={far * 2} />
{/if}

<!-- <Sky elevation={1} /> -->

<T.AmbientLight />

<T.DirectionalLight intensity={1} castShadow position={[4, 4, 12]} />

<!-- <T.Mesh position.y={-8} rotation.x={-Math.PI / 2} receiveShadow>
	<T.PlaneGeometry args={[50 * 16, 50 * 16]} />
	<T.MeshStandardMaterial color="white" />
</T.Mesh> -->

<!-- {@render renderBlocks(ground)} -->

{#if scene.blocks != null && scene.atlas != null}
	<T.Group bind:ref={schem}>
		{#each scene.blocks as block}
			<Block {...block} />
		{/each}
	</T.Group>
{:else}
	<p>loading</p>
{/if}

<!-- {#await scene.ground then blocks}
	<T.Group>
		{@render renderBlocks(blocks)}
	</T.Group>
{/await} -->
