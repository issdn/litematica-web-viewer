import { Facing } from '$lib/types/common';
import type { BlockRotation, FacesDataArray } from '../types/common';

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

	function rotateUVs(uvs: [number, number, number, number], angle: number) {
		const [u1, v1, u2, v2] = uvs;

		const centerU = 0.5;
		const centerV = 0.5;

		const translatedU1 = u1 - centerU;
		const translatedV1 = v1 - centerV;
		const translatedU2 = u2 - centerU;
		const translatedV2 = v2 - centerV;

		const cos = Math.cos(angle);
		const sin = Math.sin(angle);

		const rotatedU1 = translatedU1 * cos - translatedV1 * sin + centerU;
		const rotatedV1 = translatedU1 * sin + translatedV1 * cos + centerV;
		const rotatedU2 = translatedU2 * cos - translatedV2 * sin + centerU;
		const rotatedV2 = translatedU2 * sin + translatedV2 * cos + centerV;

		return [rotatedU1, rotatedV1, rotatedU2, rotatedV2];
	}

	function rotateSquare(uvs: number[], angle: number) {
		return [
			...rotateUVs([uvs[0], uvs[1], uvs[2], uvs[3]], angle),
			...rotateUVs([uvs[4], uvs[5], uvs[6], uvs[7]], angle),
			...rotateUVs([uvs[8], uvs[9], uvs[10], uvs[11]], angle)
		];
	}

	function adjustUVs(uvs: number[], facing: Facing, { x, y }: Required<BlockRotation>) {
		const hasXRotation = x != 0;
		const hasYRotation = y != 0;
		if (hasXRotation && hasYRotation) {
			if (facing == yAxisFaces[3]) {
				return rotateSquare(uvs, -y);
			}
			if (facing == xAxisFaces[2]) {
				return rotateSquare(uvs, y);
			}
			if (facing == yAxisFaces[0]) {
				return rotateSquare(uvs, -x);
			}
			if (facing == yAxisFaces[2]) {
				return rotateSquare(uvs, x);
			}
		} else {
			if (hasYRotation) {
				if (facing == xAxisFaces[1]) {
					return rotateSquare(uvs, -y);
				}
				if (facing == xAxisFaces[3]) {
					return rotateSquare(uvs, y);
				}
			}
			if (hasXRotation) {
				if (facing == yAxisFaces[0]) {
					return rotateSquare(uvs, -x);
				}
				if (facing == yAxisFaces[2]) {
					return rotateSquare(uvs, x);
				}
			}
		}
		return uvs;
	}

	function translateUV(faces: FacesDataArray, blockRotation: Required<BlockRotation>) {
		return faces.flatMap(({ rotation, uv, texture, facing }) => {
			rotation ??= 0;

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
					return adjustUVs([u2, v2, u1, v2, u2, v1, u1, v2, u1, v1, u2, v1], facing, blockRotation);
				case 180:
					v1 = 1 - v1;
					v2 = 1 - v2;
					return adjustUVs([u2, v2, u2, v1, u1, v2, u2, v1, u1, v1, u1, v2], facing, blockRotation);
				case 270:
					v1 = 1 - v1;
					v2 = 1 - v2;
					u1 = 1 - u1;
					u2 = 1 - u2;
					return adjustUVs([u1, v1, u2, v1, u1, v2, u2, v1, u2, v2, u1, v2], facing, blockRotation);
				default:
					v1 = 1 - v1;
					v2 = 1 - v2;
					return adjustUVs([u1, v1, u1, v2, u2, v1, u1, v2, u2, v2, u2, v1], facing, blockRotation);
			}
		});
	}

	return {
		rotateTheFacesToInitialPositions,
		translateUV
	};
}
