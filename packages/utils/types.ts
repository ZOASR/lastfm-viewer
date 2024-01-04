import { Track } from "./LFMtypes";

export type Colors = {
	primary: string | undefined;
	secondary: string | undefined;
	accent: string | undefined;
};
export type TrackInfo = {
	trackName: string | undefined;
	artistName: string | undefined;
	albumTitle?: string | undefined;
	nowplaying: boolean | undefined;
	pastTracks: unknown[] | Track[];
	imageUrl: string | undefined;
	colors: Colors | undefined;
	duration: number;
};
