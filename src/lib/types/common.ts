import type {
	FolderFile,
	NamespaceFile,
	NamespaceFolderFile
} from '$lib/resolve/block_name_resolver';
import type { Vector3Tuple } from 'three';
import type { ResolvedFaceData } from '../resolve/minecraft_block_resolver';

export type UV = [number, number, number, number];

export type Modification = { dx: number; dy: number; w: number; h: number };

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type FacesDataArray = (Optional<Required<ResolvedFaceData>, 'texture'> & {
	facing: Facing;
	mod: Modification;
	relativeUV: UV;
})[];

type FileLink = `#${string}`;

type BlockRotation = { x?: number; y?: number };

enum BlockType {
	fluid = 'fluid',
	transparent = 'transparent',
	opaque = 'opaque',
	default = 'default',
	air = 'air',
	cross = 'cross'
}

enum Half {
	bottom = 'bottom',
	top = 'top'
}

enum Axis {
	x = 'x',
	y = 'y',
	z = 'z'
}

type StringBool = `${boolean}`;

type NBTBlockStateProperties = {
	facing?: Facing;
	half?: Half;
	axis?: Axis;
	open?: StringBool;
	powered?: StringBool;
	short?: StringBool;
	type?: string;
	waterlogged?: StringBool;
	east?: StringBool | Size | 'side';
	south?: StringBool | Size | 'side';
	north?: StringBool | Size | 'side';
	west?: StringBool | Size | 'side';
	up?: StringBool;
	down?: StringBool;
	power?: `${number}`;
	age?: `${number}`;
	snowy?: StringBool;
};

type NBTBlockState = {
	Name: NamespaceFile;
	Properties: NBTBlockStateProperties;
};

type BlockStatePalette = NBTBlockState[];

type FaceData = {
	uv?: [number, number, number, number] | number[];
	texture: FolderFile;
	rotation?: number;
	tintindex: 0 | 1 | 2;
};

type Faces = {
	[key in Facing]?: FaceData;
};

type Element = {
	from: Vector3Tuple;
	to: Vector3Tuple;
	rotation?: { origin: Vector3Tuple; axis: Axis; angle: number; rescale: boolean };
	faces: Faces;
	shade?: boolean;
};

enum Facing {
	West = 'west',
	East = 'east',
	Up = 'up',
	Down = 'down',
	South = 'south',
	North = 'north'
}

enum Face {
	Celling = 'celling',
	Floor = 'floor',
	Wall = 'wall'
}

enum Size {
	Low = 'low',
	Tall = 'tall',
	None = 'none'
}

enum ModelTexture {
	Top = 'top',
	Bottom = 'bottom',
	Side = 'side',
	All = 'all',
	End = 'end',
	Cross = 'cross',
	Rail = 'rail',
	Particle = 'particle',
	Texture = 'texture'
}

type Model = {
	model: NamespaceFolderFile;
	x?: number;
	y?: number;
	uvlock?: boolean;
};

type MCMeta = {
	animation: {
		frametime?: number;
		height?: number;
		frames?: number[];
	};
};

type Multipart = Record<
	'multipart',
	{
		apply: Model | Model[];
		when:
			| NBTBlockStateProperties
			| { AND: NBTBlockStateProperties[] }
			| { OR: NBTBlockStateProperties[] };
	}[]
>;
type Variants = Record<'variants', { [k: string]: Model | Model[] }>;

type Blockstate = Multipart | Variants;

type Textures = { [key in ModelTexture | Facing]?: FolderFile | FileLink };

type ResolvedTextures = { [key in ModelTexture | Facing]?: NamespaceFolderFile };

type BlockModel = {
	parent: FolderFile | NamespaceFolderFile;
	textures?: Textures;
	elements?: Element[];
	animations?: { [key in NamespaceFolderFile]: MCMeta };
};

export type {
	Model,
	Faces,
	Element,
	NBTBlockState,
	BlockStatePalette,
	Blockstate,
	ModelTexture,
	Multipart,
	Variants,
	Face,
	BlockModel,
	NBTBlockStateProperties,
	FaceData,
	BlockRotation,
	FileLink,
	ResolvedTextures,
	MCMeta
};

export { Facing, Size, BlockType, Axis };
