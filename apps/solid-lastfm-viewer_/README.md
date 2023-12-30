<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=solid-lastfm-viewer&background=tiles&project=%20" alt="solid-lastfm-viewer">
</p>

# solid-lastfm-viewer

<p align="center" >
<a href="https://npm.io/package/solid-lastfm-viewer"><img src="https://img.shields.io/badge/maintained%20with-npm-cc00ff.svg?style=for-the-badge&logo=npm" ></a>
<a href="https://www.npmjs.com/package/solid-lastfm-viewer" alt="solid-lastfm-viewer(npm)">
<img src="https://img.shields.io/npm/dt/solid-lastfm-viewer?style=for-the-badge&logo=npm&logoColor=red&label=solid-lastfm-viewer" /></a>
</p>

A solidjs component to view recent scrobbles for a last.fm user **(This is a sister project to <a href="https://github.com/ZOASR/react-lastfm-viewer">@react-lastfm-viewer</a>)**

<p align="center">
  <img src="https://github.com/ZOASR/solid-lastfm-viewer/blob/main/images/Preview_1.png" style="border-radius: 10px"/>
  <img src="https://github.com/ZOASR/solid-lastfm-viewer/blob/main/images/Preview_2.png" style="border-radius: 10px"/>
</p>

## Quick start

Install it:

```bash
npm i solid-lastfm-viewer
# or
yarn add solid-lastfm-viewer
# or
pnpm add solid-lastfm-viewer
```

Use it:

to start using the component you first need to get a last.fm API key from [here](https://www.last.fm/api), once you've done that just import the component and specify the username of the user you want to get scrobbling information from:

> Please note that some users set their profile stats to private, so not every user is applicable, if you're using this component on your personal account just set your "Recent listening" stats to public [here](https://www.last.fm/settings/privacy)

```tsx
import SolidLastFMViewer from "solid-lastfm-viewer";

function App() {
	return (
		<>
			<SolidLastFMViewer user="[username]" api_key="[API_KEY]" />
		</>
	);
}
```

if you want to frequently fetch the user's listening info just specify the `updateInterval` prop. (milliseconds) (it takes a number that determines the update interval):

```tsx
import SolidLastFMViewer from "solid-lastfm-viewer";

function App() {
	return (
		<>
			<SolidLastFMViewer
				user="[username]"
				api_key="[API_KEY]"
				updateInterval={20000} //20 seconds
			/>
		</>
	);
}
```
