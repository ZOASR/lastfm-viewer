# @lastfm-viewer/api using OpenAPI 3.1

This is a Cloudflare Worker with OpenAPI 3.1 using [chanfana](https://github.com/cloudflare/chanfana) and [Hono](https://github.com/honojs/hono).

This is an example project made to be used as a quick start into building OpenAPI compliant Workers that generates the
`openapi.json` schema automatically from code and validates the incoming request to the defined parameters or request body.

## Get started

1. Sign up for [Cloudflare Workers](https://workers.dev). The free tier is more than enough for most use cases.
2. Clone this project and install dependencies with `pnpm install`
3. Run `wrangler login` to login to your Cloudflare account in wrangler
4. Run `wrangler deploy` to publish the API to Cloudflare Workers

## Project structure

1. The main router is defined in `src/index.ts`.
2. Each endpoint has its own file in `src/endpoints/`.
3. For more information read the [chanfana documentation](https://chanfana.pages.dev/) and [Hono documentation](https://hono.dev/docs).

## Development

1. Add your [last.fm](https://www.last.fm/api) API key in a `.dev.vars` file, you will find an example for this in `.dev.vars.example`.
2. Run `wrangler dev` to start a local instance of the API.
3. Open `http://localhost:8787/` in your browser to see the Swagger interface where you can try the endpoints.
4. Changes made in the `src/` folder will automatically trigger the server to reload, you only need to refresh the Swagger interface.
