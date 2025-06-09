import type { Image, Release, ReleaseInfo } from "./MBtypes";
import type { TrackInfoRes, UserRecentTracksRes } from "./LFMtypes";
import { Colors, TrackInfo } from "./types";
import { map, rgb2hsl, wait } from "./utils";

import { average } from "color.js";

// Custom error classes for better error handling
export class LastFMError extends Error {
	constructor(message: string, public readonly code?: string) {
		super(message);
		this.name = 'LastFMError';
	}
}

export class MusicBrainzError extends Error {
	constructor(message: string, public readonly code?: string) {
		super(message);
		this.name = 'MusicBrainzError';
	}
}

export class CoverArtError extends Error {
	constructor(message: string, public readonly code?: string) {
		super(message);
		this.name = 'CoverArtError';
	}
}

export class APIError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly code?: string
	) {
		super(message);
		this.name = 'APIError';
	}
}

// Helper function to handle API responses
async function handleAPIResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		const error = await response.json() as { error: string };
		throw new APIError(error.error, response.status);
	}
	return response.json();
}

const API_ROOT = "https://lastfm-viewer-api.cloudflare-untying955.workers.dev/api/lastfm";

const getMBTrackReleases = async (
	trackName: string,
	trackArtist: string,
	albumName?: string
): Promise<Release[] | null> => {
	try {
		const url = `${API_ROOT}/mb-releases?track=${encodeURIComponent(trackName)}&artist=${encodeURIComponent(trackArtist)}${albumName ? `&album=${encodeURIComponent(albumName)}` : ''}`;
		const res = await fetch(url);
		return await handleAPIResponse<Release[] | null>(res);
	} catch (error) {
		if (error instanceof APIError) {
			throw new MusicBrainzError(error.message, error.code);
		}
		throw new MusicBrainzError('Failed to fetch MusicBrainz releases', 'MB_FETCH_ERROR');
	}
};

const getMBReleaseInfo = async (mbid: string): Promise<ReleaseInfo> => {
	try {
		const res = await fetch(`${API_ROOT}/mb-release/${mbid}`);
		return await handleAPIResponse<ReleaseInfo>(res);
	} catch (error) {
		if (error instanceof APIError) {
			throw new MusicBrainzError(error.message, error.code);
		}
		throw new MusicBrainzError('Failed to fetch MusicBrainz release info', 'MB_INFO_ERROR');
	}
};

const getCAACoverArt = async (releaseMBid: string): Promise<Image[]> => {
	try {
		const res = await fetch(`${API_ROOT}/cover-art/${releaseMBid}`);
		return await handleAPIResponse<Image[]>(res);
	} catch (error) {
		if (error instanceof APIError) {
			throw new CoverArtError(error.message, error.code);
		}
		throw new CoverArtError('Failed to fetch cover art', 'COVER_ART_ERROR');
	}
};

const getUserTracks = async (
	username: string,
	api_key: string,
	limit: number = 5
): Promise<UserRecentTracksRes> => {
	try {
		const res = await fetch(`${API_ROOT}/user-tracks/${username}?limit=${limit}`);
		return await handleAPIResponse<UserRecentTracksRes>(res);
	} catch (error) {
		if (error instanceof APIError) {
			throw new LastFMError(error.message, error.code);
		}
		throw new LastFMError('Failed to fetch user tracks', 'USER_TRACKS_ERROR');
	}
};

const getTrackInfo = async (
	track_name: string,
	track_artist: string,
	api_key: string
): Promise<TrackInfoRes> => {
	try {
		const url = `${API_ROOT}/track-info?track=${encodeURIComponent(track_name)}&artist=${encodeURIComponent(track_artist)}`;
		const res = await fetch(url);
		const data = await handleAPIResponse<TrackInfoRes>(res);

		if (!(data.track.album && data.track.album.image[3]["#text"])) {
			throw new LastFMError('No Last.fm album for this track', 'NO_ALBUM_ERROR');
		}
		return data;
	} catch (error) {
		if (error instanceof LastFMError) {
			throw error;
		}
		if (error instanceof APIError) {
			throw new LastFMError(error.message, error.code);
		}
		throw new LastFMError('Failed to fetch track info', 'TRACK_INFO_ERROR');
	}
};


// this cache is used to store the track info for a user & track name pair
// this is used to avoid duplicate calls to the API
const cache = new Map<string, TrackInfo>();

