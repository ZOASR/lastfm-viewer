/** @type {import('tailwindcss').Config} */
export default {
	content: {
		relative: true,
		files: [
			"../../apps/*/src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
			"../../apps/*/src/**/components/**/*.svelte"
		]
	},
	theme: {
		extend: {
			animation: {
				"spin-slow": "spin 3s linear infinite"
			}
		}
	},
	plugins: [require("daisyui")],
	daisyui: {
		themes: false,
		base: false,
		themeRoot: "[data-lfmv]"
	},
	corePlugins: {
		preflight: false
	}
};
