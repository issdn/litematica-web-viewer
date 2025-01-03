import type { FileService } from './file_service.i';

export class StandardFileService implements FileService {
	files: Map<string, File>;

	constructor(files: Map<string, File>) {
		this.files = files;
	}

	async getFile(path: string) {
		return this.files.get(path) ?? null;
	}
}
