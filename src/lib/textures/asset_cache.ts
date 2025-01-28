export class AssetCache {
	_cache = new Map<string, Promise<unknown>>();

	async get<T>(url: string, fallback: (url: string) => Promise<T>): Promise<T> {
		if (this._cache.has(url)) return this._cache.get(url)! as T;
		const fallbackPromise = fallback(url).catch(() => {
			this._cache.delete(url);
		});
		this._cache.set(url, fallbackPromise);
		return fallbackPromise as Promise<T>;
	}
}
