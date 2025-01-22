<script lang="ts">
	import { Texture, Vector2 } from 'three';
	import type { ResolvedFaceData } from '$lib/resolve/minecraft_block_resolver';
	import { useTask } from '@threlte/core';
	import type { Snippet } from 'svelte';
	import { scene } from '../../compose/scene.svelte';

	interface Props {
		getFace: Snippet<[transparent: boolean, texture: Texture]>;
		texture: ResolvedFaceData['texture'];
		animation: NonNullable<ResolvedFaceData['animation']>;
	}

	let { getFace, texture: textureName, animation }: Props = $props();

	const texture = scene.atlas.getAnimation(textureName)!;

	const animationData = animation.animation;

	const cols = texture.image.height / texture.image.width;
	const targetInterval = 0.05 * (animationData.frametime ?? 1);

	function getPredefinedFrame(frame: number) {
		return animationData.frames![frame];
	}

	function getNextFrame(frame: number) {
		return frame;
	}

	const frameFunction = animationData.frames != null ? getPredefinedFrame : getNextFrame;

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

{@render getFace(true, texture)}
