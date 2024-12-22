<script lang="ts">
	import { type Side, FrontSide, Texture, Vector2 } from 'three';
	import { type Facing } from '$lib/types/common';
	import Face from './Face.svelte';
	import type { ResolvedFaceData } from '../resolve/minecraft_block_resolver';
	import { useTask } from '@threlte/core';
	import type { MinecraftElement } from '../render/minecraft_element';
	import type { MinecraftBlock } from '../render/minecraft_block';

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
		tintindex: 0 | 1 | 2;
	}

	let { element, block, face, side = FrontSide, tintindex }: Props = $props();

	const texture: Texture = new Texture(face.texture.asset);

	const animation = face.texture.animation.animation;

	const cols = face.texture.asset.height / face.texture.asset.width;
	const targetInterval = 0.05 * (animation.frametime ?? 1);

	function getPredefinedFrame(frame: number) {
		return animation.frames![frame];
	}

	function getNextFrame(frame: number) {
		return frame;
	}

	const frameFunction = animation.frames != null ? getPredefinedFrame : getNextFrame;

	let frame = 0;
	let accumulatedTime = 0;
	useTask((delta) => {
		accumulatedTime += delta;

		if (accumulatedTime >= targetInterval) {
			accumulatedTime = 0;
			frame++;
			texture.offset = new Vector2(0, -frameFunction(frame % cols) / cols);
		}
	});
</script>

<Face {tintindex} {side} {block} {element} {face} {texture} />
