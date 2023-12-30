import { useContext } from "solid-js";
import { lfmContext } from "../SolidLastFMViewer";
import styles from "@repo/ui/TrackProgressBar.module.css";

const msToMins = (ms: number) =>
	Math.floor(ms / 1000 / 60).toLocaleString(undefined, {
		maximumSignificantDigits: 2
	});
const msToSecs = (ms: number) =>
	Math.floor((ms / 1000) % 60).toLocaleString(undefined, {
		maximumSignificantDigits: 2
	});

const TrackProgressBar = () => {
	const context = useContext(lfmContext);
	return (
		<>
			<div class={styles.trackProgress}>
				<span class={styles.nowplaying}> Now Playing</span>
				<div class={styles.icon}>
					<span
						class={styles.musicbar}
						style={{
							background: context?.colors?.secondary
						}}
					/>
					<span
						class={styles.musicbar}
						style={{
							background: context?.colors?.secondary
						}}
					/>
					<span
						class={styles.musicbar}
						style={{
							background: context?.colors?.secondary
						}}
					/>
				</div>
			</div>
			<div
				class={styles.bar}
				style={{ color: context?.colors?.secondary }}
			>
				<span class="text-xs">00:00</span>
				<progress
					class="progress"
					max={
						context.track instanceof Error
							? 0
							: context.track
								? (context.track?.duration as number) / 1000
								: 0
					}
				></progress>
				<span class="text-xs">
					{context.track instanceof Error
						? " "
						: context.track
							? (context.track?.duration as number) > 0
								? `${msToMins(
										context.track?.duration as number
									)}:${msToSecs(
										context.track?.duration as number
									)}`
								: "--:--"
							: "--:--"}
				</span>
			</div>
		</>
	);
};

export default TrackProgressBar;
