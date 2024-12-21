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
	import { MinecraftBlock, MinecraftElement } from '$lib/render/block_renderer';
	import type { Facing, NBTBlockStateProperties } from '../common_types';
	import type { ResolvedFaceData } from '../minecraft_block_resolver';
	import { getColor } from '../render/color.svelte';

	interface Props {
		element: MinecraftElement;
		block: MinecraftBlock;
		face: ResolvedFaceData & { facing: Facing };
		side?: Side;
		texture?: Texture | null;
		tintindex: 0 | 1 | 2;
	}

	let { element, block, face, side = FrontSide, texture = null, tintindex }: Props = $props();

	function setMeshFaceMaterial(mesh: Mesh, material: MeshStandardMaterial, facePos: number) {
		if (Array.isArray(mesh.material)) {
			mesh.material[facePos] = material;
		} else {
			(mesh.material as unknown as (Material | null)[]) = [null, null, null, null, null, null];
			(mesh.material as unknown as (Material | null)[])[facePos] = material;
		}
	}

	texture = texture ?? new Texture(face.texture.asset);

	function _getColor() {
		if (tintindex < 0) return undefined;
		const filename = block.nameResolver.file;
		if (filename == null) return undefined;
		return getColor(filename)?.(block.properties);
	}
</script>

<T.MeshStandardMaterial
	{side}
	color={_getColor()}
	map={texture}
	alphaTest={0.5}
	attach={({ parent, ref }) => {
		const map = (ref as unknown as MeshStandardMaterial).map;
		if (map != null) {
			map.minFilter = NearestFilter;
			map.magFilter = NearestFilter;
			map.wrapS = RepeatWrapping;
			map.wrapT = RepeatWrapping;
			map.needsUpdate = true;

			if (block.uvlock) {
				map.center = new Vector2(0.5, 0.5);
				block.uvManipulation.rotateMap(face.facing, map);
			}
		}

		setMeshFaceMaterial(
			parent as Mesh,
			ref as unknown as MeshStandardMaterial,
			element.getFacePosition(face.facing)
		);
	}}
/>
