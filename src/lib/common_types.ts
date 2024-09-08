import type { FolderFile, NamespaceFile, NamespaceFolderFile } from './parse/block_name_resolver';

type FileLink = `#${string}`;

type SimpleVector3D = [number, number, number];

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
	bottom,
	top
}

enum Axis {
	x = 'x',
	y = 'y',
	z = 'z'
}

type StringBool = 'false' | 'true';

type NBTBlockStateProperties = {
	facing?: Facing;
	half?: Half;
	axis?: Axis;
	open?: boolean;
	powered?: boolean;
	short?: StringBool;
	type?: string;
	waterlogged?: StringBool;
	east?: StringBool | Size;
	south?: StringBool | Size;
	north?: StringBool | Size;
	west?: StringBool | Size;
	up?: StringBool;
	down?: StringBool;
};

type NBTBlockState = {
	Name: NamespaceFile;
	Properties: NBTBlockStateProperties;
};

type BlockStatePalette = NBTBlockState[];

type FaceData = {
	uv?: [number, number, number, number];
	texture: FolderFile;
	rotation?: number;
};

type Faces = {
	[key in Facing]?: FaceData;
};

type Element = {
	from: SimpleVector3D;
	to: SimpleVector3D;
	rotation?: { origin: SimpleVector3D; axis: Axis; angle: number; rescale: boolean };
	faces: Faces;
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
		apply: Model;
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
	SimpleVector3D,
	FileLink,
	ResolvedTextures,
	MCMeta
};

export { Facing, Size, BlockType, Axis };
