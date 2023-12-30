import { Match, Show, Switch, createContext } from "solid-js";

import TrackProgressBar from "./TrackProgressBar/TrackProgressBar";
import PastTracks from "./PastTracks/PastTracks";

import {
	FaBrandsLastfm,
	FaRegularUser,
	FaSolidCompactDisc
} from "solid-icons/fa";
import { SiMusicbrainz } from "solid-icons/si";

import disc from "./disc.svg";
import { lfmvHook, useLastfmViewer } from "./useLastfmViewer";
import { LastFmImage } from "@repo/utils/LFMtypes";
import { Image } from "@repo/utils/MBtypes";
import ErrorView from "./ErrorView/ErrorView";
import LoadingSkeleton from "./LoadingSkeleton/LoadingSkeleton";

import styles from "@repo/ui/LastFMViewer.module.css";
import "@repo/ui";
import CardFooter from "./CardFooter/CardFooter";

export interface Colors {
	primary: string | undefined;
	secondary: string | undefined;
	accent: string | undefined;
}
export interface Props {
	api_key: string;
	user: string;
	updateInterval?: number;
}

export const lfmContext = createContext<lfmvHook>({
	track: {
		trackName: "",
		artistName: "",
		albumTitle: "",
		MBImages: undefined,
		lastfmImages: undefined,
		nowplaying: false,
		pastTracks: [],
		duration: 0
	},
	colors: undefined,
	loading: true,
	message: ""
});

const SolidLastFMViewer = ({ api_key, user, updateInterval }: Props) => {
	const state: lfmvHook = useLastfmViewer({
		api_key,
		user,
		updateInterval
	});
	return (
		<>
			{/* preconnects */}
			<link href="https://lastfm.freetls.fastly.net" rel="preconnect" />
			<link href="https://archive.org" rel="preconnect" />
			<link href="https://coverartarchive.org" rel="preconnect" />
			<link href="http://coverartarchive.org" rel="preconnect" />
			<link href="https://musicbrainz.org" rel="preconnect" />
			<link href="http://ws.audioscrobbler.com" rel="preconnect" />
			{/* preconnects */}
			<lfmContext.Provider value={state}>
				<div
					class={styles.lfmvCard}
					style={{ background: state.colors?.primary }}
				>
					{state.track instanceof Error ? (
						<Show when={state.message}>
							{<ErrorView message={state.message as string} />}
						</Show>
					) : (
						<>
							<figure
								style={{
									"box-shadow": `0 0 20px ${state.colors?.secondary}99`
								}}
							>
								<Switch
									fallback={
										<LoadingSkeleton
											class="mx-auto h-[300px] w-[300px]"
											fallback={
												<img
													src={disc}
													class=""
													alt="Default album cover thumbnail"
												/>
											}
										>
											{null}
										</LoadingSkeleton>
									}
								>
									<Match when={state.track?.lastfmImages}>
										<img
											src={
												(
													state.track
														?.lastfmImages as LastFmImage[]
												)[3]["#text"]
											}
											alt="Album Cover"
										/>
									</Match>
									<Match when={state.track?.MBImages}>
										<img
											src={
												(
													state.track
														?.MBImages as Image[]
												)[0].image
											}
											alt="Album Cover"
										/>
									</Match>
								</Switch>
							</figure>

							<div class={styles.cardBody}>
								<LoadingSkeleton
									class="mx-auto h-[40px] w-[90%]"
									fallback={null}
								>
									{state.track?.nowplaying && (
										<TrackProgressBar />
									)}
								</LoadingSkeleton>
								<h1
									class={styles.trackTitle}
									style={{ color: state.colors?.secondary }}
								>
									<LoadingSkeleton
										class={styles.titleSkeleton}
										fallback="Track title not available"
									>
										{state.track?.trackName}
									</LoadingSkeleton>
								</h1>
								<div
									style={{ color: state.colors?.secondary }}
									class="flex flex-col gap-2 text-xs"
								>
									<LoadingSkeleton
										class={styles.titleSkeleton}
										fallback="Artist name not available"
									>
										{
											<span class={styles.infoSpan}>
												<FaRegularUser />
												{state.track?.artistName}
											</span>
										}
									</LoadingSkeleton>
									<LoadingSkeleton
										class={styles.titleSkeleton}
										fallback="Album name not available"
									>
										{state.track?.albumTitle ? (
											<span class={styles.infoSpan}>
												<FaSolidCompactDisc />
												{state.track?.albumTitle}
											</span>
										) : null}
									</LoadingSkeleton>
								</div>
								<PastTracks />
								<CardFooter user={user} />
							</div>
						</>
					)}
				</div>
			</lfmContext.Provider>
		</>
	);
};

export default SolidLastFMViewer;
