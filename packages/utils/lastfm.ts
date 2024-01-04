import type { Image, Images, MBObject, Release, ReleaseInfo } from "./MBtypes";
import type { TrackInfoRes, UserRecentTracksRes } from "./LFMtypes";
import { version as APP_VERSION } from "./package.json";
import { Colors, TrackInfo } from "./types";
import { wait } from "./utils";

import { average } from "color.js";

const lastfm_api_root = "http://ws.audioscrobbler.com/2.0/";

const getMBTrackReleases = async (
	trackName: string,
	trackArtirst: string,
	albumName: string | undefined
): Promise<Release[] | null> => {
	let brainzUrl: string;
	if (albumName) {
		brainzUrl = `https://musicbrainz.org/ws/2/recording/?query=recording:"${trackName}"+AND+album:${albumName}+AND++artist:"${trackArtirst}"+AND+status:official+AND+primarytype:album&inc=releases&fmt=json&limit=1`;
	} else {
		brainzUrl = `https://musicbrainz.org/ws/2/recording/?query=recording:"${trackName}"+AND+artist:"${trackArtirst}"+AND+status:official+AND+primarytype:album&inc=releases&fmt=json&limit=1`;
	}
	const musicbrainzApi = await fetch(brainzUrl, {
		headers: {
			"User-Agent": `LastFMViewer/${APP_VERSION} `
		}
	});
	const brainzData: MBObject = await musicbrainzApi.json();
	if (brainzData.recordings) return brainzData.recordings[0]?.releases;
	else return null;
};

const getMBReleaseInfo = async (mbid: string): Promise<ReleaseInfo> => {
	const brainzUrl = `https://musicbrainz.org/ws/2/release/${mbid}?fmt=json`;
	const musicbrainzApi = await fetch(brainzUrl, {
		headers: {
			"User-Agent": `LastFMViewer/${APP_VERSION} `
		}
	});
	const releaseInfo: ReleaseInfo = await musicbrainzApi.json();
	return releaseInfo;
};

const getCAACoverArt = async (releaseMBid: string): Promise<Image[]> => {
	const coverArtUrl = `https://coverartarchive.org/release/${releaseMBid}`;
	const cover = await fetch(coverArtUrl);
	const covers: Images = await cover.json();
	return covers.images;
};

const getUserTracks = async (
	username: string,
	api_key: string,
	limit: number = 5
): Promise<UserRecentTracksRes> => {
	const lastfm_api_url = `${lastfm_api_root}?method=user.getrecenttracks&user=${username}&api_key=${api_key}&format=json&limit=${limit}`;

	const res = await fetch(lastfm_api_url, {
		method: "GET",
		headers: {
			"User-Agent": `LastFMViewer/${APP_VERSION} `
		}
	});
	if (res.ok) {
		const data: UserRecentTracksRes = await res.json();
		return data;
	} else {
		const error: { message: string; error: number } = await res.json();
		throw new Error(error.message);
	}
};

const getTrackInfo = async (
	track_name: string,
	track_artist: string,
	api_key: string
): Promise<TrackInfoRes> => {
	const lastfm_api_url = `${lastfm_api_root}?method=track.getInfo&track=${track_name}&artist=${track_artist}&api_key=${api_key}&format=json`;

	const res = await fetch(lastfm_api_url, {
		method: "GET",
		headers: {
			"User-Agent": `LastFMViewer/${APP_VERSION} `
		}
	});
	const data: TrackInfoRes = await res.json();
	if (res.ok) {
		if (!(data.track.album && data.track.album.image[3]["#text"])) {
			throw new Error("No lastfm album for this track");
		}
		return data;
	} else {
		const error: { message: string; error: number } = await res.json();
		throw new Error(error.message);
	}
};

export const getLatestTrack = async (
	username: string,
	api_key: string
): Promise<TrackInfo | Error> => {
	let trackName: string = "";
	let artistName: string = "";
	let albumTitle: string | undefined = undefined;
	let isNowplaying: boolean = false;
	let imageUrl: string = "";
	let duration: number = 0;
	let pasttracks;
	let colors: Colors | undefined = undefined;
	let userData: UserRecentTracksRes;
	let trackInfo: TrackInfoRes;

	try {
		userData = await getUserTracks(username, api_key, 5);

		trackName = userData.recenttracks.track[0].name;
		artistName = userData.recenttracks.track[0].artist["#text"];
		pasttracks = userData.recenttracks.track;

		if ("@attr" in userData.recenttracks.track[0])
			isNowplaying =
				userData.recenttracks.track[0]["@attr"]?.nowplaying == "true";
		else isNowplaying = false;
	} catch (error) {
		if (error instanceof Error) {
			return error;
		}
	}

	let LatestTrack: TrackInfo = {
		trackName: undefined,
		artistName: undefined,
		albumTitle: undefined,
		imageUrl: undefined,
		colors: undefined,
		nowplaying: false,
		pastTracks: [] as unknown[],
		duration: 0
	};

	try {
		trackInfo = await getTrackInfo(trackName, artistName, api_key);
		albumTitle = trackInfo.track.album?.title;
		duration = parseInt(trackInfo.track.duration);
		imageUrl = trackInfo.track.album?.image[3]["#text"];
		colors = await getColors(imageUrl);
		LatestTrack = {
			trackName: trackName,
			artistName: artistName,
			albumTitle: albumTitle,
			imageUrl: imageUrl,
			colors: colors,
			nowplaying: isNowplaying,
			pastTracks: pasttracks as unknown[],
			duration: duration
		};
	} catch (error) {
		if (error instanceof Error) {
			console.error(error);
		}

		const releases: Release[] | null = await getMBTrackReleases(
			trackName,
			artistName,
			albumTitle
		);

		LatestTrack = {
			trackName: trackName,
			artistName: artistName,
			albumTitle: albumTitle,
			imageUrl: undefined,
			colors: undefined,
			nowplaying: isNowplaying,
			pastTracks: pasttracks as unknown[],
			duration: duration
		};
		if (releases) {
			for (let release of releases) {
				const rleaseInfo: ReleaseInfo = await getMBReleaseInfo(
					release.id
				);
				if (
					rleaseInfo["cover-art-archive"].front ||
					rleaseInfo["cover-art-archive"].artwork ||
					rleaseInfo["cover-art-archive"].back
				) {
					const images: Image[] = await getCAACoverArt(release.id);
					imageUrl = images[0].thumbnails[250];
					colors = await getColors(imageUrl);
					LatestTrack = {
						trackName: trackName,
						artistName: artistName,
						albumTitle: release.title,
						imageUrl: imageUrl,
						colors: colors,
						nowplaying: isNowplaying,
						pastTracks: pasttracks as unknown[],
						duration: duration
					};
					return LatestTrack;
				}
				await wait(1000);
			}
		}
	}
	return LatestTrack;
};

const getColors = async (imageUrl: string) => {
	let colorobj: {
		primary: string;
		secondary: string;
		accent: string;
	} = {
		primary: "#fff",
		secondary: "#000",
		accent: "#888"
	};
	const color = await average(imageUrl, {
		amount: 1,
		format: "hex",
		sample: 10
	});
	const primary = color as string;
	const secondary = `hsl(from ${primary} h s calc(calc(l * -0.7) + 1) )`;
	const accent = `hsl(from ${secondary} h s calc( l * 0.5) )`;

	colorobj = {
		primary,
		secondary,
		accent
	};
	return colorobj;
};
