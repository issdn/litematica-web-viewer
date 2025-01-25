<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import { OrthographicCamera, Vector3 } from 'three';
	import Block from './Block.svelte';
	import { scene, type NBTBlockData } from '$lib/compose/scene.svelte';
	import { CameraType, type Props } from '$lib/types/schematic/schematic';
	import CameraControls from '../../compose/CameraControls.svelte';
	import CC from 'camera-controls';
	import { BlockNameResolver } from '../../resolve/block_name_resolver';
	import { MinecraftBlockResolver, type BlockData } from '../../resolve/minecraft_block_resolver';
	import { toast } from 'svelte-sonner';

	let {
		cameraPosition,
		frustumSize,
		target,
		camera,
		cameraState = $bindable(null),
		blocks,
		cameraControls = $bindable(null)
	}: Props = $props();

	type ResolvedBlock = NBTBlockData & { data: BlockData[]; nameResolver: BlockNameResolver };

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

	let blocksDataPromise = $derived.by(() => {
		return Promise.allSettled(
			blocks.map(({ Name, Properties, instances }: NBTBlockData) => {
				const nameResolver = BlockNameResolver.parse(Name);
				return (async () => ({
					data: await new MinecraftBlockResolver(
						Properties,
						scene.assetsManager,
						nameResolver,
						scene.atlas
					).resolve(),
					Name,
					Properties,
					instances,
					nameResolver
				}))();
			})
		).then((result) => {
			const data = result.reduce((prev, value) => {
				if (value.status === 'rejected') {
					if (value.reason instanceof Error) {
						switch (value.reason.name) {
							case 'ResolvingError':
								toast.error(value.reason.message);
								break;
							default:
								toast.error("Couldn't resolve the block from given properties.");
								break;
						}
					}
					toast.error("A block couldn't be resolved.");
					return prev;
				} else {
					return [...prev, value.value];
				}
			}, [] as ResolvedBlock[]);
			scene.atlas.create();
			return data;
		});
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

{#snippet renderBlocks(blocks: ResolvedBlock[])}
	{#each blocks as block}
		<Block {...block} />
	{/each}
{/snippet}

<!-- {@render renderBlocks(ground)} -->

{#await blocksDataPromise then blocksData}
	{#if blocksData != null}
		<T.Group>
			{@render renderBlocks(blocksData)}
		</T.Group>
	{:else}{/if}
{/await}

<!-- {#await scene.ground then blocks}
	<T.Group>
		{@render renderBlocks(blocks)}
	</T.Group>
{/await} -->
