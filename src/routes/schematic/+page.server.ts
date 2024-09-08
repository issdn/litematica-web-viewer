import type { Regions } from '$lib/parse/schematic_parser';
import { parse, simplify } from 'prismarine-nbt';
import { Buffer } from 'buffer';
import type { NBTBlockState, Size } from '$lib/common_types';
import test from './testcase0.litematic?url';

function stringToArray(val: string | null | undefined) {
	if (val?.includes(',')) {
		const splitted = val.split(',');
		const arr = Array.from(splitted);
		if (arr.length != 3) return null;
		return arr;
	}
}

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, url }) {
	const camerapos = stringToArray(url.searchParams.get('cp'));
	const lookingat = stringToArray(url.searchParams.get('lat'));
	const nbt = await parse(Buffer.from(await (await fetch(test)).arrayBuffer()));
	const regions: Regions<NBTBlockState> = simplify(nbt.parsed)['Regions'];
	return regions;
}
