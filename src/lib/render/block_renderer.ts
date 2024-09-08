import {
	BlockType,
	Facing,
	type BlockRotation,
	type SimpleVector3D,
	type Element
} from '$lib/common_types';
import { Vector3D, type NBTVector3D } from '$lib/parse/schematic_parser';
import { Texture, Vector3 } from 'three';
import { degToRad } from 'three/src/math/MathUtils.js';
import type {
	ResolvedBlockModel,
	ResolvedElements,
	ResolvedFaceData,
	ResolvedFaces
} from '../minecraft_block_resolver';

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type FacesDataArray = (Optional<Required<ResolvedFaceData>, 'texture'> & {
	facing: Facing;
})[];

function uvManipulation(block: MinecraftBlock) {
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

class MinecraftBlock {
	position: NBTVector3D;
	blockModel: Required<ResolvedBlockModel>;
	rotationRadians: Required<BlockRotation>;
	rotationDegrees: Required<BlockRotation>;
	uvlock: boolean;
	blockType: BlockType;
	xAxisFaces = [Facing.North, Facing.Up, Facing.South, Facing.Down];
	yAxisFaces = [Facing.West, Facing.Down, Facing.East, Facing.Up];
	uvManipulation: ReturnType<typeof uvManipulation>;

	_elements?: MinecraftElement[];

	constructor(
		position: NBTVector3D,
		blockModel: Required<ResolvedBlockModel>,
		rotation: BlockRotation,
		uvlock: boolean,
		blockType: BlockType
	) {
		this.position = position;
		this.blockModel = blockModel;
		this.uvlock = uvlock;
		this.blockType = blockType;
		this.rotationDegrees = {
			x: rotation.x ?? 0,
			y: rotation.y ?? 0
		};
		this.rotationRadians = {
			x: degToRad(this.rotationDegrees.x),
			y: degToRad(this.rotationDegrees.y)
		};
		this.uvManipulation = uvManipulation(this);
	}

	get isTransparent() {
		return this.blockType == BlockType.transparent;
	}

	get isCross() {
		return this.blockType == BlockType.cross;
	}

	get elements() {
		if (this._elements == null) {
			this._elements = this._buildElements();
		}
		return this._elements;
	}

	_buildElements() {
		return this.blockModel.elements.map((element) => MinecraftElement.fromElement(element, this));
	}
}

class MinecraftElement {
	from: SimpleVector3D;
	to: SimpleVector3D;
	rotation?: Element['rotation'];
	faces: ResolvedFaces;
	size: SimpleVector3D;
	blockParent: MinecraftBlock;
	facesDataArray!: FacesDataArray;

	constructor(
		from: SimpleVector3D,
		to: SimpleVector3D,
		rotation: Element['rotation'],
		faces: ResolvedFaces,
		blockParent: MinecraftBlock
	) {
		this.from = from;
		this.to = to;
		this.rotation = rotation;
		this.faces = faces;
		this.size = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
		this.blockParent = blockParent;
		this.createFacesDataArray();
		this.generateUVs();
	}

	static fromElement(
		{ from, to, rotation, faces }: ResolvedElements[number],
		block: MinecraftBlock
	) {
		return new MinecraftElement(from, to, rotation, faces, block);
	}

	createFacesDataArray() {
		this.facesDataArray = [
			{
				...this.faces[Facing.East],
				facing: Facing.East
			},
			{
				...this.faces[Facing.West],
				facing: Facing.West
			},
			{
				...this.faces[Facing.Up],
				facing: Facing.Up
			},
			{
				...this.faces[Facing.Down],
				facing: Facing.Down
			},
			{
				...this.faces[Facing.South],
				facing: Facing.South
			},
			{
				...this.faces[Facing.North],
				facing: Facing.North
			}
		] as FacesDataArray;
	}

	generateUVs() {
		this.facesDataArray.forEach((item) => {
			if (item.uv == undefined) {
				const pv = 16 - this.to[1];
				switch (item.facing) {
					case Facing.North:
					case Facing.South:
						item['uv'] = [this.from[0], pv, this.from[0] + this.size[0], pv + this.to[1]];
						break;
					case Facing.Up:
						item['uv'] = [
							this.from[0],
							this.from[2],
							this.from[0] + this.size[0],
							this.from[2] + this.size[2]
						];
						break;
					case Facing.Down: {
						const pub = 16 - this.to[0];
						const pvb = 16 - this.to[2];
						item['uv'] = [
							pub,
							pvb,
							pub + this.to[0] - this.from[0],
							pvb + this.to[2] - this.from[2]
						];
						break;
					}
					case Facing.East: {
						const pu = 16 - this.to[2];
						item['uv'] = [pu, pv, pu + this.to[2] - this.from[2], pv + this.to[1]];
						break;
					}
					case Facing.West: {
						item['uv'] = [this.from[2], pv, this.from[2] + this.size[2], pv + this.to[1]];
						break;
					}
				}
			}
		});
	}

	getFacePosition(facing: Facing) {
		switch (facing) {
			case Facing.East:
				return 0;
			case Facing.West:
				return 1;
			case Facing.Up:
				return 2;
			case Facing.Down:
				return 3;
			case Facing.South:
				return 4;
			case Facing.North:
				return 5;
		}
	}

	getPositionInsideBlock() {
		const padding = new Vector3(16, 16, 16)
			.sub(new Vector3(...this.size))
			.divide(new Vector3(2, 2, 2));

		const fromRotated = new Vector3(...this.from);

		if (this.blockParent.rotationRadians.x != 0) {
			padding.applyAxisAngle(new Vector3(1, 0, 0), -this.blockParent.rotationRadians.x);
			fromRotated.applyAxisAngle(new Vector3(1, 0, 0), -this.blockParent.rotationRadians.x);
		}

		if (this.blockParent.rotationRadians.y != 0) {
			padding.applyAxisAngle(new Vector3(0, 1, 0), -this.blockParent.rotationRadians.y);
			fromRotated.applyAxisAngle(new Vector3(0, 1, 0), -this.blockParent.rotationRadians.y);
		}

		return new Vector3D(
			this.blockParent.position.x * 16 - padding.x + fromRotated.x,
			this.blockParent.position.y * 16 - padding.y + fromRotated.y,
			this.blockParent.position.z * 16 - padding.z + fromRotated.z
		);
	}
}

export { MinecraftElement, MinecraftBlock };
