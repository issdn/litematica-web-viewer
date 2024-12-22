import type { Texture } from 'three';
import { Facing } from '$lib/types/common';
import type { ResolvedFaceData } from '../resolve/minecraft_block_resolver';
import type { BlockRotation, Optional } from '../types/common';

export function uvManipulation() {
	const xAxisFaces = [Facing.North, Facing.Up, Facing.South, Facing.Down];
	const yAxisFaces = [Facing.West, Facing.Down, Facing.East, Facing.Up];

	function rotateTheFacesToInitialPositions(degreesRotation: Required<BlockRotation>) {
		if (degreesRotation.x != 0 && degreesRotation.y != 0) {
			if (degreesRotation.x != 0) {
				const xSteps = degreesRotation.x / 90;
				for (let i = 0; i < xSteps; i++) {
					yAxisFaces[1] = xAxisFaces[2];
					yAxisFaces[3] = xAxisFaces[0];
					const elem = xAxisFaces.pop();
					xAxisFaces.unshift(elem!);
				}
			}

			if (degreesRotation.y != 0) {
				const ySteps = degreesRotation.y / 90;
				for (let i = 0; i < ySteps; i++) {
					xAxisFaces[1] = yAxisFaces[3];
					xAxisFaces[3] = yAxisFaces[1];
					const elem = yAxisFaces.shift();
					yAxisFaces.push(elem!);
				}
			}
		} else if (degreesRotation.x != 0 || degreesRotation.y != 0) {
			// if (degreesRotation.x != 0) {
			// 	const xSteps = degreesRotation.x / 90;
			// 	for (let i = 0; i < xSteps; i++) {
			// 		const tempY = yAxisFaces;
			// 		yAxisFaces[0] = xAxisFaces[0];
			// 		yAxisFaces[1] = xAxisFaces[1];
			// 		xAxisFaces[3] = tempY[0];
			// 		xAxisFaces[0] = tempY[3];
			// 	}
			// }
			if (degreesRotation.y != 0) {
				const ySteps = degreesRotation.y / 90;
				for (let i = 0; i < ySteps; i++) {
					const tempY = [...yAxisFaces];
					yAxisFaces[0] = xAxisFaces[0];
					yAxisFaces[2] = xAxisFaces[2];
					xAxisFaces[2] = tempY[0];
					xAxisFaces[0] = tempY[2];
				}
			}
		}
	}

	function rotateMap(facing: Facing, map: Texture, radiansRotation: Required<BlockRotation>) {
		const hasXRotation = radiansRotation.x != 0;
		const hasYRotation = radiansRotation.y != 0;
		if (hasXRotation && hasYRotation) {
			if (facing == yAxisFaces[3]) {
				map.rotation = radiansRotation.y;
			}
			if (facing == xAxisFaces[2]) {
				map.rotation = -radiansRotation.y;
			}

			if (facing == yAxisFaces[0]) {
				map.rotation = radiansRotation.x;
			}
			if (facing == yAxisFaces[2]) {
				map.rotation = -radiansRotation.x;
			}
		} else {
			if (hasYRotation) {
				if (facing == xAxisFaces[1]) {
					map.rotation = radiansRotation.y;
				}
				if (facing == xAxisFaces[3]) {
					map.rotation = -radiansRotation.y;
				}
			}
			if (hasXRotation) {
				if (facing == yAxisFaces[0]) {
					map.rotation = radiansRotation.x;
				}
				if (facing == yAxisFaces[2]) {
					map.rotation = -radiansRotation.x;
				}
			}
		}
	}

	function translateUV(faces: Optional<Required<ResolvedFaceData>, 'texture'>[]) {
		return faces.flatMap(({ rotation, uv, texture }) => {
			let [u1, v1, u2, v2] = uv;

			const h = texture?.asset.height;
			const w = texture?.asset.width;

			u1 /= 16;
			v1 /= (16 * (h ?? 1)) / (w ?? 1);
			u2 /= 16;
			v2 /= (16 * (h ?? 1)) / (w ?? 1);

			switch (rotation) {
				case 90:
					v1 = 1 - v1;
					v2 = 1 - v2;
					u1 = 1 - u1;
					u2 = 1 - u2;
					return [u2, v2, u1, v2, u2, v1, u1, v2, u1, v1, u2, v1];
				case 180:
					v1 = 1 - v1;
					v2 = 1 - v2;
					return [u2, v2, u2, v1, u1, v2, u2, v1, u1, v1, u1, v2];
				case 270:
					v1 = 1 - v1;
					v2 = 1 - v2;
					u1 = 1 - u1;
					u2 = 1 - u2;
					return [u1, v1, u2, v1, u1, v2, u2, v1, u2, v2, u1, v2];
				default:
					v1 = 1 - v1;
					v2 = 1 - v2;
					return [u1, v1, u1, v2, u2, v1, u1, v2, u2, v2, u2, v1];
			}
		});
	}

	return {
		rotateTheFacesToInitialPositions,
		rotateMap,
		translateUV
	};
}
