import type { Texture } from 'three';
import type { Facing } from '../common_types';
import type { MinecraftBlock } from './minecraft_block';
import type { ResolvedFaceData } from '../resolve/minecraft_block_resolver';
import type { Optional } from '../types/common';

export function uvManipulation(block: MinecraftBlock) {
	function rotateTheFacesToInitialPositions() {
		if (block.rotationDegrees.x != 0 && block.rotationDegrees.y != 0) {
			if (block.rotationDegrees.x != 0) {
				const xSteps = block.rotationDegrees.x / 90;
				for (let i = 0; i < xSteps; i++) {
					block.yAxisFaces[1] = block.xAxisFaces[2];
					block.yAxisFaces[3] = block.xAxisFaces[0];
					const elem = block.xAxisFaces.pop();
					block.xAxisFaces.unshift(elem!);
				}
			}

			if (block.rotationDegrees.y != 0) {
				const ySteps = block.rotationDegrees.y / 90;
				for (let i = 0; i < ySteps; i++) {
					block.xAxisFaces[1] = block.yAxisFaces[3];
					block.xAxisFaces[3] = block.yAxisFaces[1];
					const elem = block.yAxisFaces.shift();
					block.yAxisFaces.push(elem!);
				}
			}
		} else if (block.rotationDegrees.x != 0 || block.rotationDegrees.y != 0) {
			// if (block.rotationDegrees.x != 0) {
			// 	const xSteps = block.rotationDegrees.x / 90;
			// 	for (let i = 0; i < xSteps; i++) {
			// 		const tempY = block.yAxisFaces;
			// 		block.yAxisFaces[0] = block.xAxisFaces[0];
			// 		block.yAxisFaces[1] = block.xAxisFaces[1];
			// 		block.xAxisFaces[3] = tempY[0];
			// 		block.xAxisFaces[0] = tempY[3];
			// 	}
			// }
			if (block.rotationDegrees.y != 0) {
				const ySteps = block.rotationDegrees.y / 90;
				for (let i = 0; i < ySteps; i++) {
					const tempY = [...block.yAxisFaces];
					block.yAxisFaces[0] = block.xAxisFaces[0];
					block.yAxisFaces[2] = block.xAxisFaces[2];
					block.xAxisFaces[2] = tempY[0];
					block.xAxisFaces[0] = tempY[2];
				}
			}
		}
	}

	function rotateMap(facing: Facing, map: Texture) {
		const hasXRotation = block.rotationRadians.x != 0;
		const hasYRotation = block.rotationRadians.y != 0;
		if (hasXRotation && hasYRotation) {
			if (facing == block.yAxisFaces[3]) {
				map.rotation = block.rotationRadians.y;
			}
			if (facing == block.xAxisFaces[2]) {
				map.rotation = -block.rotationRadians.y;
			}

			if (facing == block.yAxisFaces[0]) {
				map.rotation = block.rotationRadians.x;
			}
			if (facing == block.yAxisFaces[2]) {
				map.rotation = -block.rotationRadians.x;
			}
		} else {
			if (hasYRotation) {
				if (facing == block.xAxisFaces[1]) {
					map.rotation = block.rotationRadians.y;
				}
				if (facing == block.xAxisFaces[3]) {
					map.rotation = -block.rotationRadians.y;
				}
			}
			if (hasXRotation) {
				if (facing == block.yAxisFaces[0]) {
					map.rotation = block.rotationRadians.x;
				}
				if (facing == block.yAxisFaces[2]) {
					map.rotation = -block.rotationRadians.x;
				}
			}
		}
	}

	function translateUV(faces: Optional<Required<ResolvedFaceData>, 'texture'>[]) {
		return faces.flatMap(({ rotation, uv, texture }) => {
			let [u1, v1, u2, v2] = uv;

			u1 /= 16;
			v1 /= texture?.asset.height ?? 16;
			u2 /= 16;
			v2 /= texture?.asset.height ?? 16;

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
