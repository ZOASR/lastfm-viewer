import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cacheMiddleware, RateLimiter } from "./cache";
import {
	GetUserTracks,
	GetTrackInfo,
	GetMBReleases,
	GetMBReleaseInfo,
	GetCoverArt
} from "./endpoints/lastfm";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Apply CORS middleware with intelligent origin validation
app.use("*", async (c, next) => {
	const origin = c.req.header("origin");
	const referer = c.req.header("referer");

	// Allow requests from development environments
	const devOrigins = [
		"http://localhost",
		"http://127.0.0.1",
		"https://localhost"
	];
	const isDevRequest =
		origin && devOrigins.some((dev) => origin.startsWith(dev));

	// Validate legitimate usage patterns
	const isValidRequest = validateOrigin(origin, referer);

	if (isDevRequest || isValidRequest) {
		// Set CORS headers for valid requests
		c.header("Access-Control-Allow-Origin", origin || "*");
		c.header("Access-Control-Allow-Methods", "GET, OPTIONS");
		c.header(
			"Access-Control-Allow-Headers",
			"Content-Type, X-Requested-With"
		);
		c.header("Access-Control-Max-Age", "86400");
		c.header("Access-Control-Allow-Credentials", "false");

		// Handle preflight requests
		if (c.req.method === "OPTIONS") {
			return c.text("");
		}
	} else {
		// Log suspicious requests for monitoring
		console.warn("Blocked request:", {
			origin,
			referer,
			userAgent: c.req.header("user-agent")
		});
		return c.json({ error: "Access denied" }, 403);
	}

	await next();
});

// Helper function to validate origins
function validateOrigin(
	origin: string | undefined,
	referer: string | undefined
): boolean {
	// If no origin/referer, it might be a server-side request - allow with caution
	if (!origin && !referer) {
		return true; // Could be a legitimate server-side request
	}

	// Extract domain from origin or referer
	const requestDomain = extractDomain(origin || referer);
	if (!requestDomain) return false;

	// Block known problematic domains
	const blockedDomains = [
		"malicious-site.com",
		"phishing-domain.net"
		// Add known bad actors
	];

	if (blockedDomains.includes(requestDomain)) {
		return false;
	}

	// Additional validation rules
	return (
		// Allow requests from legitimate websites (not just raw IPs)
		/^([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/.test(
			requestDomain
		) ||
		// Allow localhost/dev environments
		requestDomain.includes("localhost") ||
		requestDomain.includes("127.0.0.1")
	);
}

function extractDomain(url: string | undefined): string | null {
	if (!url) return null;
	try {
		const urlObj = new URL(url);
		return urlObj.hostname;
	} catch {
		return null;
	}
}

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/"
});

// Initialize rate limiter
const rateLimiter = new RateLimiter(100, 60000); // 100 requests per minute

// Rate limiting middleware
app.use("*", async (c, next) => {
	const clientIP =
		c.req.header("cf-connecting-ip") ||
		c.req.header("x-forwarded-for") ||
		"unknown";
	const rateCheck = rateLimiter.check(clientIP);

	if (!rateCheck.allowed) {
		c.header("X-RateLimit-Limit", "100");
		c.header("X-RateLimit-Remaining", "0");
		c.header(
			"X-RateLimit-Reset",
			new Date(rateCheck.resetTime).toISOString()
		);
		return c.json({ error: "Rate limit exceeded" }, 429);
	}

	c.header("X-RateLimit-Limit", "100");
	c.header("X-RateLimit-Remaining", rateCheck.remaining.toString());
	c.header("X-RateLimit-Reset", new Date(rateCheck.resetTime).toISOString());

	await next();
});

// Register OpenAPI endpoints with caching
openapi.get(
	"/api/lastfm/user-tracks/:username",
	cacheMiddleware("USER_TRACKS"),
	GetUserTracks as any
);
openapi.get(
	"/api/lastfm/track-info",
	cacheMiddleware("TRACK_INFO"),
	GetTrackInfo as any
);
openapi.get(
	"/api/lastfm/mb-releases",
	cacheMiddleware("MUSICBRAINZ"),
	GetMBReleases as any
);
openapi.get(
	"/api/lastfm/mb-release/:mbid",
	cacheMiddleware("MUSICBRAINZ"),
	GetMBReleaseInfo as any
);
openapi.get(
	"/api/lastfm/cover-art/:mbid",
	cacheMiddleware("COVER_ART"),
	GetCoverArt as any
);

// Export the Hono app
export default app;
export { validateOrigin };
