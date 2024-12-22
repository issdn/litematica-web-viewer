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
	import type { Facing } from '$lib/types/common';
	import type { ResolvedFaceData } from '../resolve/minecraft_block_resolver';
	import type { MinecraftElement } from '../render/minecraft_element';
	import type { Color } from '../render/color.svelte';

	interface Props {
		element: MinecraftElement;
		face: ResolvedFaceData & { facing: Facing };
		side?: Side;
		texture?: Texture | null;
		materialColor: Color | undefined;
		adjustTexture: (texture: Texture) => void;
	}

	let {
		element,
		face,
		side = FrontSide,
		texture = null,
		materialColor,
		adjustTexture
	}: Props = $props();

	const position = element.getFacePosition(face.facing);

	texture = texture ?? new Texture(face.texture.asset);

	texture.minFilter = NearestFilter;
	texture.magFilter = NearestFilter;
	texture.wrapS = RepeatWrapping;
	texture.wrapT = RepeatWrapping;
	texture.needsUpdate = true;

	adjustTexture(texture);
</script>

<T.MeshStandardMaterial
	{side}
	color={materialColor}
	map={texture}
	alphaTest={0.5}
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
