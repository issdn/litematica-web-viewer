import { Vector3 } from 'three';

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
