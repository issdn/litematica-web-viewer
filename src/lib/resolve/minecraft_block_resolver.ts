import type {
	BlockModel,
	FaceData,
	Faces,
	Facing,
	MCMeta,
	Model,
	ModelTexture,
	Multipart,
	NBTBlockStateProperties,
	Variants
} from '$lib/types/common';

import {
	BlockNameResolver,
	type FolderFile,
	type NamespaceFolderFile
} from './block_name_resolver';
import type { MinecraftAssetsManager } from '../textures/assets_manager';

export const enum FileType {
	Blockstate,
	BlockModel,
	Texture,
	MCMeta
}

export type ResolvedFaceData = Omit<FaceData, 'texture'> & {
	texture: { animation: MCMeta | null; asset: HTMLImageElement };
};

export type ResolvedFaces = {
	[key in Facing]?: ResolvedFaceData;
};

export type ResolvedElements = (Omit<NonNullable<BlockModel['elements']>[number], 'faces'> & {
	faces: ResolvedFaces;
})[];

export type ResolvedBlockModel = Omit<Required<BlockModel>, 'elements'> & {
	elements: ResolvedElements;
};

export type BlockData = { model: Model; blockModel: Required<ResolvedBlockModel> };

type PropertyKeys = Record<string, NBTBlockStateProperties[keyof NBTBlockStateProperties]>;

function getRandomArrayItem<T>(arr: T[]) {
	return arr[Math.floor(Math.random() * arr.length)];
}

export class ResolvingError extends Error {
	detail: string;

	constructor(detail: string, message?: string, options?: ErrorOptions) {
		super(message, options);
		this.detail = detail;
	}
}

export class MinecraftBlockResolver {
	properties: NBTBlockStateProperties;
	minecraftAssetsManager: MinecraftAssetsManager;
	blockstateName: BlockNameResolver;
	blockData?: BlockData[];

	constructor(
		properties: NBTBlockStateProperties,
		minecraftAssetsManager: MinecraftAssetsManager,
		blockstateName: BlockNameResolver
	) {
		this.properties = properties;
		this.minecraftAssetsManager = minecraftAssetsManager;
		this.blockstateName = blockstateName;
	}

	async resolve() {
		const blockstate = await this.minecraftAssetsManager.getBlockstate(this.blockstateName);

		let models: Model[];
		if (Object.keys(blockstate)[0] == 'multipart') {
			models = this.fromMultipart(blockstate as Multipart);
		} else {
			models = [this.fromVariants(blockstate as Variants)];
		}

		const blockModels = await Promise.all(
			models.map((model) => this.resolveBlockModelTree(model.model))
		);

		this.blockData = models.map((model, i) => ({
			model: model,
			blockModel: blockModels[i]
		}));
		return this.blockData;
	}

	async resolveBlockModelTree(modelLink: Model['model']) {
		return (await this.recursiveResolveBlockModelTree({
			parent: modelLink
		})) as Required<ResolvedBlockModel>;
	}

	async recursiveResolveBlockModelTree(leaf: BlockModel): Promise<BlockModel | ResolvedBlockModel> {
		if (leaf?.parent == 'block/block' || leaf?.parent == undefined) {
			if (leaf.elements == null) throw new ResolvingError('Elements property is missing');
			if (leaf.textures == null) {
				throw new ResolvingError("Couldn't find any paths to the textures.");
			}
			const elements: ResolvedElements = [];
			for await (const element of leaf.elements) {
				elements.push({
					...element,
					faces: await this.getResolvedFacesTextures(leaf.textures, element.faces)
				});
			}
			(leaf as Required<ResolvedBlockModel>).elements = elements;
			return leaf as Required<ResolvedBlockModel>;
		}
		const resolver = BlockNameResolver.parse(leaf.parent as NamespaceFolderFile);
		const blockModel = await this.minecraftAssetsManager.getBlockModel(resolver);
		const blockModelWithTexturesResolved = {
			...blockModel,
			textures: this.getResolvedTextures(leaf.textures, blockModel.textures)
		};
		return await this.recursiveResolveBlockModelTree(blockModelWithTexturesResolved);
	}

	fromVariants(blockstate: Variants): Model {
		const variantValues = Object.entries(blockstate.variants).filter(([key]) =>
			Object.entries(this.readVariantKey(key)).every(
				([key, value]) => this.properties[key as keyof NBTBlockStateProperties]?.toString() == value
			)
		);
		if (variantValues.length == 0) {
			throw new ResolvingError('No matching model for properties specified in the schematic.');
		}
		const result = variantValues[0][1];
		return Array.isArray(result) ? getRandomArrayItem(result) : result;
	}

	getPropertyKeys() {
		return Object.entries(this.properties).reduce((prev, [key, value]) => {
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

	fromMultipart(blockstate: Multipart) {
		const propertyKeys = this.getPropertyKeys();
		return blockstate.multipart.reduce((prev, { when, apply }) => {
			if (when === undefined) return this._multipartGetModel(prev, apply);
			if ('AND' in when) {
				if (this.doesMatchAND(when['AND'], propertyKeys))
					return this._multipartGetModel(prev, apply);
			} else if ('OR' in when) {
				if (this.doesMatchOR(when['OR'], propertyKeys)) return this._multipartGetModel(prev, apply);
			} else {
				if (this.doesMatch(when, propertyKeys)) return this._multipartGetModel(prev, apply);
			}
			return prev;
		}, [] as Model[]);
	}

	_multipartGetModel(prev: Model[], model: Model | Model[]) {
		return [...prev, Array.isArray(model) ? getRandomArrayItem(model) : model];
	}

	async getResolvedFacesTextures(textures: Required<BlockModel>['textures'], faces: Faces) {
		const result = {} as ResolvedFaces;
		for await (const [key, value] of Object.entries(faces)) {
			const texture = textures[this.linkNameToName(value['texture'])];
			if (texture == null) throw new ResolvingError('Texture link is missing.');
			const resolver = BlockNameResolver.parse(texture as FolderFile);
			const asset = await this.minecraftAssetsManager.getAssets(resolver);
			let animation: MCMeta | null = null;
			if (asset.height > asset.width) {
				animation = await this.minecraftAssetsManager.getMCMeta(resolver);
			}
			result[key as Facing] = { ...value, texture: { asset, animation } };
		}
		return result;
	}

	getResolvedTextures(
		parentTextures: BlockModel['textures'],
		childTextures: BlockModel['textures']
	) {
		if (parentTextures == null && childTextures == null) {
			throw new ResolvingError('No model contains textures.');
		}
		if (childTextures == null) {
			return parentTextures;
		}
		if (parentTextures == null) {
			return childTextures;
		}
		return Object.entries(childTextures).reduce((prev, [key, value]) => {
			let newValue: string | undefined = '';
			if (value.startsWith('#')) {
				newValue = parentTextures[this.linkNameToName(value)];
			} else {
				newValue = value;
			}
			if (value == undefined) {
				throw new ResolvingError(`Couldn't find any texture with key "${value}"`);
			}
			return {
				...prev,
				[key]: newValue
			};
		}, parentTextures);
	}

	linkNameToName = (name: string) => name.substring(1) as ModelTexture;

	readVariantKey(stringKey: string): NBTBlockStateProperties {
		if (stringKey == '') return {} as NBTBlockStateProperties;
		return stringKey.split(',').reduce((prev, curr) => {
			const [key, value] = curr.split('=');
			return { ...prev, [key]: value };
		}, {} as NBTBlockStateProperties);
	}
}
