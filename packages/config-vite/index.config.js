import path from "node:path";
import dts from "vite-plugin-dts";
import { libInjectCss } from "vite-plugin-lib-inject-css";

const viteConfig = {
	plugins: [dts(), libInjectCss()],
	define: {
		APP_VERSION: JSON.stringify(process.env.npm_package_version)
	},
	build: {
		sourcemap: true,
		emptyOutDir: true
	}
};

export default viteConfig;
