const Biome = {
	Badlands: {
		temperature: 2.0,
		colors: {
			grass: '#90814d',
			foliage: '#9e814d',
			sky: '#6eb1ff',
			water: '#3f76e4'
		}
	},
	Beach: {
		temperature: 0.8,
		colors: {
			grass: '#91bd59',
			foliage: '#77ab2f',
			sky: '#78a7ff',
			water: '#3f76e4'
		}
	},
	'Birch Forest': {
		temperature: 0.6,
		colors: {
			grass: '#88bb67',
			foliage: '#6ba941',
			sky: '#7aa5ff',
			water: '#3f76e4'
		}
	},
	'Cold Ocean': {
		temperature: 0.5,
		colors: {
			grass: '#8eb971',
			foliage: '#71a74d',
			sky: '#7ba4ff',
			water: '#3d57d6'
		}
	},
	'Dark Forest': {
		temperature: 0.7,
		colors: {
			grass: '#507a32',
			foliage: '#59ae30',
			sky: '#79a6ff',
			water: '#3f76e4'
		}
	},
	'Deep Dark': {
		temperature: 0.8,
		colors: {
			grass: '#91bd59',
			foliage: '#77ab2f',
			sky: '#78a7ff',
			water: '#3f76e4'
		}
	},
	Desert: {
		temperature: 2.0,
		colors: {
			grass: '#bfb755',
			foliage: '#aea42a',
			sky: '#6eb1ff',
			water: '#3f76e4'
		}
	},
	Jungle: {
		temperature: 0.95,
		colors: {
			grass: '#59c93c',
			foliage: '#30bb0b',
			sky: '#77a8ff',
			water: '#3f76e4'
		}
	},
	Plains: {
		temperature: 0.8,
		colors: {
			grass: '#91bd59',
			foliage: '#77ab2f',
			sky: '#78a7ff',
			water: '#3f76e4'
		}
	},
	Savanna: {
		temperature: 2.0,
		colors: {
			grass: '#bfb755',
			foliage: '#aea42a',
			sky: '#6eb1ff',
			water: '#3f76e4'
		}
	},
	Swamp: {
		temperature: 0.8,
		colors: {
			grass: '#6a7039',
			foliage: '#8db127',
			sky: '#78a7ff',
			water: '#4c6559'
		}
	},
	'The Void': {
		temperature: 0.5,
		colors: {
			grass: '#8eb971',
			foliage: '#71a74d',
			sky: '#7ba4ff',
			water: '#3f76e4'
		}
	}
} as const;

let biome: (typeof Biome)[keyof typeof Biome] = $state(Biome['Badlands']);

export const getBiome = () => biome;

export const setBiome = (k: keyof typeof Biome) => (biome = Biome[k]);
