import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from 'hono/cors';
import {
	GetUserTracks,
	GetTrackInfo,
	GetMBReleases,
	GetMBReleaseInfo,
	GetCoverArt
} from "./endpoints/lastfm";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Apply CORS middleware
app.use('*', cors({
	origin: '*',
	allowMethods: ['GET'],
	allowHeaders: ['Content-Type', 'Authorization'],
	exposeHeaders: ['Content-Length', 'X-Requested-With'],
	maxAge: 86400, // 24 hours
	credentials: false // Don't allow credentials for wildcard origin
}));

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// Register OpenAPI endpoints with caching
openapi.get("/api/lastfm/user-tracks/:username", cacheMiddleware('USER_TRACKS'), GetUserTracks as any);
openapi.get("/api/lastfm/track-info", cacheMiddleware('TRACK_INFO'), GetTrackInfo as any);
openapi.get("/api/lastfm/mb-releases", cacheMiddleware('MUSICBRAINZ'), GetMBReleases as any);
openapi.get("/api/lastfm/mb-release/:mbid", cacheMiddleware('MUSICBRAINZ'), GetMBReleaseInfo as any);
openapi.get("/api/lastfm/cover-art/:mbid", cacheMiddleware('COVER_ART'), GetCoverArt as any);

// Export the Hono app
export default app;
