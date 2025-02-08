<script lang="ts">
	import type { Multipart, NBTBlockStateProperties, Variants } from '$root/src/lib/types/common';
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
	import { Vector3 } from 'three';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import Spinner from '$root/src/lib/components/ui/Spinner.svelte';

	let {
		properties,
		blockName,
		additionalUrlParams = $bindable()
	}: {
		properties: NBTBlockStateProperties;
		blockName: string;
		additionalUrlParams: Record<string, string>;
	} = $props();

	type PropertyMap = Map<
		keyof NBTBlockStateProperties,
		Set<NonNullable<NBTBlockStateProperties[keyof NBTBlockStateProperties]>>
	>;

	function setSchematic(properties: NBTBlockStateProperties, blockName: string) {
		scene.schematic = Promise.resolve([
			{
				Properties: properties,
				Name: BlockNameResolver.parse(blockName).namespaceFile,
				instances: [new Vector3(0, 0, 0)]
			}
		]);
	}

	async function getPropertiesMap(blockName: string) {
		const blockstate = await scene.assetsManager.getBlockstate(BlockNameResolver.parse(blockName));
		if (blockstate === undefined) throw new ResolvingError("Couldn't resolve block.");
		const isMultipart = resolver.isMultipart(blockstate);
		const map: PropertyMap = new Map();
		if (isMultipart) {
			(blockstate as Multipart).multipart.forEach(({ when }) => {
				if (when !== undefined) {
					if ('AND' in when) {
						when.AND.forEach((obj) => setPropertiesValues(map, obj));
					} else if ('OR' in when) {
						when.OR.forEach((obj) => setPropertiesValues(map, obj));
					} else {
						setPropertiesValues(map, when);
					}
				}
			});
		} else {
			Object.keys((blockstate as Variants).variants).forEach((key) =>
				setPropertiesValues(map, resolver.readVariantKey(key))
			);
		}
		return map;
	}

	function getDefaultProperties(map: PropertyMap) {
		return [...map.entries()].reduce(
			(prev, [key, values]) => ({
				...prev,
				[key]: values.values().next().value
			}),
			{} as NBTBlockStateProperties
		);
	}

	const blocks = Object.keys(Blocks);

	const resolver = new BlockstateResolver();

	let open = $state(false);
	let search = $state('');
	let name = $state(blockName);
	let triggerRef = $state<HTMLButtonElement>(null!);
	let filtered = $derived(blocks.filter((value) => value.includes(search)));
	let userProperties = $state(properties);
	let propertiesMapPromise: Promise<PropertyMap> = $state(getPropertiesMap(blockName));

	$effect(() => {
		additionalUrlParams = {
			...userProperties,
			name
		};
	});

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}

	function setValue(map: PropertyMap, key: keyof NBTBlockStateProperties, value: string) {
		if (map.has(key)) {
			map.get(key)!.add(value);
		} else {
			map.set(key, new Set([value]));
		}
	}

	function setPropertiesValues(map: PropertyMap, properties: NBTBlockStateProperties) {
		Object.entries(properties).forEach(([key, value]) => {
			const propertyKey = key as keyof NBTBlockStateProperties;
			if (propertyKey.length !== 0) {
				if (value.includes('|')) {
					value.split('|').forEach((v) => {
						setValue(map, propertyKey, v);
					});
				} else {
					setValue(map, propertyKey, value);
				}
			}
		});
	}

	function isCheckbox(values: Set<string>) {
		return values.has('true') || values.has('false');
	}
</script>

<Sidebar.Root>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel>Select a block</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				{@render blockChange()}
			</Sidebar.GroupContent>
		</Sidebar.Group>
		<Sidebar.Separator />
		<Sidebar.Group>
			<Sidebar.GroupLabel>Configure it</Sidebar.GroupLabel>
			<Sidebar.GroupContent class="flex flex-col items-center gap-y-1">
				{@render config()}
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
</Sidebar.Root>

{#snippet config()}
	{#await propertiesMapPromise}
		<Spinner />
	{:then propertiesMap}
		{#each propertiesMap as [key, values]}
			{#if isCheckbox(values)}
				<div class="flex w-[15rem] items-center gap-x-4 px-2 py-1">
					<Checkbox
						checked={userProperties[key] === 'true'}
						onCheckedChange={(value) => {
							userProperties = { ...userProperties, [key]: value.toString() };
							setSchematic(userProperties, name);
						}}
						id={key}
						aria-labelledby="{key}-label"
					/>
					<Label
						id="{key}-label"
						for={key}
						class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						{key}
					</Label>
				</div>
			{:else}
				<Select.Root
					value={userProperties[key]}
					onValueChange={(value) => {
						userProperties = { ...userProperties, [key]: value };
						setSchematic(userProperties, name);
					}}
					type="single"
				>
					<Select.Trigger class="w-[15rem] bg-background">{key}</Select.Trigger>
					<Select.Content>
						{#each values as value}
							<Select.Item {value}>{value}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			{/if}
		{/each}
	{/await}
{/snippet}

{#snippet blockChange()}
	<Popover.Root bind:open>
		<Popover.Trigger bind:ref={triggerRef}>
			{#snippet child({ props })}
				<Button
					variant="outline"
					class="w-[15rem] justify-between"
					{...props}
					role="combobox"
					aria-expanded={open}
				>
					{name || 'Select a block...'}
					<ChevronsUpDown class="opacity-50" />
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-[15rem] p-0">
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
										name = filtered[index];
										propertiesMapPromise = (async () => {
											const map = await getPropertiesMap(filtered[index]);
											userProperties = getDefaultProperties(map);
											setSchematic(userProperties, filtered[index]);
											return map;
										})();
										closeAndFocusTrigger();
									}}
								>
									<Check class={cn(name !== filtered[index] && 'text-transparent')} />
									{filtered[index]}
								</Command.Item>
							</div>
						</VirtualList>
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
{/snippet}
