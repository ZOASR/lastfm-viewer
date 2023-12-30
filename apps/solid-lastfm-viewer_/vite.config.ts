import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

import viteConfig from "@repo/vite-config/index.config";

import path from "node:path";

export default defineConfig({
	plugins: [solid(), ...viteConfig.plugins],
	define: viteConfig.define,
	build: {
		...viteConfig.build,
		lib: {
			entry: path.resolve(__dirname, "index.ts"),
			fileName: (format) => `index.${format}.js`
		},
		rollupOptions: {
			external: ["solid-js"],
			output: {
				globals: {
					solid: "solid-js"
				}
			}
		}
	}
});
