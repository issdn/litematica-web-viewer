import type { Vector3D } from '../parse/schematic_parser';
import type { BlockRotation, NBTBlockStateProperties, SimpleVector3D } from './common';

export type BlockContext = {
	rotation: Required<BlockRotation>;
	radiansRotation: Required<BlockRotation>;
	uvlock: boolean;
	instances: Vector3D[];
	properties: NBTBlockStateProperties;
	name: string;
};

export type ElementContext = {
	size: SimpleVector3D;
};
