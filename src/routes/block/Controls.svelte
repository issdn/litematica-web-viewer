<script lang="ts">
	import type { Multipart, Variants } from '$root/src/lib/types/common';
	import { scene } from '$root/src/lib/compose/scene.svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import Blocks from '$lib/blocks.json';
	import * as Popover from '$root/src/lib/components/ui/popover';
	import { Button } from '$root/src/lib/components/ui/button';
	import { Check, ChevronsUpDown } from 'lucide-svelte';
	import { cn } from '$root/src/lib/utils';
	import { tick } from 'svelte';
	import VirtualList from 'svelte-tiny-virtual-list';
	import { BlockNameResolver } from '$root/src/lib/resolve/block_name_resolver';
	import { BlockstateResolver } from '$root/src/lib/resolve/blockstate_resolver';
	import { ResolvingError } from '$root/src/lib/resolve/minecraft_block_resolver';
	import * as Select from '$lib/components/ui/select';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	const blocks = Object.keys(Blocks);

	let open = $state(false);
	let search = $state('');
	let value = $state(blocks[1]);
	let triggerRef = $state<HTMLButtonElement>(null!);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}

	let filtered = $derived(blocks.filter((value) => value.includes(search)));

	let blockstatePromise = $derived(
		scene.assetsManager.getBlockstate(BlockNameResolver.parse(value))
	);

	const resolver = new BlockstateResolver();

	let propertiesPromise = $derived.by(async () => {
		const blockstate = await blockstatePromise;
		if (blockstate === undefined) throw new ResolvingError("Couldn't resolve block.");
		const isMultipart = resolver.isMultipart(blockstate);
		if (isMultipart) {
			return (blockstate as Multipart).multipart.reduce((map, { when }) => {
				if (when === undefined) return map;
				Object.entries(when).forEach(([key, value]) => {
					if (key.length !== 0) {
						if (map.has(key)) {
							map.set(key, [...map.get(key), value]);
						} else {
							map.set(key, [value]);
						}
					}
				});
				return map;
			}, new Map());
		} else {
			return Object.keys((blockstate as Variants).variants).reduce((map, key) => {
				const obj = resolver.readVariantKey(key);
				Object.entries(obj).forEach(([key, value]) => {
					if (key.length !== 0) {
						if (map.has(key)) {
							map.set(key, [...map.get(key), value]);
						} else {
							map.set(key, [value]);
						}
					}
				});
				return map;
			}, new Map());
		}
	});

	function isCheckbox(values: string[]) {
		return values.includes('true') || values.includes('false');
	}

	$inspect(propertiesPromise);
</script>

<div class="absolute right-8 top-8">
	<div class="flex flex-col">
		{#await propertiesPromise}
			<p>loading</p>
		{:then properties}
			{#each properties as [key, values]}
				{#if isCheckbox(values)}
					<div class="flex items-center space-x-2">
						<Checkbox id={key} aria-labelledby="{key}-label" />
						<Label
							id="{key}-label"
							for={key}
							class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							{key}
						</Label>
					</div>
				{:else}
					{#each values as value}
						<Select.Root type="single">
							<Select.Trigger class="w-[180px]">{key}</Select.Trigger>
							<Select.Content>
								<Select.Item {value}>{value}</Select.Item>
							</Select.Content>
						</Select.Root>
					{/each}
				{/if}
			{/each}
		{/await}
	</div>
</div>

<div class="absolute left-8 top-8">
	<Popover.Root bind:open>
		<Popover.Trigger bind:ref={triggerRef}>
			{#snippet child({ props })}
				<Button
					variant="outline"
					class="w-[200px] justify-between"
					{...props}
					role="combobox"
					aria-expanded={open}
				>
					{value || 'Select a framework...'}
					<ChevronsUpDown class="opacity-50" />
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-[200px] p-0">
			<Command.Root shouldFilter={false}>
				<Command.Input bind:value={search} placeholder="Search blocks..." />
				<Command.List class="h-64 overflow-y-hidden">
					<Command.Empty>No block found.</Command.Empty>
					<Command.Group>
						<VirtualList width="100%" height={256} itemCount={filtered.length} itemSize={32}>
							<div slot="item" let:index let:style {style}>
								<Command.Item
									class="overflow-x-hidden"
									value={filtered[index]}
									onSelect={() => {
										value = filtered[index];
										closeAndFocusTrigger();
									}}
								>
									<Check class={cn(value !== filtered[index] && 'text-transparent')} />
									{filtered[index]}
								</Command.Item>
							</div>
						</VirtualList>
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
</div>
