import { z } from "zod";
import { OpenAPIRoute } from "chanfana";
import { APP_VERSION } from "@lastfm-viewer/utils";
import type {
	Release,
	ReleaseInfo,
	Image,
	MBObject
} from "@lastfm-viewer/utils/MBtypes";
import type {
	UserRecentTracksRes,
	TrackInfoRes
} from "@lastfm-viewer/utils/LFMtypes";
import type { AppContext } from "../types";
import { CacheManager, generateCacheKey, type CacheType } from "../cache";

export type Env = {
	LASTFM_API_KEY: string;
};

// Create a single CacheManager instance
const cacheManager = new CacheManager(caches?.default);

// Response schemas
const ColorsSchema = z.object({
	primary: z.string().optional(),
	secondary: z.string().optional(),
	accent: z.string().optional(),
	coverShadowColor: z.string().optional()
});

const TrackInfoSchema = z.object({
	trackName: z.string().optional(),
	artistName: z.string().optional(),
	albumTitle: z.string().optional(),
	imageUrl: z.string().optional(),
	colors: ColorsSchema.optional(),
	nowplaying: z.boolean(),
	pastTracks: z.array(z.any()).optional(),
	duration: z.number()
});

const ErrorSchema = z.object({
	error: z.string()
});

// User Tracks endpoint
export class GetUserTracks extends OpenAPIRoute {
	schema = {
		request: {
			params: z.object({
				username: z.string().describe("LastFM username")
			}),
			query: z.object({
				limit: z
					.string()
					.optional()
					.describe("Number of tracks to return (default: 5)")
			})
		},
		responses: {
			200: z.custom<UserRecentTracksRes>(),
			400: ErrorSchema
		}
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { username } = data.params;
		const { limit } = data.query;
		const api_key = c.env.LASTFM_API_KEY;
		const limitNum = limit ? parseInt(limit) : 5;

		try {
			const lastfm_api_root = "https://ws.audioscrobbler.com/2.0/";
			const lastfm_api_url = `${lastfm_api_root}?method=user.getrecenttracks&user=${username}&api_key=${api_key}&format=json&limit=${limitNum}`;

			const res = await fetch(lastfm_api_url, {
				method: "GET",
				headers: {
					"User-Agent": `LastFMViewer/${APP_VERSION}`
				}
			});
			if (res.ok) {
				const tracks = (await res.json()) as UserRecentTracksRes;
				const cacheKey = generateCacheKey(
					"https://ws.audioscrobbler.com/2.0/",
					"",
					{
						...c.req.query(),
						method: "user.getrecenttracks",
						user: username
					}
				);
				await cacheManager.set(
					cacheKey,
					new Response(JSON.stringify(tracks)),
					"USER_TRACKS" as CacheType
				);
				return c.json(tracks);
			} else {
				const error = (await res.json()) as {
					message: string;
					error: number;
				};
				return c.json({ error: error.message }, 400);
			}
		} catch (error) {
			if (error instanceof Error) {
				return c.json({ error: error.message }, 400);
			}
			return c.json({ error: "Unknown error occurred" }, 400);
		}
	}
}

// Track Info endpoint
export class GetTrackInfo extends OpenAPIRoute {
	schema = {
		request: {
			query: z.object({
				track: z.string().describe("Track name"),
				artist: z.string().describe("Artist name")
			})
		},
		responses: {
			200: z.custom<TrackInfoRes>(),
			400: ErrorSchema
		}
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { track, artist } = data.query;
		const api_key = c.env.LASTFM_API_KEY;

		try {
			const lastfm_api_root = "https://ws.audioscrobbler.com/2.0/";
			const lastfm_api_url = `${lastfm_api_root}?method=track.getInfo&track=${track}&artist=${artist}&api_key=${api_key}&format=json`;

			const res = await fetch(lastfm_api_url, {
				method: "GET",
				headers: {
					"User-Agent": `LastFMViewer/${APP_VERSION}`
				}
			});
			const responseData = (await res.json()) as
				| TrackInfoRes
				| { message: string; error: number };
			if (res.ok) {
				if (
					!("track" in responseData) ||
					!(
						responseData.track.album &&
						responseData.track.album.image[3]["#text"]
					)
				) {
					return c.json(
						{ error: "No lastfm album for this track" },
						400
					);
				}
				const cacheKey = generateCacheKey(
					"https://ws.audioscrobbler.com/2.0/",
					"",
					{ ...c.req.query(), method: "track.getInfo" }
				);
				await cacheManager.set(
					cacheKey,
					new Response(JSON.stringify(responseData)),
					"TRACK_INFO" as CacheType
				);
				return c.json(responseData);
			} else {
				const error = responseData as {
					message: string;
					error: number;
				};
				return c.json({ error: error.message }, 400);
			}
		} catch (error) {
			if (error instanceof Error) {
				return c.json({ error: error.message }, 400);
			}
			return c.json({ error: "Unknown error occurred" }, 400);
		}
	}
}

