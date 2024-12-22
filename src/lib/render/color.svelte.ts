import type { NBTBlockStateProperties } from '$lib/types/common';
import { getBiome } from './biome.svelte';

const _colors = {
	redstone: [
		'#4B0000',
		'#6F0000',
		'#790000',
		'#820000',
		'#8C0000',
		'#970000',
		'#A10000',
		'#AB0000',
		'#B50000',
		'#BF0000',
		'#CA0000',
		'#D30000',
		'#DD0000',
		'#E70600',
		'#F11B00',
		'#FC3100'
	],

	stem: ['#00FF00', '#20F704', '#40EF08', '#60E70C', '#80DF10', '#A0D714', '#C0CF18', '#E0C71C'],

	constant: {
		birch: '#80a755',
		spruce: '#619961',
		lily: '#208030'
	}
} as const;

const getGrass = () => getBiome().colors.grass;

const getFoliage = () => getBiome().colors.grass;

const getWater = () => getBiome().colors.water;

const getStem = (age: number) => _colors.stem[age];

const colorStore = $derived({
	redstone_wire: (properties: NBTBlockStateProperties) => _colors['redstone'][properties.power!],
	oak_leaves: () => getFoliage(),
	jungle_leaves: () => getFoliage(),
	acacia_leaves: () => getFoliage(),
	dark_oak_leaves: () => getFoliage(),
	mangrove_leaves: () => getFoliage(),
	grass_block: () => getGrass(),
	vine: () => getGrass(),
	potted_fern: () => getGrass(),
	short_grass: () => getGrass(),
	tall_grass: () => getGrass(),
	sugar_cane: () => getGrass(),
	pink_petal_steam: () => getGrass(),
	water: () => getWater(),
	water_cauldron: () => getWater(),
	lily_pad: () => _colors.constant.lily,
	birch_leaves: () => _colors.constant.birch,
	spruce_leaves: () => _colors.constant.spruce,
	pumpkin_stem: (properties: NBTBlockStateProperties) => getStem(properties.age!),
	melon_stem: (properties: NBTBlockStateProperties) => getStem(properties.age!)
} as const);

export const getColor = (k: string) => colorStore[k as keyof typeof colorStore];
