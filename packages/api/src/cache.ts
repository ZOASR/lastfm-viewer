import type { Context } from "hono";

// Cache configuration for different types of data, using only TTL for max-age
export const CACHE_CONFIG = {
	// User tracks change frequently - short cache
	USER_TRACKS: {
		ttl: 10 // 10 seconds
	},
	// Track info is relatively static
	TRACK_INFO: {
		ttl: 86400 // 1 day
	},
	// MusicBrainz data is very static
	MUSICBRAINZ: {
		ttl: 86400 * 7 // 1 week
	},
	// Cover art URLs rarely change
	COVER_ART: {
		ttl: 86400 * 30 // 30 days
	}
};

export type CacheType = keyof typeof CACHE_CONFIG;

// Generates a Request object to be used as a cache key.
export function generateCacheKey(
	baseUrl: string,
	path: string,
	params: Record<string, string | string[]>
): Request {
	const url = new URL(baseUrl);
	url.pathname = path;
	Object.entries(params).forEach(([key, value]) => {
		url.searchParams.set(
			key,
			Array.isArray(value) ? value.join(",") : value
		);
	});

	return new Request(url.toString(), { method: "GET" });
}

// Simplified CacheManager to work directly with the Cloudflare Cache API
export class CacheManager {
	private cache: Cache;

	constructor(cache?: Cache) {
		// Default to the standard Cloudflare cache
		this.cache = cache || caches.default;
	}

	async get(req: Request): Promise<Response | undefined> {
		return this.cache.match(req);
	}

	async set(req: Request, res: Response, type: CacheType): Promise<void> {
		const config = CACHE_CONFIG[type];
		// Clone the response to modify headers without affecting the original response
		const cacheableResponse = new Response(res.body, res);

		// Set Cache-Control header based on the cache type's TTL
		cacheableResponse.headers.set(
			"Cache-Control",
			`public, max-age=${config.ttl}`
		);

		await this.cache.put(req, cacheableResponse);
	}

	async delete(req: Request): Promise<boolean> {
		return this.cache.delete(req);
	}
}

// Hono middleware for caching responses
export const withCache = (type: CacheType) => {
	return async (c: Context, next: () => Promise<void>) => {
		// The manager is lightweight, so creating it here is acceptable.
		// For larger apps, you might inject it via context.
		const cacheManager = new CacheManager(caches.default);
		const url = new URL(c.req.url);
		const cacheKeyRequest = generateCacheKey(
			url.origin,
			url.pathname,
			c.req.query()
		);

		const cachedResponse = await cacheManager.get(cacheKeyRequest);

		if (cachedResponse) {
			// Cache HIT: Return the cached response directly
			const response = new Response(cachedResponse.body, cachedResponse);
			response.headers.set("X-Cache", "HIT");
			return response;
		}

		// Cache MISS: Proceed with the request
		await next();

		// After the response is generated, cache it if it's a successful one
		if (c.res.ok) {
			// Clone the response to cache it without affecting the final response
			const responseToCache = c.res.clone();
			// Add a header to the response sent to the client
			c.res.headers.set("X-Cache", "MISS");

			// Use waitUntil to perform caching out-of-band
			c.executionCtx.waitUntil(
				cacheManager.set(cacheKeyRequest, responseToCache, type)
			);
		}
	};
};

// Rate limiting with cache integration (unchanged)
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
