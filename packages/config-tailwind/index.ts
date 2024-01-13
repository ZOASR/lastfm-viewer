/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	theme: {
		extend: {}
	},
	plugins: [require("daisyui")],
	daisyui: {
		themes: ["dark"],
		themeRoot: '[data-theme="dark"]'
	},
	corePlugins: {
		preflight: false
	}
};
