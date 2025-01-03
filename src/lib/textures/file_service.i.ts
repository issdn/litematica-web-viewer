export interface FileService {
	getFile(path: string): Promise<Blob | null>;
}
