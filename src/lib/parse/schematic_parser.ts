import type { SimpleVector3D } from '$lib/common_types';

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

class Vector3D {
	x: number;
	y: number;
	z: number;

	values: SimpleVector3D;

	constructor(x: number, y: number, z: number) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.values = [x, y, z];
	}

	static fromNBTVector3D({ x, y, z }: NBTVector3D) {
		return new Vector3D(x, y, z);
	}

	toNBTVector3D() {
		return { x: this.x, y: this.y, z: this.z };
	}

	getRelativeEndPositionFromAreaSize() {
		const x = this.x >= 0 ? this.x - 1 : this.x + 1;
		const y = this.y >= 0 ? this.y - 1 : this.y + 1;
		const z = this.z >= 0 ? this.z - 1 : this.z + 1;

		return Vector3D.fromNBTVector3D({ x, y, z });
	}

	getMinCorners(other: NBTVector3D) {
		return Vector3D.fromNBTVector3D({
			x: Math.min(this.x, other.x),
			y: Math.min(this.y, other.y),
			z: Math.min(this.z, other.z)
		});
	}

	getMaxCorner(other: NBTVector3D) {
		return Vector3D.fromNBTVector3D({
			x: Math.max(this.x, other.x),
			y: Math.max(this.y, other.y),
			z: Math.max(this.z, other.z)
		});
	}

	add(other: NBTVector3D) {
		return Vector3D.fromNBTVector3D({
			x: this.x + other.x,
			y: this.y + other.y,
			z: this.z + other.z
		});
	}

	substract(other: NBTVector3D) {
		return this.add({ x: -other.x, y: -other.y, z: -other.z });
	}

	divide(other: NBTVector3D) {
		return Vector3D.fromNBTVector3D({
			x: Math.floor(this.x / other.x),
			y: Math.floor(this.y / other.y),
			z: Math.floor(this.z / other.z)
		});
	}

	toAbsolute() {
		return Vector3D.fromNBTVector3D({
			x: Math.abs(this.x),
			y: Math.abs(this.y),
			z: Math.abs(this.z)
		});
	}

	toString() {
		return `x: ${this.x} y: ${this.y} z: ${this.z}`;
	}
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

function buildBlockStateArray<T extends object>(
	blockStates: BlockStates,
	blockPalette: BlockStatePalette<T>,
	size: NBTVector3D,
	position: NBTVector3D
) {
	const bitsPerEntry = Math.max(2, 32 - numberOfLeadingZeros(blockPalette.length - 1));
	const maxEntryValue = BigInt((1 << bitsPerEntry) - 1);

	const sizeVector = Vector3D.fromNBTVector3D(size);
	const endVector = sizeVector.toAbsolute();

	const relativeEndPosition = sizeVector.getRelativeEndPositionFromAreaSize().add(position);
	const minimumRelativeCorner = relativeEndPosition.getMinCorners(position);

	const posMinRelMinusReg = minimumRelativeCorner.substract(position);

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

	async function traverseAxis(value: number, fn: (point: number) => Promise<void>) {
		for (let point = 0; point < value; point++) {
			await fn(point);
		}
	}

	async function traverse(fn: (block: { position: Vector3D } & T) => Promise<void> | void) {
		await traverseAxis(endVector.y, async (y) => {
			await traverseAxis(endVector.z, async (z) => {
				await traverseAxis(endVector.x, async (x) => {
					const index = y * endVector.x * endVector.z + z * endVector.x + x;
					const state = getAt(index);
					const block = blockPalette[Number(state)];
					const blockPosition = posMinRelMinusReg.add({ x, y, z }).add(position);
					await fn({
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

export { buildBlockStateArray, Vector3D };

export type { BlockStates, NBTVector3D, Region, Regions };
