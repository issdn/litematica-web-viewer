type NamespaceFile = `${string}:${string}`;

type NamespaceFolderFile = `${string}:${string}/${string}`;

type FolderFile = `${string}/${string}`;

class BlockNameResolver {
	static regex = /\w+(?=:|\/|$)/g;

	private _namespaceFolderFile?: NamespaceFolderFile;

	private _folderFile?: FolderFile;

	private _namespaceFile?: NamespaceFile;

	file?: string | null;

	folder?: string | null;

	namespace?: string | null;

	private constructor({
		file,
		namespace,
		folder
	}: {
		file?: string | null;
		namespace?: string | null;
		folder?: string | null;
	}) {
		this.file = file;
		this.namespace = namespace;
		this.folder = folder;
	}

	getRelativeBlockstatePath() {
		return `/default/assets/minecraft/blockstates/${this.file}.json`;
	}

	getRelativeBlockModelPath() {
		return `/default/assets/minecraft/models/block/${this.file}.json`;
	}

	getRelativeTexturePath() {
		return `/default/assets/minecraft/textures/block/${this.file}.png`;
	}

	getRelativeMCMetaPath() {
		return `/default/assets/minecraft/textures/block/${this.file}.png.mcmeta`;
	}

	// minecraft:block/oak_button
	static parse(name: string) {
		// eslint-disable-next-line prefer-const
		let [namespace, folder, file] =
			(name.match(BlockNameResolver.regex) as (string | null)[]) ?? [];
		if (file == null) {
			file = folder;
			folder = null;
		}
		return new BlockNameResolver({ namespace, folder, file });
	}

	static splitBySlash = (namespaceFolderFile: string) => namespaceFolderFile.split('/');

	static splitByColon = (namespaceFolderFile: string) => namespaceFolderFile.split(':');

	get folderFile() {
		if (this._folderFile != null) return this._folderFile;
		this._folderFile = `${this.folder}/${this.file}`;
		return this._folderFile;
	}

	get namespaceFolderFile() {
		if (this._namespaceFolderFile != null) return this._namespaceFolderFile;
		this._namespaceFolderFile = `${this.namespace}:${this.folder}/${this.file}`;
		return this._namespaceFolderFile;
	}

	get namespaceFile() {
		if (this._namespaceFile != null) return this._namespaceFile;
		this._namespaceFile = `${this.namespace}:${this.file}`;
		return this._namespaceFile;
	}
}

export { BlockNameResolver };
export type { NamespaceFile, NamespaceFolderFile, FolderFile };
