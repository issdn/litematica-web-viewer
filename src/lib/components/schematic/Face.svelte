<script lang="ts">
	import { T } from '@threlte/core';
	import {
		Material,
		MeshStandardMaterial,
		Vector2,
		Texture,
		Mesh,
		type Side,
		FrontSide,
		NearestFilter,
		RepeatWrapping
	} from 'three';
	import { Facing, type FaceData } from '$lib/types/common';
	import type { ResolvedFaceData } from '$lib/resolve/minecraft_block_resolver';
	import { getColor } from '$lib/render/color.svelte';
	import { getContext } from 'svelte';
	import type { BlockContext } from '$lib/types/context';

	interface Props {
		face: ResolvedFaceData & { facing: Facing };
		side?: Side;
		texture?: Texture | null;
		adjustTexture: (texture: Texture) => void;
		transparent: boolean;
	}

	let { face, side = FrontSide, texture = null, transparent, adjustTexture }: Props = $props();

	const { name, properties } = getContext<BlockContext>('block');

	function getElementColor(tintindex: FaceData['tintindex']) {
		if (tintindex < 0) return undefined;
		return getColor(name)?.(properties);
	}

	function getFacePosition(facing: Facing) {
		switch (facing) {
			case Facing.East:
				return 0;
			case Facing.West:
				return 1;
			case Facing.Up:
				return 2;
			case Facing.Down:
				return 3;
			case Facing.South:
				return 4;
			case Facing.North:
				return 5;
		}
	}

	texture = texture ?? new Texture(face.texture.asset);

	texture.minFilter = NearestFilter;
	texture.magFilter = NearestFilter;
	texture.wrapS = RepeatWrapping;
	texture.wrapT = RepeatWrapping;
	texture.needsUpdate = true;

	adjustTexture(texture);

	const position = getFacePosition(face.facing);
</script>

<T.MeshStandardMaterial
	{side}
	color={getElementColor(face.tintindex)}
	map={texture}
	alphaTest={face.tintindex >= 0 || transparent ? 0.5 : 0}
	attach={({ parent, ref }) => {
		let material = (parent as Mesh).material as unknown as (Material | null)[];
		if (Array.isArray(material)) {
			((parent as Mesh).material as unknown as (Material | null)[])[position] =
				ref as unknown as MeshStandardMaterial;
		} else {
			((parent as Mesh).material as unknown as (Material | null)[]) = [
				null,
				null,
				null,
				null,
				null,
				null
			];
			((parent as Mesh).material as unknown as (Material | null)[])[position] =
				ref as unknown as MeshStandardMaterial;
		}
	}}
/>
