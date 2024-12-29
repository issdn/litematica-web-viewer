<script lang="ts">
	import { Float32BufferAttribute, BoxGeometry, Vector3, Quaternion } from 'three';
	import { Instance, InstancedMesh } from '@threlte/extras';
	import { uvManipulation } from '../render/uv';
	import { getContext, setContext, type Component, type Snippet } from 'svelte';
	import {
		Facing,
		type BlockRotation,
		type FacesDataArray,
		type Model,
		type SimpleVector3D
	} from '../types/common';
	import type { ResolvedElements, ResolvedFaceData } from '../resolve/minecraft_block_resolver';
	import { Texture, Vector2 } from 'three';
	import Face from './Face.svelte';
	import AnimatedFace from './AnimatedFace.svelte';
	import type { BlockContext } from '../types/context';
	import { degToRad } from 'three/src/math/MathUtils.js';

	type Props = {
		uvlock: Model['uvlock'];
		radiansRotation: Required<BlockRotation>;
	} & ResolvedElements[number];

	let { from, to, shade, faces, uvlock, radiansRotation, rotation }: Props = $props();

	const { instances } = getContext<BlockContext>('block');

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

	const rotationAngle = rotation == null ? 0 : degToRad(rotation.angle);

	const scaling = 1 / Math.cos(rotationAngle);

	const padding = new Vector3(16, 16, 16).sub(new Vector3(...size)).divide(new Vector3(2, 2, 2));

	const fromRotated = new Vector3(...from);

	if (radiansRotation.x != 0) {
		padding.applyAxisAngle(new Vector3(1, 0, 0), -radiansRotation.x);
		fromRotated.applyAxisAngle(new Vector3(1, 0, 0), -radiansRotation.x);
	}

	if (radiansRotation.y != 0) {
		padding.applyAxisAngle(new Vector3(0, 1, 0), -radiansRotation.y);
		fromRotated.applyAxisAngle(new Vector3(0, 1, 0), -radiansRotation.y);
	}

	let ref = $state() as InstancedMesh;

	let { quaternion, scale } = $derived.by(() => {
		const quaternion = ref.quaternion.clone();
		const scale = ref.scale.clone();

		quaternion
			.multiplyQuaternions(
				new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -radiansRotation.x),
				quaternion
			)
			.multiplyQuaternions(
				new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -radiansRotation.y),
				quaternion
			);
		if (rotation != null) {
			if (rotation.axis == 'x') {
				quaternion.multiplyQuaternions(
					new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), rotationAngle),
					quaternion
				);
				if (rotation.rescale == true) {
					scale.setX(scaling);
					scale.setY(scaling);
				}
			}
			if (rotation.axis == 'y') {
				quaternion.multiplyQuaternions(
					new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), rotationAngle),
					quaternion
				);
				if (rotation.rescale == true) {
					scale.setX(scaling);
					scale.setZ(scaling);
				}
			}
		}

		return { quaternion, scale };
	});
</script>

<InstancedMesh
	bind:ref
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
	{#each instances as position}
		<Instance
			quaternion={quaternion.toArray()}
			scale={scale.toArray()}
			position={[
				position.x * 16 - padding.x + fromRotated.x,
				position.y * 16 - padding.y + fromRotated.y,
				position.z * 16 - padding.z + fromRotated.z
			] as SimpleVector3D}
		></Instance>
	{/each}
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
