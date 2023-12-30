import "./App.css";
import SolidLastFMViewer from "./components/SolidLastFMViewer";

SolidLastFMViewer;
function App() {
	return (
		<>
			<SolidLastFMViewer
				user="ZOASR"
				api_key={import.meta.env.VITE_API_KEY}
				updateInterval={10000}
			/>
		</>
	);
}

export default App;
