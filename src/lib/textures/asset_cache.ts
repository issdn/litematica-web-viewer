export class AssetCache {
	_cache = new Map<string, unknown>();

	async get<T>(url: string, fallback: (url: string) => Promise<T>): Promise<T> {
		if (this._cache.has(url)) return this._cache.get(url)! as T;
		const fallbackResult = await fallback(url);
		this._cache.set(url, fallbackResult);
		return fallbackResult;
	}
}
