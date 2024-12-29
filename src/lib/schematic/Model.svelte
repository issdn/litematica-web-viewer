<script lang="ts">
	import type { ResolvedBlockModel } from '$lib/resolve/minecraft_block_resolver';
	import { uvManipulation } from '../render/uv';
	import Element from './Element.svelte';
	import { getContext, setContext } from 'svelte';
	import { type ModelContext, type BlockContext } from '../types/context';
	import ElementInstance from './ElementInstance.svelte';
	import type { Model } from '../types/common';
	import { degToRad } from 'three/src/math/MathUtils.js';

	type Props = Required<ResolvedBlockModel> & Model;

	let { elements, uvlock, x, y }: Props = $props();

	const { instances } = getContext<BlockContext>('block');

	const { rotateTheFacesToInitialPositions } = uvManipulation();

	uvlock = uvlock ?? false;
	const rotation = { x: x ?? 0, y: y ?? 0 };
	const radiansRotation = { x: degToRad(x ?? 0), y: degToRad(y ?? 0) };

	if (uvlock) {
		rotateTheFacesToInitialPositions(rotation);
	}
</script>

{#each elements as element}
	<Element {radiansRotation} {uvlock} {...element}>
		{#each instances as position}
			<ElementInstance
				{radiansRotation}
				from={element.from}
				{position}
				rotation={element.rotation}
			/>
		{/each}
	</Element>
{/each}
