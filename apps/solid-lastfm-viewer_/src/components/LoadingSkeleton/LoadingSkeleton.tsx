import { JSX } from "solid-js/jsx-runtime";
import { Show, useContext } from "solid-js";
import { lfmContext } from "../SolidLastFMViewer";

interface Props {
	children: JSX.Element | "";
	fallback: JSX.Element | "";
	class: string;
}

const LoadingSkeleton = (props: Props) => {
	const context = useContext(lfmContext);
	return (
		<>
			<Show
				when={context.loading}
				fallback={
					<Show when={props.children} fallback={props.fallback}>
						{props.children}
					</Show>
				}
			>
				<div class={"skeleton " + props.class}></div>
			</Show>
		</>
	);
};

export default LoadingSkeleton;
