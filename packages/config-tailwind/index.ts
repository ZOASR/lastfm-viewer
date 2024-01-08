/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
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
