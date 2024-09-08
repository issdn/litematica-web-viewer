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
	import type { Facing } from '../common_types';
	import type { ResolvedFaceData } from '../minecraft_block_resolver';

	export let element: MinecraftElement;
	export let block: MinecraftBlock;
	export let face: ResolvedFaceData & { facing: Facing };
	export let side: Side = FrontSide;
	export let texture: Texture | null = null;

	function setMeshFaceMaterial(mesh: Mesh, material: MeshStandardMaterial, facePos: number) {
		if (Array.isArray(mesh.material)) {
			mesh.material[facePos] = material;
		} else {
			(mesh.material as unknown as (Material | null)[]) = [null, null, null, null, null, null];
			(mesh.material as unknown as (Material | null)[])[facePos] = material;
		}
	}

	texture = texture ?? new Texture(face.texture.asset);
</script>

<T.MeshStandardMaterial
	{side}
	alphaTest={0.5}
	map={texture}
	attach={(parent, self) => {
		if (self.map != null) {
			self.map.minFilter = NearestFilter;
			self.map.magFilter = NearestFilter;
			self.map.wrapS = RepeatWrapping;
			self.map.wrapT = RepeatWrapping;
			self.map.needsUpdate = true;

			if (block.uvlock) {
				self.map = self.map.clone();
				self.map.center = new Vector2(0.5, 0.5);
				block.uvManipulation.rotateMap(face.facing, self.map);
			}
		}

		setMeshFaceMaterial(parent, self, element.getFacePosition(face.facing));
	}}
/>
