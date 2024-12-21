import { Facing, type BlockRotation, type NBTBlockStateProperties } from '$lib/common_types';
import { type NBTVector3D } from '$lib/parse/schematic_parser';
import { degToRad } from 'three/src/math/MathUtils.js';
import type { ResolvedBlockModel } from '../resolve/minecraft_block_resolver';
import type { BlockNameResolver } from '../resolve/block_name_resolver';
import { uvManipulation } from './uv';
import { MinecraftElement } from './minecraft_element';

export class MinecraftBlock {
	position: NBTVector3D;
	blockModel: Required<ResolvedBlockModel>;
	rotationRadians: Required<BlockRotation>;
	rotationDegrees: Required<BlockRotation>;
	uvlock: boolean;
	xAxisFaces = [Facing.North, Facing.Up, Facing.South, Facing.Down];
	yAxisFaces = [Facing.West, Facing.Down, Facing.East, Facing.Up];
	uvManipulation: ReturnType<typeof uvManipulation>;
	nameResolver: BlockNameResolver;
	properties: NBTBlockStateProperties;

	_elements?: MinecraftElement[];

	constructor(
		position: NBTVector3D,
		blockModel: Required<ResolvedBlockModel>,
		rotation: BlockRotation,
		uvlock: boolean,
		nameResolver: BlockNameResolver,
		properties: NBTBlockStateProperties
	) {
		this.position = position;
		this.blockModel = blockModel;
		this.uvlock = uvlock;
		this.rotationDegrees = {
			x: rotation.x ?? 0,
			y: rotation.y ?? 0
		};
		this.rotationRadians = {
			x: degToRad(this.rotationDegrees.x),
			y: degToRad(this.rotationDegrees.y)
		};
		this.uvManipulation = uvManipulation(this);
		this.nameResolver = nameResolver;
		this.properties = properties;
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
