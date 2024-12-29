<script lang="ts">
	import { Float32BufferAttribute, BoxGeometry } from 'three';
	import { InstancedMesh } from '@threlte/extras';
	import { uvManipulation } from '../render/uv';
	import { getContext, setContext, type Snippet } from 'svelte';
	import { Facing, type FacesDataArray, type SimpleVector3D } from '../types/common';
	import type { ResolvedElements, ResolvedFaceData } from '../resolve/minecraft_block_resolver';
	import { Texture, Vector2 } from 'three';
	import Face from './Face.svelte';
	import AnimatedFace from './AnimatedFace.svelte';
	import type { BlockContext } from '../types/context';

	type Props = {
		children: Snippet;
	} & ResolvedElements[number];

	let { from, to, shade, faces, children }: Props = $props();

	const { uvlock, radiansRotation, instances } = getContext<BlockContext>('block');

	const { translateUV, rotateMap } = uvManipulation();

	const facesData = [
		{
			...faces[Facing.East],
			facing: Facing.East
		},
		{
			...faces[Facing.West],
			facing: Facing.West
		},
		{
			...faces[Facing.Up],
			facing: Facing.Up
		},
		{
			...faces[Facing.Down],
			facing: Facing.Down
		},
		{
			...faces[Facing.South],
			facing: Facing.South
		},
		{
			...faces[Facing.North],
			facing: Facing.North
		}
	] as FacesDataArray;

	const size = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];

	facesData.forEach((item) => {
		if (item.uv == undefined) {
			const pv = 16 - to[1];
			switch (item.facing) {
				case Facing.North:
				case Facing.South:
					item['uv'] = [from[0], pv, from[0] + size[0], pv + to[1]];
					break;
				case Facing.Up:
					item['uv'] = [from[0], from[2], from[0] + size[0], from[2] + size[2]];
					break;
				case Facing.Down: {
					const pub = 16 - to[0];
					const pvb = 16 - to[2];
					item['uv'] = [pub, pvb, pub + to[0] - from[0], pvb + to[2] - from[2]];
					break;
				}
				case Facing.East: {
					const pu = 16 - to[2];
					item['uv'] = [pu, pv, pu + to[2] - from[2], pv + to[1]];
					break;
				}
				case Facing.West: {
					item['uv'] = [from[2], pv, from[2] + size[2], pv + to[1]];
					break;
				}
			}
		}
	});

	function getTypedFace(face: FacesDataArray[keyof FacesDataArray]) {
		return face as ResolvedFaceData & { facing: Facing };
	}

	setContext('element', { size });
</script>

<InstancedMesh
	range={instances.length}
	limit={instances.length}
	receiveShadow={shade}
	castShadow={shade}
	oncreate={(ref) => {
		ref.geometry = new BoxGeometry(...size, 1, 1, 1)
			.toNonIndexed()
			.setAttribute('uv', new Float32BufferAttribute(translateUV(facesData), 2));
	}}
>
	{@render children()}
	{#each Object.values(facesData) as face}
		{#snippet getFace(texture?: Texture)}
			<Face
				{texture}
				face={getTypedFace(face)}
				adjustTexture={(texture) => {
					if (uvlock) {
						texture.center = new Vector2(0.5, 0.5);
						rotateMap(face.facing, texture, radiansRotation);
					}
				}}
			/>
		{/snippet}

		{#if face.texture != undefined}
			{#if face.texture.asset.height > face.texture.asset.width}
				<AnimatedFace {getFace} asset={face.texture.asset} animation={face.texture.animation!} />
			{:else}
				{@render getFace()}
			{/if}
		{/if}
	{/each}
</InstancedMesh>
