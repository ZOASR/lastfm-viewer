# @lastfm-viewer/ui

## 0.3.0

### Minor Changes

- feat: optimize source maps configuration in shared vite config

    - Add sourcemapExcludeSources: true to shared Vite configuration
    - Provides default optimization for all projects using the shared config

## 0.2.4

### Patch Changes

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

## 0.2.3

### Patch Changes

- dev(fix): changed export names in ui package

## 0.2.2

### Patch Changes

- fe7beb2: fix(ui): added identifier for animations to avoid clashing with tailwind animations

## 0.2.1

### Patch Changes

- bb425d0: hotfix for applying content in tailwind
- Updated dependencies [bb425d0]
    - @lastfm-viewer/tailwind-config@0.0.8

## 0.2.0

### Minor Changes

- ca30ff3: Restructured files for css scoping

## 0.1.4

### Patch Changes

- f7057b4: Fixed tw v3 styles clashing with v4 by scoping the v3 styles to the parent component
- Updated dependencies [f7057b4]
    - @lastfm-viewer/tailwind-config@0.0.7

## 0.1.3

### Patch Changes

- cdc04fc: UI changes and minor fixes
- Updated dependencies [cdc04fc]
    - @lastfm-viewer/tailwind-config@0.0.6

## 0.1.2

### Patch Changes

- 2d3ddc8: style: fixed wrong overflow styling in song cover image

## 0.1.1

### Patch Changes

- 5c006dc: Changed scrollbar styles and fixed solidjs component icons

## 0.1.0

### Minor Changes

- 409caf4: style adjustments and better error handling

## 0.0.12

### Patch Changes

- 6852642: Style changes

## 0.0.11

### Patch Changes

- 8e618d7: Style Changes and cofig fixes
- Updated dependencies [8e618d7]
    - @lastfm-viewer/tailwind-config@0.0.5

## 0.0.10

### Patch Changes

- fb0d0fc: style: changed font sizing to adapt to any page styles

## 0.0.9

### Patch Changes

- 14c2181: tailwind config improvements
- Updated dependencies [14c2181]
    - @lastfm-viewer/tailwind-config@0.0.4

## 0.0.8

### Patch Changes

- 81feccc: Fixed daisyui root styles are applied to whole page
- Updated dependencies [81feccc]
    - @lastfm-viewer/tailwind-config@0.0.3

## 0.0.7

### Patch Changes

- Updated dependencies [6108717]
    - @lastfm-viewer/tailwind-config@0.0.2

## 0.0.6

### Patch Changes

- b93a995: added content to tailwind config

## 0.0.5

### Patch Changes

- 30f5f90: added init bin file

## 0.0.4

### Patch Changes

- 47648c6: Dependency update
- Updated dependencies [47648c6]
    - @lastfm-viewer/tailwind-config@0.0.1

## 0.0.3

### Patch Changes

- cb5d2a2: added daisyui as a dep.

## 0.0.2

### Patch Changes

- 2b796f4: Publish @lastfm-viewer utility packages
