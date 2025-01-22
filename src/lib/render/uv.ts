import { Facing } from '$lib/types/common';
import type { BlockRotation, FacesDataArray } from '../types/common';

type UVData = {
	dx: number;
	dy: number;
	size: number;
	uvs: number[];
	angle: number;
};

const xAxisFaces = [Facing.North, Facing.Up, Facing.South, Facing.Down];
const yAxisFaces = [Facing.West, Facing.Down, Facing.East, Facing.Up];

export function rotateTheFacesToInitialPositions(degreesRotation: Required<BlockRotation>) {
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

export function rotateUVs({ uvs, angle, dx, dy, size }: UVData) {
	const [u1, v1, u2, v2] = uvs;

	const centerU = size / 2;
	const centerV = size / 2;

	const translatedU1 = u1 - centerU - dx;
	const translatedV1 = v1 - centerV - dy;
	const translatedU2 = u2 - centerU - dx;
	const translatedV2 = v2 - centerV - dy;

	const cos = Math.cos(angle);
	const sin = Math.sin(angle);

	const rotatedU1 = translatedU1 * cos - translatedV1 * sin + centerU;
	const rotatedV1 = translatedU1 * sin + translatedV1 * cos + centerV;
	const rotatedU2 = translatedU2 * cos - translatedV2 * sin + centerU;
	const rotatedV2 = translatedU2 * sin + translatedV2 * cos + centerV;

	return [rotatedU1 + dx, rotatedV1 + dy, rotatedU2 + dx, rotatedV2 + dy];
}

export function rotateSquare({ uvs, ...rest }: UVData) {
	return [
		...rotateUVs({ uvs: [uvs[0], uvs[1], uvs[2], uvs[3]], ...rest }),
		...rotateUVs({ uvs: [uvs[4], uvs[5], uvs[6], uvs[7]], ...rest }),
		...rotateUVs({ uvs: [uvs[8], uvs[9], uvs[10], uvs[11]], ...rest })
	];
}

export function adjustUVs(
	uvs: number[],
	facing: Facing,
	{ x, y }: Required<BlockRotation>,
	size: number,
	{ dx, dy }: { dx: number; dy: number }
) {
	const hasXRotation = x != 0;
	const hasYRotation = y != 0;
	if (hasXRotation && hasYRotation) {
		if (facing == yAxisFaces[3]) {
			return rotateSquare({ uvs, angle: y, dx, dy, size });
		}
		if (facing == xAxisFaces[2]) {
			return rotateSquare({ uvs, angle: -y, dx, dy, size });
		}
		if (facing == yAxisFaces[0]) {
			return rotateSquare({ uvs, angle: x, dx, dy, size });
		}
		if (facing == yAxisFaces[2]) {
			return rotateSquare({ uvs, angle: -x, dx, dy, size });
		}
	} else {
		if (hasYRotation) {
			if (facing == xAxisFaces[1]) {
				return rotateSquare({ uvs, angle: y, dx, dy, size });
			}
			if (facing == xAxisFaces[3]) {
				return rotateSquare({ uvs, angle: -y, dx, dy, size });
			}
		}
		if (hasXRotation) {
			if (facing == yAxisFaces[0]) {
				return rotateSquare({ uvs, angle: x, dx, dy, size });
			}
			if (facing == yAxisFaces[2]) {
				return rotateSquare({ uvs, angle: -x, dx, dy, size });
			}
		}
	}
	return uvs;
}

export function translateUV({ rotation, uv }: FacesDataArray[number]) {
	rotation ??= 0;

	const [u1, v1, u2, v2] = uv;

	switch (rotation) {
		case 90:
			return [u2, v2, u1, v2, u2, v1, u1, v2, u1, v1, u2, v1];
		case 180:
			return [u2, v2, u2, v1, u1, v2, u2, v1, u1, v1, u1, v2];
		case 270:
			return [u1, v1, u2, v1, u1, v2, u2, v1, u2, v2, u1, v2];
		default:
			return [u1, v1, u1, v2, u2, v1, u1, v2, u2, v2, u2, v1];
	}
}
