import { Facing, type SimpleVector3D, type Element } from '$lib/types/common';
import { Vector3D, type NBTVector3D } from '$lib/parse/schematic_parser';
import { Vector3 } from 'three';
import { degToRad } from 'three/src/math/MathUtils.js';
import type {
	ResolvedElements,
	ResolvedFaceData,
	ResolvedFaces
} from '../resolve/minecraft_block_resolver';
import type { BlockRotation, Optional } from '$lib/types/common';

export type FacesDataArray = (Optional<Required<ResolvedFaceData>, 'texture'> & {
	facing: Facing;
})[];

export class MinecraftElement {
	from: SimpleVector3D;
	to: SimpleVector3D;
	rotation?: Element['rotation'];
	faces: ResolvedFaces;
	size: SimpleVector3D;
	shade: boolean;
	facesDataArray!: FacesDataArray;

	constructor(
		from: SimpleVector3D,
		to: SimpleVector3D,
		rotation: Element['rotation'],
		faces: ResolvedFaces,
		shade: boolean = true
	) {
		this.from = from;
		this.to = to;
		this.rotation = rotation;
		this.faces = faces;
		this.shade = shade;
		this.size = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
		this.createFacesDataArray();
		this.generateUVs();
	}

	static fromElement({ from, to, rotation, faces, shade }: ResolvedElements[number]) {
		return new MinecraftElement(from, to, rotation, faces, shade);
	}

	get rotationAngle() {
		return this.rotation == null ? 0 : degToRad(this.rotation.angle);
	}

	get scaling() {
		if (this.rotation == null) return 1;
		return 1 / Math.cos(this.rotationAngle);
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

	getPositionInsideBlock(
		radiansBlockRotation: Required<BlockRotation>,
		blockPosition: NBTVector3D
	) {
		const padding = new Vector3(16, 16, 16)
			.sub(new Vector3(...this.size))
			.divide(new Vector3(2, 2, 2));

		const fromRotated = new Vector3(...this.from);

		if (radiansBlockRotation.x != 0) {
			padding.applyAxisAngle(new Vector3(1, 0, 0), -radiansBlockRotation.x);
			fromRotated.applyAxisAngle(new Vector3(1, 0, 0), -radiansBlockRotation.x);
		}

		if (radiansBlockRotation.y != 0) {
			padding.applyAxisAngle(new Vector3(0, 1, 0), -radiansBlockRotation.y);
			fromRotated.applyAxisAngle(new Vector3(0, 1, 0), -radiansBlockRotation.y);
		}

		return new Vector3D(
			blockPosition.x * 16 - padding.x + fromRotated.x,
			blockPosition.y * 16 - padding.y + fromRotated.y,
			blockPosition.z * 16 - padding.z + fromRotated.z
		);
	}
}
