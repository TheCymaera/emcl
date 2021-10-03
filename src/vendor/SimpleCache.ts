///<reference lib="ESNext"/>
///<reference lib="WebWorker"/>

export class SimpleCache {
	static global = self as any as ServiceWorkerGlobalScope;

	cacheName: string;

	responders: Map<string, SimpleCache.Responder> = new Map;

	querySettings = {
		ignoreMethod: false,
		ignoreSearch: true,
		ignoreVary: true,
	}

	addResponder(url: string, responder: SimpleCache.Responder) {
		const absoluteURL = (new URL(url, SimpleCache.global.registration.scope)).href;
		this.responders.set(absoluteURL, responder);
		return this;
	}

	constructor(cacheName = SimpleCache.global.registration.scope + ".static") {
		this.cacheName = cacheName;
	}

	async cache() {
		return caches.open(this.cacheName);
	}

	async recreateCache(addAll?: Iterable<string>): Promise<void> {
		// clear old cache
		await caches.delete(this.cacheName);

		// create new cache
		const cache = await this.cache();
		if (addAll) await cache.addAll([...addAll]);
	}

	async getResponseFromCache(request: Request) {
		return await (await this.cache()).match(request, this.querySettings);
	}

	async getResponse(request: Request, wait: Promise<any>[]): Promise<Response> {
		// get response from responder
		const responder = this.responders.get(request.url);
		if (responder) return responder.call(this, request, wait);
		
		// get response from cache
		const response = await this.getResponseFromCache(request);
		if (response) return response;

		// network fallback
		return await fetch(request);
	}

	static readonly CACHE_MOST_RECENT_RESPONDER: SimpleCache.Responder = async function (request, wait) {
		const cache = await this.cache();

		try {
			// get response from network and cache (in background)
			const response = await fetch(request);
			wait.push(cache.put(request, response.clone()));
			return response;
		} catch(e) {
			// if server cannot be reached, use the cache as fallback.
			const response = await cache.match(request, this.querySettings);
			if (response) return response;
			throw e;
		}
	}
}

namespace SimpleCache {
	export type Responder = (this: SimpleCache, request: Request, wait: Promise<any>[]) => Promise<Response>;
}