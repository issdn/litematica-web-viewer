import type { NBTBlockStateProperties } from '../common';

export type PropertyMap = Map<
	keyof NBTBlockStateProperties,
	Set<NonNullable<NBTBlockStateProperties[keyof NBTBlockStateProperties]>>
>;
