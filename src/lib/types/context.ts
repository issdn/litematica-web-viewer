import type { Vector3D } from '../parse/schematic_parser';
import type { BlockRotation, NBTBlockStateProperties, SimpleVector3D } from './common';

export type BlockContext = {
	instances: Vector3D[];
	properties: NBTBlockStateProperties;
	name: string;
};

export type ModelContext = {
	rotation: Required<BlockRotation>;
	radiansRotation: Required<BlockRotation>;
	uvlock: boolean;
};

export type ElementContext = {
	size: SimpleVector3D;
};
