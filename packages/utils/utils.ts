export const unexpectedErrors = [
	"NetworkError when attempting to fetch resource.",
	"Login: User required to be logged in",
	"Failed to fetch"
];

export const msToMins = (ms: number) => Math.floor(ms / 1000 / 60);
export const msToSecs = (ms: number) =>
	Math.floor((ms / 1000) % 60).toLocaleString(undefined, {
		minimumIntegerDigits: 2
	});

export const wait = async (secs: number) =>
	new Promise((resolve) => setTimeout(resolve, secs));
