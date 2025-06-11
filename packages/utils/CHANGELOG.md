# @lastfm-viewer/utils

## 0.2.0

### Minor Changes

- refactor: removed api_key prop requirement and moved all api calls to a cloudflare worker to prevent api leaking in the client

    ## Breaking Changes

    ### What Changed

    - Removed the requirement to pass an `api_key` prop to components
    - All Last.fm API calls are now handled through a Cloudflare Worker instead of directly from the client
    - Components no longer make direct API calls to Last.fm

    ### Why This Change Was Made

    - Security: Prevents exposure of Last.fm API keys in client-side code
    - Better API key management: API keys are now managed server-side
    - Reduced risk of API key abuse: Requests are now proxied through a controlled endpoint
    - Improved rate limiting: Better control over API request rates

    ### How to Update Your Code

    #### Before:

    ```tsx
    <LastFmViewer
    	api_key="your-api-key"
    	username="your-username"
    	// other props...
    />
    ```

    #### After:

    ```tsx
    <LastFmViewer
    	username="your-username"
    	// other props...
    />
    ```

    Simply remove the `api_key` prop from your components. The API calls will now be automatically handled through our hosted Cloudflare Worker.

## 0.1.1

### Patch Changes

- cdc04fc: UI changes and minor fixes

## 0.1.0

### Minor Changes

- 409caf4: style adjustments and better error handling

## 0.0.4

### Patch Changes

- 4e5e998: api calls fixes and accesibility features

## 0.0.3

### Patch Changes

- fec1ab4: Changed deps. requirement

## 0.0.2

### Patch Changes

- 2b796f4: Publish @lastfm-viewer utility packages
