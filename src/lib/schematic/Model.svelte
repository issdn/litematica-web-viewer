<script lang="ts">
	import type { ResolvedBlockModel } from '$lib/resolve/minecraft_block_resolver';
	import { uvManipulation } from '../render/uv';
	import Element from './Element.svelte';
	import { getContext } from 'svelte';
	import type { BlockContext } from '../types/context';
	import type { SimpleVector3D } from '../types/common';
	import ElementInstance from './ElementInstance.svelte';

	interface Props {
		blockModel: Required<ResolvedBlockModel>;
	}

	let { blockModel }: Props = $props();

	const { rotateTheFacesToInitialPositions } = uvManipulation();

	const { rotation, uvlock, instances } = getContext<BlockContext>('block');

	if (uvlock) {
		rotateTheFacesToInitialPositions(rotation);
	}
</script>

{#each blockModel.elements as element}
	<Element {...element}>
		{#each instances as position}
			<ElementInstance from={element.from} {position} rotation={element.rotation} />
		{/each}
	</Element>
{/each}
