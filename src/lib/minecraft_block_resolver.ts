import type {
	BlockModel,
	Blockstate,
	Faces,
	Facing,
	MCMeta,
	Model,
	ModelTexture,
	Multipart,
	NBTBlockStateProperties,
	Variants
} from './common_types';

import {
	BlockNameResolver,
	type FolderFile,
	type NamespaceFolderFile
} from './parse/block_name_resolver';

export enum FileType {
	Blockstate,
	BlockModel,
	Texture,
	MCMeta
}

export type ResolvedFaceData = {
	uv?: [number, number, number, number];
	texture: { animation: MCMeta | null; asset: HTMLImageElement };
	rotation?: number;
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

type PropertyKeys = Record<string, NBTBlockStateProperties[keyof NBTBlockStateProperties]>;

function getRandomArrayItem<T>(arr: T[]) {
	return arr[Math.floor(Math.random() * arr.length)];
}

export interface MinecraftAssetsManager {
	getBlockstate(resolver: BlockNameResolver): Promise<Blockstate>;

	getBlockModel(resolver: BlockNameResolver): Promise<BlockModel>;

	getAssets(resolver: BlockNameResolver): Promise<HTMLImageElement>;

	getMCMeta(resolver: BlockNameResolver): Promise<MCMeta>;
}

export class ServerMinecraftAssetsManager implements MinecraftAssetsManager {
	cache: Map<string, object | string> = new Map();

	async getBlockstate(resolver: BlockNameResolver): Promise<Blockstate> {
		const url = resolver.getRelativeBlockstatePath();
		if (this.cache.has(url)) return this.cache.get(url) as Blockstate;
		const result = await (await fetch(url)).json();
		this.cache.set(url, result);
		return result;
	}

	async getBlockModel(resolver: BlockNameResolver): Promise<BlockModel> {
		const url = resolver.getRelativeBlockModelPath();
		if (this.cache.has(url)) return this.cache.get(url) as BlockModel;
		const result = (await (await fetch(url)).json()) as BlockModel;
		this.cache.set(url, result);
		return result;
	}

	async getAssets(resolver: BlockNameResolver) {
		const url = resolver.getRelativeTexturePath();
		let img: HTMLImageElement;
		if (this.cache.has(url)) {
			img = this.cache.get(url) as HTMLImageElement;
		} else {
			const blob = await (await fetch(url)).blob();
			img = new Image();
			img.src = URL.createObjectURL(blob);
			await img.decode();
			this.cache.set(url, img);
		}
		return img;
	}

	async getMCMeta(resolver: BlockNameResolver) {
		const url = resolver.getRelativeMCMetaPath();
		if (this.cache.has(url)) return this.cache.get(url) as MCMeta;
		const json = await (await fetch(url)).json();
		this.cache.set(url, json);
		return json as MCMeta;
	}
}

class ResolvingError extends Error {
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

	blockData?: { model: Model; blockModel: Required<ResolvedBlockModel> }[];

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
			models = this.fromVariants(blockstate as Variants);
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

	fromVariants(blockstate: Variants): Model[] {
		const variantValues = Object.entries(blockstate.variants).filter(([key]) =>
			Object.entries(this.readVariantKey(key)).every(
				([key, value]) => this.properties[key as keyof NBTBlockStateProperties] == value
			)
		);
		if (variantValues.length == 0) {
			throw new ResolvingError('No matching model for properties specified in the schematic.');
		}
		const result = variantValues[0][1];
		return Array.isArray(result) ? [getRandomArrayItem(result)] : [result];
	}

	getPropertyKeys() {
		return Object.entries(this.properties).reduce((prev, [key, value]) => {
			if (value != 'none') return { ...prev, [key]: value };
			else return prev;
		}, {} as PropertyKeys);
	}

	fromMultipart(blockstate: Multipart) {
		const propertyKeys = this.getPropertyKeys();
		return blockstate.multipart.reduce((prev, { when, apply }) => {
			if (when === undefined) return [...prev, apply];
			if ('AND' in when) {
				const match = when['AND'].every((caseObj) => {
					const [key, value] = Object.entries(caseObj)[0];
					return propertyKeys[key] == value;
				});
				if (match) return [...prev, apply];
				else return prev;
			} else if ('OR' in when) {
				const match =
					when['OR'].findIndex((caseObj) => {
						const [key, value] = Object.entries(caseObj)[0];
						return propertyKeys[key] == value;
					}) != -1;
				if (match) return [...prev, apply];
				else return prev;
			} else {
				Object.entries(propertyKeys).forEach(([key, value]) => {
					if (when[key as keyof typeof when] == value) {
						prev = [...prev, apply];
					}
				});
				return prev;
			}
		}, [] as Model[]);
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
		return Object.entries(childTextures).reduce(
			(prev, [key, value]) => ({
				...prev,
				[key]: parentTextures[this.linkNameToName(value)]
			}),
			parentTextures
		);
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
