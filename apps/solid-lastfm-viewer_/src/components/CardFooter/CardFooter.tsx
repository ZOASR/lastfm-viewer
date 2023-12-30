import { lfmContext } from "../SolidLastFMViewer";
import { FaBrandsLastfm, FaRegularUser } from "solid-icons/fa";
import { SiMusicbrainz } from "solid-icons/si";
import { useContext } from "solid-js";

import styles from "@repo/ui/CardFooter.module.css";

const CardFooter = ({ user }: { user: string }) => {
	const context = useContext(lfmContext);
	return (
		<div
			style={{ color: context.colors?.secondary }}
			class={styles.cardFooter}
		>
			<span class="flex gap-2">
				<a
					href="https://www.last.fm/"
					target="_blank"
					class="h-min self-center "
				>
					<FaBrandsLastfm />
				</a>
				<a href="https://musicbrainz.org/" target="_blank">
					<SiMusicbrainz />
				</a>
			</span>
			<a class={styles.profile} href={`https://www.last.fm/user/${user}`}>
				<FaRegularUser />
				{user}
			</a>
		</div>
	);
};

export default CardFooter;
