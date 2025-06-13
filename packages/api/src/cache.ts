import type { Context } from "hono";

// Cache configuration for different types of data
export const CACHE_CONFIG = {
	// User tracks change frequently - short cache
	USER_TRACKS: {
		ttl: 10, // 10 seconds
		maxAge: 10,
		staleWhileRevalidate: 60 // 1 minute
	},
	// Track info is relatively static
	TRACK_INFO: {
		ttl: 3600, // 1 hour
		maxAge: 3600,
		staleWhileRevalidate: 86400 // 24 hours
	},
	// MusicBrainz data is very static
	MUSICBRAINZ: {
		ttl: 86400 * 7, // 1 week
		maxAge: 86400 * 7,
		staleWhileRevalidate: 86400 * 30 // 30 days
	},
	// Cover art URLs rarely change
	COVER_ART: {
		ttl: 86400 * 30, // 30 days
		maxAge: 86400 * 30,
		staleWhileRevalidate: 86400 * 90 // 90 days
	}
};

export type CacheType = keyof typeof CACHE_CONFIG;

// Enhanced cache key generation with request fingerprinting
export function generateCacheKey(
	type: CacheType,
	params: Record<string, any>
): string {
	// Sort params for consistent key generation
	const sortedParams = Object.keys(params)
		.sort()
		.map((key) => `${key}=${encodeURIComponent(params[key] || "")}`)
		.join("&");

	const key = `lfmv-cache:${type}:${btoa(sortedParams).replace(/[/+=]/g, "_")}`;
	return key;
}

// Cache response interface
interface CachedResponse {
	data: any;
	timestamp: number;
	ttl: number;
	headers?: Record<string, string>;
}

// Smart caching utility class
export class CacheManager {
	private cache: Cache | undefined;
	private memoryCache = new Map<string, CachedResponse>();
	private readonly MAX_MEMORY_CACHE_SIZE = 1000;
	private readonly isCloudflare: boolean;
	private readonly baseUrl: string;

	constructor(cache?: Cache) {
		this.cache = cache;
		this.isCloudflare =
			typeof caches !== "undefined" && caches.default !== undefined;
		this.baseUrl = "https://lastfm-viewer.cache";
	}

	private getCacheUrl(key: string): string {
		return `${this.baseUrl}/${key}`;
	}

	async get(key: string): Promise<CachedResponse | null> {
		if (this.isCloudflare && this.cache) {
			try {
				const cacheUrl = this.getCacheUrl(key);
				const response = await this.cache.match(cacheUrl);
				if (response) {
					const cachedData =
						(await response.json()) as CachedResponse;
					if (this.isValid(cachedData)) {
						return cachedData;
					}
				}
			} catch (error) {
				// Silent fail - fall back to memory cache
			}
		}

		const memCached = this.memoryCache.get(key);
		if (memCached && this.isValid(memCached)) {
			return memCached;
		}

		return null;
	}

	async set(
		key: string,
		data: any,
		type: CacheType,
		headers?: Record<string, string>
	): Promise<void> {
		const config = CACHE_CONFIG[type];
		const cachedResponse: CachedResponse = {
			data,
			timestamp: Date.now(),
			ttl: config.ttl * 1000,
			headers
		};

		if (this.isCloudflare && this.cache) {
			try {
				const cacheUrl = this.getCacheUrl(key);
				const response = new Response(JSON.stringify(cachedResponse), {
					headers: {
						"Content-Type": "application/json",
						"Cache-Control": `public, max-age=${config.maxAge}, stale-while-revalidate=${config.staleWhileRevalidate}`,
						...headers
					}
				});
				await this.cache.put(cacheUrl, response);
			} catch (error) {
				// Silent fail - continue with memory cache
			}
		}

		if (this.memoryCache.size >= this.MAX_MEMORY_CACHE_SIZE) {
			this.evictOldest();
		}
		this.memoryCache.set(key, cachedResponse);
	}

	private isValid(cached: CachedResponse): boolean {
		if (!cached.timestamp || !cached.ttl) return false;
		const age = Date.now() - cached.timestamp;
		return age < cached.ttl;
	}

	private evictOldest(): void {
		let oldestKey: string | undefined;
		let oldestTime = Infinity;

		for (const [key, value] of this.memoryCache.entries()) {
			if (value.timestamp < oldestTime) {
				oldestTime = value.timestamp;
				oldestKey = key;
			}
		}

		if (oldestKey) {
			this.memoryCache.delete(oldestKey);
		}
	}
}

// Cache middleware factory
export const cacheMiddleware = (type: CacheType) => {
	return async (c: Context, next: () => Promise<void>) => {
		const cacheManager = new CacheManager(caches?.default);
		const params = { ...c.req.query(), path: c.req.path };
		const cacheKey = generateCacheKey(type, params);

		const cached = await cacheManager.get(cacheKey);
		if (cached) {
			const headers = new Headers(cached.headers);
			headers.set("X-Cache", "HIT");
			return new Response(JSON.stringify(cached.data), {
				headers,
				status: 200
			});
		}

		await next();

		if (c.res.status === 200) {
			// Clone the response to avoid consuming the original body
			const resClone = c.res.clone();
			const data = await resClone.json();
			// Convert Headers to Record<string, string>
			const headers: Record<string, string> = {};
			resClone.headers.forEach((value, key) => {
				headers[key] = value;
			});
			await cacheResponse(cacheManager, cacheKey, type, data, headers);
			const newResponse = new Response(JSON.stringify(data), {
				headers: new Headers(resClone.headers),
				status: 200
			});
			newResponse.headers.set("X-Cache", "MISS");
			return newResponse;
		}
	};
};

// Cache response utility
export async function cacheResponse(
	cacheManager: CacheManager | undefined,
	key: string,
	type: CacheType,
	data: any,
	headers?: Record<string, string>
): Promise<void> {
	if (!cacheManager) return;

	try {
		await cacheManager.set(key, data, type, headers);
	} catch (error) {
		// Silent fail - caching is best effort
	}
}

// Rate limiting with cache integration
export class RateLimiter {
	private requests = new Map<string, { count: number; resetTime: number }>();
	private readonly maxRequests: number;
	private readonly windowMs: number;

	constructor(maxRequests = 100, windowMs = 60000) {
		this.maxRequests = maxRequests;
		this.windowMs = windowMs;
	}

	check(identifier: string): {
		allowed: boolean;
		remaining: number;
		resetTime: number;
	} {
		const now = Date.now();
		const key = identifier;
		const record = this.requests.get(key);

		if (!record || now > record.resetTime) {
			// New window or expired
			const resetTime = now + this.windowMs;
			this.requests.set(key, { count: 1, resetTime });
			return {
				allowed: true,
				remaining: this.maxRequests - 1,
				resetTime
			};
		}

		if (record.count >= this.maxRequests) {
			return {
				allowed: false,
				remaining: 0,
				resetTime: record.resetTime
			};
		}

		record.count++;
		return {
			allowed: true,
			remaining: this.maxRequests - record.count,
			resetTime: record.resetTime
		};
	}

	// Clean up expired entries
	cleanup(): void {
		const now = Date.now();
		for (const [key, record] of this.requests.entries()) {
			if (now > record.resetTime) {
				this.requests.delete(key);
			}
		}
	}
}
