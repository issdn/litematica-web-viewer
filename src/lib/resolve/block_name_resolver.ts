type NamespaceFile = `${string}:${string}`;

type NamespaceFolderFile = `${string}:${string}/${string}`;

type FolderFile = `${string}/${string}`;

class BlockNameResolver {
	static regex = /\w+(?=:|\/|$)/g;

	private _namespaceFolderFile?: NamespaceFolderFile;

	private _folderFile?: FolderFile;

	private _namespaceFile?: NamespaceFile;

	file: string;

	folder?: string | null;

	namespace?: string | null;

	private constructor({
		file,
		namespace,
		folder
	}: {
		file: string;
		namespace?: string | null;
		folder?: string | null;
	}) {
		this.file = file;
		this.namespace = namespace;
		this.folder = folder;
	}

	get relativeBlockstatePath() {
		return `assets/minecraft/blockstates/${this.file}.json`;
	}

	get relativeBlockModelPath() {
		return `assets/minecraft/models/block/${this.file}.json`;
	}

	get relativeTexturePath() {
		return `assets/minecraft/textures/block/${this.file}.png`;
	}

	get relativeMCMetaPath() {
		return `assets/minecraft/textures/block/${this.file}.png.mcmeta`;
	}

	// minecraft:block/oak_button
	static parse(name: string) {
		// eslint-disable-next-line prefer-const
		let [namespace, folder, file] =
			(name.match(BlockNameResolver.regex) as (string | null)[]) ?? [];
		if (file == null && folder == null) {
			file = namespace;
			namespace = null;
		} else if (file == null) {
			file = folder;
			folder = null;
		}
		const fileMustBeNotNull = file as string;
		return new BlockNameResolver({ namespace, folder, file: fileMustBeNotNull });
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
