const identity: (x: any) => any = (x: any) => x;
export function cloneArray(arr: any[]) {
	return arr.map(identity);
}

export const unexpectedErrors = [
	"NetworkError when attempting to fetch resource.",
	"Login: User required to be logged in",
	"Failed to fetch"
];

export const msToMins = (ms: number) =>
	Math.floor(ms / 1000 / 60).toLocaleString(undefined, {
		maximumSignificantDigits: 2
	});
export const msToSecs = (ms: number) =>
	Math.floor((ms / 1000) % 60).toLocaleString(undefined, {
		maximumSignificantDigits: 2
	});

export const wait = async (secs: number) =>
	new Promise((resolve) => setTimeout(resolve, secs));
