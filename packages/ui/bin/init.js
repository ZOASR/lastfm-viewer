#! /usr/bin/env node
import fs from "fs";

const fileExtensions = ["js", "mjs", "ts", "mts", "cjs", "cts"];

const tailwindConfigContent = `/** @type {import('tailwindcss').Config} */
export default {
	presets: [require("@lastfm-viewer/tailwind-config")]
}`;

fs.readdir(".", async (err, data) => {
	const fileNames = fileExtensions.map((ext) => `tailwind.config.${ext}`);
	const fileName = fileNames.filter((file) => data.includes(file));
	const tailwindFile = fileName[0];

	if (tailwindFile) {
		fs.readFile(tailwindFile, null, (err, data) => {
			const content = String(data)
				.replace(
					/(export\s*default\s*|module\.exports\s*=\s*\{)((.|\n)*)(\};?)/g,
					"$1$2	presets: [require('@lastfm-viewer/tailwind-config')]\n$4"
				)
				.replace(
					/(\t?presets:*s*.*\s*\n){2}/g,
					"\tpresets: [require('@lastfm-viewer/tailwind-config')],\n"
				)
				.replace(/(\}(?!,|"|;))/g, "},");
			fs.writeFileSync(tailwindFile, content);
		});
	} else {
		fs.writeFileSync("tailwind.config.js", tailwindConfigContent);
	}
});

const object = {
	"postcss-import": {},
	"tailwindcss/nesting": {},
	tailwindcss: {},
	autoprefixer: {}
};
const postcssConfigContent = `module.exports = {
	plugins:${JSON.stringify(object)}
}`;

fs.writeFileSync("postcss.config.js", postcssConfigContent);
