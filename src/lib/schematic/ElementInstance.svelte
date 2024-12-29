<script lang="ts">
	import { Instance } from '@threlte/extras';
	import { getContext } from 'svelte';
	import { Quaternion, Vector3 } from 'three';
	import { type BlockContext, type ElementContext, type ModelContext } from '../types/context';
	import { degToRad } from 'three/src/math/MathUtils.js';
	import type { BlockRotation, SimpleVector3D } from '../types/common';
	import { Vector3D } from '../parse/schematic_parser';
	import type { ResolvedElements } from '../resolve/minecraft_block_resolver';

	type Props = Pick<ResolvedElements[number], 'rotation'> &
		Pick<ResolvedElements[number], 'from'> & {
			position: Vector3D;
			radiansRotation: Required<BlockRotation>;
		};

	const { rotation, from, position, radiansRotation }: Props = $props();

	const { size } = getContext<ElementContext>('element');

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

	const positionInsideBlock = [
		position.x * 16 - padding.x + fromRotated.x,
		position.y * 16 - padding.y + fromRotated.y,
		position.z * 16 - padding.z + fromRotated.z
	] as SimpleVector3D;
</script>

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
		if (rotation != null) {
			if (rotation.axis == 'x') {
				ref.quaternion.multiplyQuaternions(
					new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), rotationAngle),
					ref.quaternion
				);
				if (rotation.rescale == true) {
					ref.scale.setX(scaling);
					ref.scale.setY(scaling);
				}
			}
			if (rotation.axis == 'y') {
				ref.quaternion.multiplyQuaternions(
					new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), rotationAngle),
					ref.quaternion
				);
				if (rotation.rescale == true) {
					ref.scale.setX(scaling);
					ref.scale.setZ(scaling);
				}
			}
		}
	}}
	position={positionInsideBlock}
></Instance>
