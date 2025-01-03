import type { FileService } from './file_service.i';
import * as jszip from 'jszip';

export class ZipFileService implements FileService {
	files: Awaited<ReturnType<typeof jszip.loadAsync>>;

	constructor(files: Awaited<ReturnType<typeof jszip.loadAsync>>) {
		this.files = files;
	}

	async getFile(path: string) {
		const file = this.files.file(path);
		return file?.async('blob') ?? null;
	}
}
