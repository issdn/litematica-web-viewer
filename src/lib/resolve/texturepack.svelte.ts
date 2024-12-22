import { ServerMinecraftAssetsManager } from '$root/src/lib/textures/assets_manager';
import { ClientMinecraftAssetsManager } from '$root/src/lib/textures/client_assets_manager';

let _files: FileList | null | undefined = $state();

const serverAssetsManager = new ServerMinecraftAssetsManager('default');

const _assetsManager = $derived(
	_files == null
		? serverAssetsManager
		: new ClientMinecraftAssetsManager(_files, serverAssetsManager)
);

export function useTexturepack() {
	function setFiles(files: FileList | null | undefined) {
		_files = files;
	}

	return {
		setFiles,
		files: _files,
		assetsManager: _assetsManager
	};
}
