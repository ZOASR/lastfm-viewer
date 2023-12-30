/** @type {import('tailwindcss').Config} */

import tailwindConfig from "@repo/tailwind-config";
export default {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	presets: [tailwindConfig]
};
