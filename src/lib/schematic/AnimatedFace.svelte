<script lang="ts">
	import { type Side, FrontSide, Texture, Vector2 } from 'three';
	import { MinecraftBlock, MinecraftElement } from '$lib/render/block_renderer';
	import { type Facing } from '../common_types';
	import Face from './Face.svelte';
	import type { ResolvedFaceData } from '../minecraft_block_resolver';
	import { useTask } from '@threlte/core';

	interface Props {
		element: MinecraftElement;
		block: MinecraftBlock;
		face: Omit<ResolvedFaceData, 'texture'> & { facing: Facing } & {
			texture: {
				asset: ResolvedFaceData['texture']['asset'];
				animation: NonNullable<ResolvedFaceData['texture']['animation']>;
			};
		};
		side?: Side;
	}

	let { element, block, face, side = FrontSide }: Props = $props();

	const texture: Texture = new Texture(face.texture.asset);

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
		}
	});
</script>

<Face {side} {block} {element} {face} {texture} />
