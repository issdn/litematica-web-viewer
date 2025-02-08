<script lang="ts">
	import { observe, T, useTask, useThrelte, watch } from '@threlte/core';
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
	import { scene } from '$lib/compose/scene.svelte';
	import { CameraType, type Props } from '$lib/types/schematic/schematic';
	import CC from 'camera-controls';
	import CameraControls from '../../compose/camera_controls';
	import Spinner from '../ui/Spinner.svelte';

	let {
		cameraPosition,
		frustumSize,
		target,
		cameraType,
		cameraState = $bindable(null),
		cameraControls = $bindable(null),
		blocks
	}: Props = $props();

	const { dom, invalidate, size } = useThrelte();

	const initCamera =
		cameraType == CameraType.Perspective ? new PerspectiveCamera() : new OrthographicCamera();

	let aspect = $state(0);

	let camera: OrthographicCamera | PerspectiveCamera = $state(initCamera);

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

	watch([size], ([size]) => {
		aspect = size.width / size.height;
		camera.updateProjectionMatrix();
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

<T.AmbientLight color={0xffffff} intensity={0.8} />

<!-- <T.DirectionalLight color={0xffffff} intensity={1} castShadow position={[12, 12, 12]} /> -->

<!-- <T.Mesh position.y={-8} rotation.x={-Math.PI / 2} receiveShadow>
	<T.PlaneGeometry args={[50 * 16, 50 * 16]} />
	<T.MeshStandardMaterial color="white" />
</T.Mesh> -->

<!-- {@render renderBlocks(ground)} -->

<T.Group bind:ref={schem}>
	{#each blocks as block}
		<Block {...block} />
	{/each}
</T.Group>

<!-- {#await scene.ground then blocks}
	<T.Group>
		{@render renderBlocks(blocks)}
	</T.Group>
{/await} -->
