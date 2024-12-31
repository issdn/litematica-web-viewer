import { Vector3, type Vector3Like } from 'three';

type BlockStates = number[][];
type BlockStatePalette<T extends object> = T[];
type NBTVector3D = { x: number; y: number; z: number };
type Region<T extends object> = {
	Size: NBTVector3D;
	BlockStatePalette: BlockStatePalette<T>;
	Position: NBTVector3D;
	BlockStates: BlockStates;
};
type Regions<T extends object> = Record<string, Region<T>>;

function numberArrayToSignedBigInt(arr: number[]) {
	return BigInt.asIntN(64, BigInt(arr[0]) << 32n) | BigInt.asUintN(32, BigInt(arr[1]));
}

function bigIntZeroFillRightShift(value: bigint, shiftBy: bigint) {
	if (shiftBy < 0) {
		throw new RangeError('Shift count should be a non-negative integer');
	}
	if (value >= 0n) {
		return value >> shiftBy;
	} else {
		const bits = value.toString(2).length;
		const mask = (1n << BigInt(bits)) - 1n;
		const maskedValue = value & mask;
		return maskedValue >> shiftBy;
	}
}

// https://gist.github.com/ananich/631f9d40d20ec3aa5104
function numberOfLeadingZeros(x: number) {
	if (x == 0) return 32;
	let n = 1;
	if (x >>> 16 == 0) {
		n += 16;
		x <<= 16;
	}
	if (x >>> 24 == 0) {
		n += 8;
		x <<= 8;
	}
	if (x >>> 28 == 0) {
		n += 4;
		x <<= 4;
	}
	if (x >>> 30 == 0) {
		n += 2;
		x <<= 2;
	}
	n -= x >>> 31;
	return n;
}

function setRelativeEndPositionFromAreaSize(vector: Vector3) {
	const x = vector.x >= 0 ? vector.x - 1 : vector.x + 1;
	const y = vector.y >= 0 ? vector.y - 1 : vector.y + 1;
	const z = vector.z >= 0 ? vector.z - 1 : vector.z + 1;

	vector.set(x, y, z);
}

function getMinCorners(vector: NBTVector3D, other: NBTVector3D) {
	return new Vector3(
		Math.min(vector.x, other.x),
		Math.min(vector.y, other.y),
		Math.min(vector.z, other.z)
	);
}

function getMaxCorners(vector: NBTVector3D, other: NBTVector3D) {
	return new Vector3(
		Math.max(vector.x, other.x),
		Math.max(vector.y, other.y),
		Math.max(vector.z, other.z)
	);
}

function absoluteVector(vector: Vector3Like) {
	return new Vector3(Math.abs(vector.x), Math.abs(vector.y), Math.abs(vector.z));
}

function buildBlockStateArray<T extends object>(
	blockStates: BlockStates,
	blockPalette: BlockStatePalette<T>,
	size: NBTVector3D,
	position: NBTVector3D
) {
	const bitsPerEntry = Math.max(2, 32 - numberOfLeadingZeros(blockPalette.length - 1));
	const maxEntryValue = BigInt((1 << bitsPerEntry) - 1);

	const sizeVector = new Vector3(...Object.values(size));
	const endVector = absoluteVector(sizeVector);

	setRelativeEndPositionFromAreaSize(sizeVector);
	sizeVector.add(position);

	const minimumRelativeCorner = getMinCorners(sizeVector, position);

	const posMinRelMinusReg = minimumRelativeCorner.sub(position);

	function getAt(index: number) {
		const startOffset = index * bitsPerEntry;
		const startArrIndex = startOffset >> 6;
		const endArrIndex = ((index + 1) * bitsPerEntry - 1) >> 6;
		const startBitOffset = BigInt(startOffset & 0x3f);

		const blockState = numberArrayToSignedBigInt(blockStates[startArrIndex]);
		if (startArrIndex == endArrIndex) {
			return (blockState >> BigInt(startBitOffset)) & maxEntryValue;
		} else {
			const endOffset = 64n - startBitOffset;
			return (
				(bigIntZeroFillRightShift(blockState, startBitOffset) |
					(numberArrayToSignedBigInt(blockStates[endArrIndex]) << endOffset)) &
				maxEntryValue
			);
		}
	}

	function traverseAxis(value: number, fn: (point: number) => void) {
		for (let point = 0; point < value; point++) {
			fn(point);
		}
	}

	function traverse(fn: (block: { position: Vector3 } & T) => void) {
		traverseAxis(endVector.y, (y) => {
			traverseAxis(endVector.z, (z) => {
				traverseAxis(endVector.x, (x) => {
					const index = y * endVector.x * endVector.z + z * endVector.x + x;
					const state = getAt(index);
					const block = blockPalette[Number(state)];
					const blockPosition = posMinRelMinusReg.clone().add({ x, y, z }).add(position);
					fn({
						position: blockPosition,
						...block
					});
				});
			});
		});
	}

	return {
		traverse
	};
}

export { buildBlockStateArray, getMaxCorners, getMinCorners, absoluteVector };

export type { BlockStates, NBTVector3D, Region, Regions };
