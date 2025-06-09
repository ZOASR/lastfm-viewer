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

// Register OpenAPI endpoints
openapi.get("/api/lastfm/user-tracks/:username", GetUserTracks);
openapi.get("/api/lastfm/track-info", GetTrackInfo);
openapi.get("/api/lastfm/mb-releases", GetMBReleases);
openapi.get("/api/lastfm/mb-release/:mbid", GetMBReleaseInfo);
openapi.get("/api/lastfm/cover-art/:mbid", GetCoverArt);

// Export the Hono app
export default app;
