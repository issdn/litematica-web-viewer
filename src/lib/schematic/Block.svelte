<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { Float32BufferAttribute, Vector3, BoxGeometry, Quaternion } from 'three';
	import type { ResolvedFaceData } from '$lib/resolve/minecraft_block_resolver';
	import Face from './Face.svelte';
	import AnimatedFace from './AnimatedFace.svelte';
	import type { Facing } from '../common_types';
	import type { FacesDataArray } from '../render/minecraft_element';
	import type { MinecraftBlock } from '../render/minecraft_block';

	interface Props {
		block: MinecraftBlock;
	}

	let { block }: Props = $props();
	{
		console.log(block.nameResolver.file);
	}

	if (block.uvlock) {
		block!.uvManipulation.rotateTheFacesToInitialPositions();
	}

	function getTypedFace(face: FacesDataArray[keyof FacesDataArray]) {
		return face as ResolvedFaceData & { facing: Facing };
	}
</script>

{#each block.elements as element}
	<T.Mesh
		receiveShadow={element.shade}
		castShadow={element.shade}
		oncreate={(ref) => {
			ref.quaternion
				.multiplyQuaternions(
					new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -block.rotationRadians.x),
					ref.quaternion
				)
				.multiplyQuaternions(
					new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -block.rotationRadians.y),
					ref.quaternion
				);
			let position = element.getPositionInsideBlock();
			ref.position.set(...position.values);
			ref.geometry = new BoxGeometry(...element.size, 1, 1, 1)
				.toNonIndexed()
				.setAttribute(
					'uv',
					new Float32BufferAttribute(block.uvManipulation.translateUV(element.facesDataArray), 2)
				);
			if (element.rotation != null) {
				if (element.rotation.axis == 'y') {
					ref.quaternion.multiplyQuaternions(
						new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), element.rotationAngle),
						ref.quaternion
					);
					if (element.rotation.rescale == true) {
						ref.scale.setX(element.scaling);
						ref.scale.setZ(element.scaling);
					}
				}
				if (element.rotation.axis == 'x') {
					ref.quaternion.multiplyQuaternions(
						new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), element.rotationAngle),
						ref.quaternion
					);
					if (element.rotation.rescale == true) {
						ref.scale.setX(element.scaling);
						ref.scale.setY(element.scaling);
					}
				}
			}
		}}
	>
		{#each Object.values(element.facesDataArray) as face}
			{#if face.texture != undefined}
				{#if face.texture.asset.height > face.texture.asset.width}
					<AnimatedFace {block} {element} face={getTypedFace(face)} />
				{:else}
					<Face tintindex={face.tintindex} {block} {element} face={getTypedFace(face)} />
				{/if}
			{/if}
		{/each}
	</T.Mesh>
{/each}
