#! /usr/bin/env node
import fs from "fs";

const postcssConfigContent = `module.exports = {
	plugins: {
		"postcss-import": {},
		"tailwindcss/nesting": {},
		tailwindcss: {},
		autoprefixer: {},
	},
};`;

const tailwindConfigContent = `/** @type {import('tailwindcss').Config} */
import tailwindConfig from "@lastfm-viewer/tailwind-config";
export default {
	presets: [tailwindConfig]
};`;
fs.writeFileSync("./postcss.config.js", postcssConfigContent);
fs.writeFileSync("./tailwind.config.js", tailwindConfigContent);
