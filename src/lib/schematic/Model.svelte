<script lang="ts">
	import { T } from '@threlte/core';
	import {
		Float32BufferAttribute,
		Vector3,
		BoxGeometry,
		Quaternion,
		Vector2,
		Texture
	} from 'three';
	import type { ResolvedBlockModel, ResolvedFaceData } from '$lib/resolve/minecraft_block_resolver';
	import Face from './Face.svelte';
	import AnimatedFace from './AnimatedFace.svelte';
	import type { BlockRotation, FaceData, Facing, NBTBlockStateProperties } from '$lib/types/common';
	import { MinecraftElement, type FacesDataArray } from '../render/minecraft_element';
	import { uvManipulation } from '../render/uv';
	import { degToRad } from 'three/src/math/MathUtils.js';
	import type { NBTVector3D, Vector3D } from '../parse/schematic_parser';
	import type { Color } from '../render/color.svelte';
	import { Instance, InstancedMesh } from '@threlte/extras';

	interface Props {
		blockRotation: Required<BlockRotation>;
		blockPosition: NBTVector3D;
		uvlock: boolean;
		blockModel: Required<ResolvedBlockModel>;
		getElementColor: (tintindex: FaceData['tintindex']) => Color | undefined;
		instances: Vector3D[];
	}

	let { blockRotation, uvlock, getElementColor, blockModel, blockPosition, instances }: Props =
		$props();

	const { rotateTheFacesToInitialPositions, rotateMap, translateUV } = uvManipulation();

	const radiansRotation = { x: degToRad(blockRotation.x), y: degToRad(blockRotation.y) };

	const elements = blockModel.elements.map((element) => MinecraftElement.fromElement(element));

	if (uvlock) {
		rotateTheFacesToInitialPositions(blockRotation);
	}

	function getTypedFace(face: FacesDataArray[keyof FacesDataArray]) {
		return face as ResolvedFaceData & { facing: Facing };
	}
</script>

{#each elements as element}
	<InstancedMesh
		receiveShadow={element.shade}
		castShadow={element.shade}
		oncreate={(ref) => {
			ref.geometry = new BoxGeometry(...element.size, 1, 1, 1)
				.toNonIndexed()
				.setAttribute('uv', new Float32BufferAttribute(translateUV(element.facesDataArray), 2));
		}}
	>
		{#each instances as vec}
			<Instance
				oncreate={(ref) => {
					ref.quaternion
						.multiplyQuaternions(
							new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -radiansRotation.x),
							ref.quaternion
						)
						.multiplyQuaternions(
							new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -radiansRotation.y),
							ref.quaternion
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
				position={element.getPositionInsideBlock(radiansRotation, vec).values}
			></Instance>
		{/each}
		{#each Object.values(element.facesDataArray) as face}
			{#snippet getFace(texture?: Texture)}
				<Face
					{texture}
					materialColor={getElementColor(face.tintindex)}
					{element}
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
{/each}
