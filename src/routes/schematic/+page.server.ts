import animations from './animations.litematic?url';
import { getRegions } from '$root/src/lib/parse/schematic_parser';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	return { regions: await getRegions(await (await fetch(animations)).arrayBuffer()) };
}
