import type { Vector3D } from '../parse/schematic_parser';
import type { NBTBlockStateProperties } from './common';

export type BlockContext = {
	instances: Vector3D[];
	properties: NBTBlockStateProperties;
	name: string;
	transparent: boolean;
};
