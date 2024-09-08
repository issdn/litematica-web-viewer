<script lang="ts">
	import { type Side, FrontSide, Texture, Vector2 } from 'three';
	import { MinecraftBlock, MinecraftElement } from '$lib/render/block_renderer';
	import { type Facing } from '../common_types';
	import Face from './Face.svelte';
	import type { ResolvedFaceData } from '../minecraft_block_resolver';
	import { onMount } from 'svelte';
	import { useTask } from '@threlte/core';
	import { assets } from '$app/paths';

	export let element: MinecraftElement;
	export let block: MinecraftBlock;
	export let face: Omit<ResolvedFaceData, 'texture'> & { facing: Facing } & {
		texture: {
			asset: ResolvedFaceData['texture']['asset'];
			animation: NonNullable<ResolvedFaceData['texture']['animation']>;
		};
	};
	export let side: Side = FrontSide;

	let texture: Texture;

	texture = new Texture(face.texture.asset);

	const cols = face.texture.asset.height / 16;
	const targetInterval = 0.05 * (face.texture.animation.animation.frametime ?? 1);
	let frame = 0;
	let accumulatedTime = 0;
	useTask((delta) => {
		accumulatedTime += delta;

		if (accumulatedTime >= targetInterval) {
			accumulatedTime = 0;
			frame++;
			texture.offset = new Vector2(0, -frame / cols);
			console.log(texture.offset);
		}
	});
</script>

<Face {side} {block} {element} {face} {texture} />
