<script lang="ts">
	import type { ResolvedBlockModel } from '$lib/resolve/minecraft_block_resolver';
	import Element from './Element.svelte';
	import type { Model } from '$lib/types/common';
	import { degToRad } from 'three/src/math/MathUtils.js';
	import { rotateTheFacesToInitialPositions } from '../../render/uv';

	type Props = Required<ResolvedBlockModel> & Model;

	let { elements, uvlock, x, y }: Props = $props();

	uvlock = uvlock ?? false;
	const rotation = { x: x ?? 0, y: y ?? 0 };
	const radiansRotation = { x: degToRad(x ?? 0), y: degToRad(y ?? 0) };

	if (uvlock) {
		rotateTheFacesToInitialPositions(rotation);
	}
</script>

{#each elements as element}
	<Element {radiansRotation} {...element} />
{/each}
