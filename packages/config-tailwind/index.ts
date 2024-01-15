/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
		"**/components/**/*.svelte"
	],
	theme: {
		extend: {}
	},
	plugins: [require("daisyui")],
	daisyui: {
		themes: false,
		base: false,
		themeRoot: '[data-lfmv="dark"]'
	},
	corePlugins: {
		preflight: false
	}
};