export const getLatestTrack = async (
	username: string,
	api_key: string
): Promise<TrackInfo | Error> => {
	try {
		// Get user's recent tracks
		const userData = await getUserTracks(username, api_key, 5);
		const currentTrack = userData.recenttracks.track[0];

		// Extract basic track info
		const trackName = currentTrack.name;
		const cached = cache.get(`${username}-${trackName}`);
		if (cached) return cached;
		const artistName = currentTrack.artist["#text"];
		const isNowplaying = "@attr" in currentTrack && currentTrack["@attr"]?.nowplaying === "true";
		const pastTracks = userData.recenttracks.track;

		// Try to get detailed track info from LastFM first
		try {
			const trackInfo = await getTrackInfo(trackName, artistName, api_key);
			const albumTitle = trackInfo.track.album?.title;
			const duration = parseInt(trackInfo.track.duration);
			const imageUrl = trackInfo.track.album?.image[3]["#text"];
			const colors = await getColors(imageUrl);

			const trackInfoObj: TrackInfo = {
				trackName,
				artistName,
				albumTitle,
				imageUrl,
				colors,
				nowplaying: isNowplaying,
				pastTracks,
				duration
			};
			cache.set(`${username}-${trackName}`, trackInfoObj);
			return trackInfoObj;
		} catch (error) {
			if (error instanceof LastFMError && error.code === 'NO_ALBUM_ERROR') {
				console.warn('LastFM track info fetch failed:', error.message);
			} else {
				console.error('LastFM track info fetch failed:', error);
			}

			// Fallback to MusicBrainz if LastFM fails
			try {
				const releases = await getMBTrackReleases(trackName, artistName);
				if (!releases) {
					const trackInfoObj: TrackInfo = {
						trackName,
						artistName,
						albumTitle: undefined,
						imageUrl: undefined,
						colors: await getColors(undefined),
						nowplaying: isNowplaying,
						pastTracks,
						duration: 0
					};
					cache.set(`${username}-${trackName}`, trackInfoObj);
					return trackInfoObj;
				}

				// Try each release until we find one with cover art
				for (const release of releases) {
					try {
						const releaseInfo = await getMBReleaseInfo(release.id);
						const hasCoverArt = releaseInfo["cover-art-archive"].front ||
							releaseInfo["cover-art-archive"].artwork ||
							releaseInfo["cover-art-archive"].back;

						if (hasCoverArt) {
							const images = await getCAACoverArt(release.id);
							if (!images[0]?.thumbnails[250]) continue;

							const imageUrl = images[0].thumbnails[250];
							const colors = await getColors(imageUrl);

							const trackInfoObj: TrackInfo = {
								trackName,
								artistName,
								albumTitle: release.title,
								imageUrl,
								colors,
								nowplaying: isNowplaying,
								pastTracks,
								duration: 0
							};
							cache.set(`${username}-${trackName}`, trackInfoObj);
							return trackInfoObj;
						}
					} catch (error) {
						console.warn(`Failed to fetch cover art for release ${release.id}:`, error);
						continue;
					}
					await wait(1000); // Rate limiting
				}

				// Return basic info if no cover art found
				const trackInfoObj: TrackInfo = {
					trackName,
					artistName,
					albumTitle: undefined,
					imageUrl: undefined,
					colors: await getColors(undefined),
					nowplaying: isNowplaying,
					pastTracks,
					duration: 0
				};
				cache.set(`${username}-${trackName}`, trackInfoObj);
				return trackInfoObj;
			} catch (error) {
				console.error('MusicBrainz fallback failed:', error);
				// Return basic info if MusicBrainz fallback fails
				const trackInfoObj: TrackInfo = {
					trackName,
					artistName,
					albumTitle: undefined,
					imageUrl: undefined,
					colors: await getColors(undefined),
					nowplaying: isNowplaying,
					pastTracks,
					duration: 0
				};
				cache.set(`${username}-${trackName}`, trackInfoObj);
				return trackInfoObj;
			}
		}
	} catch (error) {
		console.error('Failed to fetch latest track:', error);
		return error instanceof Error ? error : new Error('Unknown error occurred');
	}
};

const getColors = async (imageUrl: string | undefined) => {
	let colorobj: Colors = {
		primary: "var(--default-primary)",
		secondary: "var(--default-secondary)",
		accent: "var(--default-accent)",
		coverShadowColor: "var(--default-cover-shadow-color)"
	};
	if (!imageUrl) return colorobj;
	const color = (await average(imageUrl, {
		amount: 1,
		sample: 50
	})) as number[];
	const colorHSL = rgb2hsl(color[0], color[1], color[2]);
	const hue = colorHSL[0];
	const sat = colorHSL[1];

	const pL = map(colorHSL[2], 0, 100, 0, 30);
	const sL = 100 - pL;
	const aL = pL * 1.8;

	const primary = `hsl(${hue}, ${sat}%, ${pL}%)`;
	const secondary = `hsl(${hue}, ${sat}%, ${sL}%)`;
	const accent = `hsl(${hue}, ${sat}%, ${aL}%)`;
	const coverShadowColor = `hsla(${hue}, ${sat}%, ${sL}%, 0.5)`;

	colorobj = {
		primary,
		secondary,
		accent,
		coverShadowColor
	};
	return colorobj;
};
