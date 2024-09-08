<script lang="ts">
	import { T } from '@threlte/core';
	import { Float32BufferAttribute, Vector3, BoxGeometry, DoubleSide, Quaternion } from 'three';
	import { degToRad } from 'three/src/math/MathUtils.js';
	import { MinecraftBlock, type FacesDataArray } from '$lib/render/block_renderer';
	import type { ResolvedFaceData } from '$lib/minecraft_block_resolver';
	import Face from './Face.svelte';
	import AnimatedFace from './AnimatedFace.svelte';
	import type { Facing } from '../common_types';

	export let block: MinecraftBlock;

	if (block.uvlock) {
		block!.uvManipulation.rotateTheFacesToInitialPositions();
	}

	function getTypedFace(face: FacesDataArray[keyof FacesDataArray]) {
		return face as ResolvedFaceData & { facing: Facing };
	}
</script>

{#each block.elements as element, i}
	{#if !block.isCross}
		<T.Mesh
			receiveShadow
			castShadow
			on:create={({ ref }) => {
				ref.quaternion
					.multiplyQuaternions(
						new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -block.rotationRadians.x),
						ref.quaternion
					)
					.multiplyQuaternions(
						new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -block.rotationRadians.y),
						ref.quaternion
					);

				ref.position.set(...element.getPositionInsideBlock().values);
				ref.geometry = new BoxGeometry(...element.size, 1, 1, 1)
					.toNonIndexed()
					.setAttribute(
						'uv',
						new Float32BufferAttribute(block.uvManipulation.translateUV(element.facesDataArray), 2)
					);
			}}
		>
			{#each Object.values(element.facesDataArray) as face}
				{#if face.texture != undefined}
					{#if face.texture.asset.height > face.texture.asset.width}
						<AnimatedFace {block} {element} face={getTypedFace(face)} />
					{:else}
						<Face {block} {element} face={getTypedFace(face)} />
					{/if}
				{/if}
			{/each}
		</T.Mesh>
	{:else}
		<T.Mesh
			on:create={({ ref }) => {
				ref.position.set(...element.getPositionInsideBlock().values);
				ref.rotateY(degToRad(i * 90 + 45));
			}}
		>
			<T.PlaneGeometry args={[element.size[0 + i], element.size[1 + i]]} />
			{#each Object.values(element.facesDataArray) as face}
				{#if face.texture != undefined}
					<Face side={DoubleSide} {block} {element} face={getTypedFace(face)} />
				{/if}
			{/each}
		</T.Mesh>
	{/if}
{/each}
