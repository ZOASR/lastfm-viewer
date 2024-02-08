export const msToMins = (ms: number) => Math.floor(ms / 1000 / 60);
export const msToSecs = (ms: number) =>
	Math.floor((ms / 1000) % 60).toLocaleString(undefined, {
		minimumIntegerDigits: 2
	});

export const wait = async (secs: number) =>
	new Promise((resolve) => setTimeout(resolve, secs));

export function rgb2hsl(r: number, g: number, b: number) {
	(r = r / 255), (g = g / 255), (b = b / 255);
	let max = Math.max(r, g, b);
	let min = Math.min(r, g, b);
	let lum = (max + min) / 2;
	let hue: number = 0;
	let sat: number = 0;
	if (max == min) {
		// no saturation
		hue = 0;
		sat = 0;
	} else {
		const c = max - min;
		sat = c / (1 - Math.abs(2 * lum - 1));
		switch (max) {
			case r:
				hue = (g - b) / c;
				hue = ((g - b) / c) % 6;
				hue = (g - b) / c + (g < b ? 6 : 0);
				break;
			case g:
				hue = (b - r) / c + 2;
				break;
			case b:
				hue = (r - g) / c + 4;
				break;
		}
	}
	hue = Math.round(hue * 60);
	sat = Math.round(sat * 100);
	lum = Math.round(lum * 100);
	return [hue, sat, lum];
}

export function map(s: number, a1: number, a2: number, b1: number, b2: number) {
	return b1 + ((s - a1) * (b2 - b1)) / (a2 - a1);
}
