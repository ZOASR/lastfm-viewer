import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	CacheManager,
	CACHE_CONFIG,
	type CacheType,
	generateCacheKey
} from "../src/cache";

describe("CacheManager", () => {
	let cacheManager: CacheManager;
	let mockCache: {
		match: ReturnType<typeof vi.fn>;
		put: ReturnType<typeof vi.fn>;
		delete: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		mockCache = {
			match: vi.fn(),
			put: vi.fn(),
			delete: vi.fn()
		};
		cacheManager = new CacheManager(mockCache as unknown as Cache);
	});

	describe("get", () => {
		it("should return cached response if found", async () => {
			const mockRequest = new Request("https://example.com/api");
			const mockResponse = new Response(JSON.stringify({ data: "test" }));
			mockCache.match.mockResolvedValueOnce(mockResponse);

			const result = await cacheManager.get(mockRequest);

			expect(result).toBeInstanceOf(Response);
			expect(await result?.json()).toEqual({ data: "test" });
			expect(mockCache.match).toHaveBeenCalledWith(mockRequest);
		});

		it("should return undefined if no cache entry exists", async () => {
			const mockRequest = new Request("https://example.com/api");
			mockCache.match.mockResolvedValueOnce(undefined);

			const result = await cacheManager.get(mockRequest);

			expect(result).toBeUndefined();
		});
	});

	describe("set", () => {
		it("should set cache with correct TTL based on cache type", async () => {
			const mockRequest = new Request("https://example.com/api");
			const mockResponse = new Response(JSON.stringify({ data: "test" }));
			const cacheType: CacheType = "USER_TRACKS";
			const expectedTtl = CACHE_CONFIG.USER_TRACKS.ttl;

			await cacheManager.set(mockRequest, mockResponse, cacheType);

			expect(mockCache.put).toHaveBeenCalledTimes(1);
			const [request, response] = mockCache.put.mock.calls[0];
			expect(request).toBe(mockRequest);
			expect(response.headers.get("Cache-Control")).toBe(
				`public, max-age=${expectedTtl}`
			);
		});
	});

	describe("delete", () => {
		it("should delete cache entry", async () => {
			const mockRequest = new Request("https://example.com/api");
			mockCache.delete.mockResolvedValueOnce(true);

			const result = await cacheManager.delete(mockRequest);

			expect(result).toBe(true);
			expect(mockCache.delete).toHaveBeenCalledWith(mockRequest);
		});
	});
});

describe("generateCacheKey", () => {
	it("should generate a cache key with URL and params", () => {
		const baseUrl = "https://api.example.com";
		const path = "/test";
		const params = { foo: "bar", baz: ["qux", "quux"] };

		const request = generateCacheKey(baseUrl, path, params);
		const url = new URL(request.url);

		expect(url.origin + url.pathname).toBe("https://api.example.com/test");
		expect(url.searchParams.get("foo")).toBe("bar");
		expect(url.searchParams.get("baz")).toBe("qux,quux");
	});
});
