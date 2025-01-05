import { Vector3 } from 'three';
import { BlockNameResolver } from '../resolve/block_name_resolver';
import type { NBTBlockStateProperties } from '../types/common';

export function tryParseVector3(vec: string | null) {
	if (vec === null) return null;
	const array = vec.split(',');
	if (array.length != 3) return null;
	try {
		return new Vector3(...array.map((val) => parseInt(val)));
	} catch {
		return null;
	}
}

export function stringifyVector3(vec: Vector3) {
	return vec.toArray().toString();
}

export function parseNBTBlockData(url: URL) {
	const searchParams = url.searchParams;
	const Name = BlockNameResolver.parse(searchParams.get('name') ?? 'grass_block');
	const Properties = searchParams.entries().reduce((prev, [key, value]) => {
		if (key.startsWith('camera') || key === 'instances' || key === 'name') {
			return prev;
		} else {
			return { ...prev, [key]: value };
		}
	}, {} as NBTBlockStateProperties);

	if (Object.values(Properties).length > 0) {
		return { Name, Properties };
	} else
		return {
			Name
		};
}
