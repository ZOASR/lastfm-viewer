import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { Context, Next } from "hono";
import { withCache } from "../src/cache";

type HonoContext = Context & {
  executionCtx: {
    waitUntil: (promise: Promise<unknown>) => void;
  };
};

describe("withCache middleware", () => {
	let app: Hono;
	let mockNext: ReturnType<typeof vi.fn>;
	let mockResponse: Response;
	let mockCache: {
		match: ReturnType<typeof vi.fn>;
		put: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		// Reset mocks before each test
		mockCache = {
			match: vi.fn(),
			put: vi.fn()
		};

		mockResponse = new Response(JSON.stringify({ data: "test" }), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});

		mockNext = vi.fn().mockResolvedValue(mockResponse);

		// Mock the caches.default
		global.caches = {
			default: mockCache as unknown as Cache,
			delete: vi.fn(),
			has: vi.fn(),
			keys: vi.fn(),
			match: vi.fn(),
			open: vi.fn()
		} as unknown as CacheStorage;

		// Create a fresh Hono app for each test
		app = new Hono();
		
		// Mock the execution context
		app.use('*', async (c: HonoContext, next: Next) => {
			Object.defineProperty(c, 'executionCtx', {
				value: {
					waitUntil: vi.fn().mockResolvedValue(undefined)
				},
				configurable: true
			});
			await next();
		});
	});

	it("should return cached response when available", async () => {
		// Mock cache hit
		const cachedResponse = new Response(
			JSON.stringify({ data: "cached" }),
			{
				headers: { "Cache-Control": "public, max-age=60" }
			}
		);
		mockCache.match.mockResolvedValueOnce(cachedResponse);

		// Setup test route with cache middleware
		app.get("/test", withCache("USER_TRACKS"), (c) =>
			c.json({ data: "fresh" })
		);

		// Make request
		const req = new Request("http://localhost/test");
		const res = await app.request(req);
		const body = await res.json();

		// Should return cached response, not call next()
		expect(body).toEqual({ data: "cached" });
		expect(res.headers.get("X-Cache")).toBe("HIT");
		expect(mockNext).not.toHaveBeenCalled();
	});

	it("should call next and cache the response when no cache is found", async () => {
		// Mock cache miss
		mockCache.match.mockResolvedValueOnce(undefined);

		// Setup test route with cache middleware
		app.get("/test", withCache("USER_TRACKS"), async (c) => {
			await mockNext();
			return c.json({ data: "test" });
		});

		// Make request
		const req = new Request("http://localhost/test");
		const res = await app.request(req);
		const body = await res.json();

		// Should call next() and cache the response
		expect(body).toEqual({ data: "test" });
		expect(mockNext).toHaveBeenCalled();
		expect(mockCache.put).toHaveBeenCalled();
		expect(res.headers.get("X-Cache")).toBe("MISS");
	});

	it("should not cache non-200 responses", async () => {
		// Mock error response
		const errorResponse = new Response(
			JSON.stringify({ error: "Not found" }),
			{
				status: 404
			}
		);
		mockNext.mockResolvedValueOnce(errorResponse);

		// Setup test route with cache middleware
		app.get("/error", withCache("USER_TRACKS"), async (c) => {
			await mockNext();
			return c.json({ error: "Not found" }, 404);
		});

		// Make request
		const req = new Request("http://localhost/error");
		const res = await app.request(req);

		// Should not cache error responses
		expect(res.status).toBe(404);
		expect(mockCache.put).not.toHaveBeenCalled();
	});
});