// MusicBrainz Releases endpoint
export class GetMBReleases extends OpenAPIRoute {
	schema = {
		request: {
			query: z.object({
				track: z.string().describe("Track name"),
				artist: z.string().describe("Artist name"),
				album: z.string().optional().describe("Album name (optional)")
			})
		},
		responses: {
			200: z.custom<Release[] | null>(),
			400: ErrorSchema
		}
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { track, artist, album } = data.query;

		try {
			let brainzUrl: string;
			if (album) {
				brainzUrl = `https://musicbrainz.org/ws/2/recording/?query=recording:"${track}"+AND+album:${album}+AND++artist:"${artist}"+AND+status:official+AND+primarytype:album&inc=releases&fmt=json&limit=1`;
			} else {
				brainzUrl = `https://musicbrainz.org/ws/2/recording/?query=recording:"${track}"+AND+artist:"${artist}"+AND+status:official+AND+primarytype:album&inc=releases&fmt=json&limit=1`;
			}
			const musicbrainzApi = await fetch(brainzUrl, {
				headers: {
					"User-Agent": `LastFMViewer/${APP_VERSION}`
				}
			});
			const brainzData = (await musicbrainzApi.json()) as MBObject;
			if (brainzData.recordings.length > 0) {
				const releases = brainzData.recordings[0]?.releases;
				const cacheKey = generateCacheKey(
					"https://musicbrainz.org/ws/2/recording/",
					"",
					{ ...c.req.query(), path: c.req.path }
				);
				await cacheManager.set(
					cacheKey,
					new Response(JSON.stringify(releases)),
					"MUSICBRAINZ" as CacheType
				);
				return c.json(releases);
			} else {
				return c.json({ error: "No releases found" }, 400);
			}
		} catch (error) {
			if (error instanceof Error) {
				return c.json({ error: "No releases found" }, 400);
			}
			return c.json({ error: "Unknown error occurred" }, 400);
		}
	}
}

// MusicBrainz Release Info endpoint
export class GetMBReleaseInfo extends OpenAPIRoute {
	schema = {
		request: {
			params: z.object({
				mbid: z.string().describe("MusicBrainz release ID")
			})
		},
		responses: {
			200: z.custom<ReleaseInfo>(),
			400: ErrorSchema
		}
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mbid } = data.params;

		try {
			const brainzUrl = `https://musicbrainz.org/ws/2/release/${mbid}?fmt=json`;
			const musicbrainzApi = await fetch(brainzUrl, {
				headers: {
					"User-Agent": `LastFMViewer/${APP_VERSION}`
				}
			});
			const releaseInfo = (await musicbrainzApi.json()) as ReleaseInfo;
			const cacheKey = generateCacheKey(
				`https://musicbrainz.org/ws/2/release/${mbid}`,
				"",
				{ ...c.req.query(), path: c.req.path }
			);
			await cacheManager.set(
				cacheKey,
				new Response(JSON.stringify(releaseInfo)),
				"MUSICBRAINZ" as CacheType
			);
			return c.json(releaseInfo);
		} catch (error) {
			if (error instanceof Error) {
				return c.json({ error: error.message }, 400);
			}
			return c.json({ error: "Unknown error occurred" }, 400);
		}
	}
}

// Cover Art endpoint
export class GetCoverArt extends OpenAPIRoute {
	schema = {
		request: {
			params: z.object({
				mbid: z.string().describe("MusicBrainz release ID")
			})
		},
		responses: {
			200: z.custom<Image[]>(),
			400: ErrorSchema
		}
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { mbid } = data.params;

		try {
			const coverArtUrl = `https://coverartarchive.org/release/${mbid}`;
			const cover = await fetch(coverArtUrl);
			const covers = (await cover.json()) as { images: Image[] };
			const cacheKey = generateCacheKey(
				`https://coverartarchive.org/release/${mbid}`,
				"",
				{ ...c.req.query(), path: c.req.path }
			);
			await cacheManager.set(
				cacheKey,
				new Response(JSON.stringify(covers.images)),
				"COVER_ART" as CacheType
			);
			return c.json(covers.images);
		} catch (error) {
			if (error instanceof Error) {
				return c.json({ error: error.message }, 400);
			}
			return c.json({ error: "Unknown error occurred" }, 400);
		}
	}
}
