import type { Blockstate, NBTBlockStateProperties } from '../types/common';
import { ResolvingError } from './minecraft_block_resolver';

type PropertyKeys = Record<string, NBTBlockStateProperties[keyof NBTBlockStateProperties]>;

export class BlockstateResolver {
	readVariantKey(stringKey: string): NBTBlockStateProperties {
		if (stringKey == '') return {} as NBTBlockStateProperties;
		return stringKey.split(',').reduce((prev, curr) => {
			const [key, value] = curr.split('=');
			return { ...prev, [key]: value };
		}, {} as NBTBlockStateProperties);
	}

	getPropertyKeys(properties: NBTBlockStateProperties) {
		return Object.entries(properties).reduce((prev, [key, value]) => {
			if (value != 'none') return { ...prev, [key]: value };
			else return prev;
		}, {} as PropertyKeys);
	}

	doesMatchAND(values: NBTBlockStateProperties[], keys: PropertyKeys): boolean {
		return values.every((caseObj) => this.doesMatch(caseObj, keys));
	}

	doesMatchOR(values: NBTBlockStateProperties[], keys: PropertyKeys) {
		return values.findIndex((caseObj) => this.doesMatch(caseObj, keys)) != -1;
	}

	doesMatch(values: NBTBlockStateProperties, keys: PropertyKeys) {
		return Object.entries(values).every(([key, value]) => {
			if (!(key in keys)) return false;
			if (typeof value == 'string') {
				if (typeof keys[key] != 'string') {
					throw new ResolvingError('Property key has incorrect type');
				}
				return value.split('|').includes(keys[key]);
			}
			return keys[key] == value;
		});
	}

	isMultipart(blockstate: Blockstate) {
		return Object.keys(blockstate)[0] == 'multipart';
	}
}
