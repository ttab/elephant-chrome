# Elephant Chrome

This is the main Elephant application. Start using `npm run dev:web` && `npm run dev:css`

# Environment variables

`assertEnvs` blocks startup until every required variable is set. See `ttrun.env` for a working stage profile.

## Server / process

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | no | `development` | Set to `production` to serve the static build from `dist/` and skip Vite. |
| `HOST` | yes | `127.0.0.1` | Listen host. |
| `PORT` | yes | `5183` | HTTP listen port. |
| `PROTOCOL` | yes | — | `http` or `https`. Used for the CORS origin and the boot-log URL. |
| `BASE_URL` | yes | — | URL path prefix the app is mounted under (e.g. `/elephant`). |
| `LOG_LEVEL` | no | `info` | Pino log level. `info` and `debug` make the collaboration server verbose. |
| `SYSTEM_LANGUAGE` | yes | — | Default app language (e.g. `sv-se`, `nb-NO`). |
| `ENVIRONMENT` | yes | — | Environment tag (`development`, `stage`, `production`); shown in the environment banner and used by author-init logic. |

## TLS

Provide both cert paths to enable the HTTPS listener; provide neither to disable it. Setting only `TLS_CERT_PATH` without `TLS_KEY_PATH` is a startup error.

| Variable | Required | Default | Description |
|---|---|---|---|
| `TLS_CERT_PATH` | no | — | Path to the TLS certificate file. |
| `TLS_KEY_PATH` | no | — | Path to the TLS private key. |
| `TLS_PORT` | no | `1443` | HTTPS listen port. |

## Authentication (Auth.js + Keycloak)

| Variable | Required | Default | Description |
|---|---|---|---|
| `AUTH_TRUST_HOST` | yes | — | Auth.js trust-host setting (typically the public origin, e.g. `https://localhost:1443`). |
| `AUTH_SECRET` | yes | — | Auth.js session-encryption secret. |
| `AUTH_KEYCLOAK_ISSUER` | yes | — | Keycloak issuer URL (used for OIDC discovery). |
| `AUTH_KEYCLOAK_PROVIDER` | no | `AUTH_KEYCLOAK_ISSUER` | Override the URL used for provider lookup if it differs from the issuer. |
| `AUTH_KEYCLOAK_ID` | yes | — | Keycloak client ID for the user-facing flow. |
| `AUTH_KEYCLOAK_SECRET` | yes | — | Keycloak client secret. |
| `AUTH_KEYCLOAK_IDP_HINT` | no | — | Optional `kc_idp_hint` to skip the IdP picker. |
| `AUTH_POST_LOGOUT_URI` | no | `https://tt.se` | Redirect target after sign-out. |
| `ELEPHANT_CHROME_CLIENT_ID` | yes | — | Client ID for service-to-service token exchange. |
| `ELEPHANT_CHROME_CLIENT_SECRET` | yes | — | Paired secret. |

## Service URL resolver

Service URLs (`index`, `repository`, `spell`, `user`, `baboon`, `ntb`) are derived from rules instead of one variable per service. Public URLs default to `https://<name>.<host of BASE_PUBLIC_API_URL>`; internal URLs default to `http://elephant-<name>:1080` or `https://elephant-<name>:1443`. See `src-srv/lib/serviceUrls.ts`.

| Variable | Required | Default | Description |
|---|---|---|---|
| `BASE_PUBLIC_API_URL` | yes | — | Base URL the public per-service hosts are derived from. `https://api.example.com` produces `https://repository.api.example.com` and so on. |
| `INTERNAL_HTTPS_FOR_SERVICES` | no | _(empty)_ | Comma-separated list of logical service names that should use `https://…:1443` internally. Names not listed use `http://…:1080`. The literal value `*` opts in everything. |
| `INTERNAL_API_NAMES` | no | `repository:editorial-repository,baboon:baboon` | Comma-separated `name:host` pairs overriding the `elephant-<name>` internal-host default. Anything not listed falls back to the default. |
| `USE_PUBLIC_APIS_INTERNALLY` | no | `false` | When `true`, server-side calls also use the public URLs. Useful for local development without cluster DNS. |
| `<NAME>_PUBLIC_URL` _(pattern)_ | no | — | Per-service public-URL override. The lowercased env-var prefix is the logical service name — `INDEX_PUBLIC_URL=http://localhost:4380` overrides `index`, `REPOSITORY_PUBLIC_URL=…` overrides `repository`, etc. Any `*_PUBLIC_URL` variable is exposed to the client through `/api/envs`. |

## External services not following the resolver

These don't fit the `<name>.api.<base>` shape and are configured directly.

| Variable | Required | Default | Description |
|---|---|---|---|
| `WS_URL` | yes | — | WebSocket endpoint for the collaboration server (this app's own ws path, e.g. `wss://host/elephant/ws`). |
| `IMAGE_SEARCH_URL` | yes | — | Image-search backend (server-side fallback / SSR-time URL). |
| `IMAGE_SEARCH_PUBLIC_URL` | no | `IMAGE_SEARCH_URL` | Browser-facing override. |
| `IMAGE_SEARCH_PROVIDER` | yes | — | `tt` or `ntb`; determines the fetcher used in the browser. |
| `FARO_URL` | no | — | Faro telemetry endpoint (server-side fallback). |
| `FARO_PUBLIC_URL` | no | `FARO_URL` | Browser-facing override. |
| `IMAGE_BASE_URL` | yes for `/api/images/:url` | — | Upstream base URL the image proxy fetches from. |
| `GRAPHIC_BASE_URL` | yes for `/api/graphics/:url` | — | Upstream base URL the graphic proxy fetches from. |

## Cache & observability

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDIS_URL` | yes | — | Redis connection URL. Used by both the cache layer and the collaboration server's pub/sub. |
| `PYROSCOPE_URL` | no | _(disabled)_ | Pyroscope server for continuous profiling; omit or leave empty to disable. |

## Feature flags

| Variable | Required | Default | Description |
|---|---|---|---|
| `HAS_PRINT` | no | _(off)_ | Enables print views (`PrintEditor`, `PrintPreview`, `PrintDictionary`) when truthy. |
| `HAS_HAST` | no | _(off)_ | Enables the HAST (NPK) integration toggles when truthy. |
| `HAS_LOOSE_SLUGLINE` | no | _(off)_ | Disables slugline uniqueness validation when truthy. |
| `SNAPSHOT_STRICT` | no | `false` | Set to `true` to reject document snapshot writes that lack a Yjs update. |

## Local development

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_PROTOCOL` | no | `https` | Protocol used to construct the boot-log URL during dev. |
| `VITE_DEV_SERVER_PORT` | no | `5173` | Port for the Vite dev server (used by `dev:multi`). |
| `VITE_HMR_PORT` | no | `5183` | Port for Vite's HMR socket (used by `dev:multi`). |

# Development info

## Structure in **elephant-chrome**

### Directory structure

Views that can function in their own right should be in `src/views/`, components in `src/commponents/` and support "library" functions in `src/lib/` as per below example.

Example structure.

```
src/
  context/
    ThemeProvider.tsx
  hooks/
    useTheme.tsx
  lib
    auth
      handlLogin.ts
      handleLogout.ts
  views/
    index.tsx
    Editor/
      Editor.tsx
      Editable.tsx
    Planning
      Planning.tsx
      lib/
        sortPlanning.ts
        filterPlanning.ts
      hooks/
        usePlanningFilter.tsx
        usePlanningSort.tsx
  components
    ItemCard
      ItemCard.tsx
      ItemCardHeader.tsx
      ItemCardFooter.tsx
    ItemList
      ItemList.tsx
    Usermenu
      Usermenu.tsx
```

### Component naming and structure

Component and view filenames should use _PascalCase_, both for folder and main file. Exported name from a file should be same as filename. Parent directories should have an `index.tsx` with all views, components, lib files, etc.

Support functions in component files should use _camelCase_ (i.e `myFunction()` and never be exported.

Components should be declared using fat arrow functions but regular _function()_ style for support functions below component function if applicable. Sub components should be broken out to their own files and exported through the main file.

```js
// src/components/my-component/index.tsx example structure

export { MySubComponent } from '@/components/my-component/my-sub-component'

export interface MyComponentProps {
  variant: string
}

export const MyComponent = (): JSX.Element => {
   return (
      <div>
         {allIsOk() && (
            <MySubComponent>All is ok</MySubComponent>
         )}
      </div>
   )
}

function allIsOk(): boolean {
   return true
}
```

### Hooks and lib naming

All hooks and support functions in _hooks/_ and _lib/_ should all use _camelCase_ naming. Hooks should always use `.tsx` as suffix to separate them from other type of function files in _lib/_.

### Import aliases

Use `@/lib/...`, `@/components/`, `@/hooks/` and `@/views/` etc to import components and functions.

## Other resources

`elephant-chrome` depends on other packages:

* elephant-ui - components and styles
* textbit - text editor
* textbit-plugins - plugins for textbit editor

To link these packages there's a utility script in `./tooling` named link. Which can be executed
with `npm run link:elephant-ui` to hassle free link the packages during development.

```json
    "link:elephant-ui": "./tooling/link.sh ../elephant-ui",
    "unlink:elephant-ui": "./tooling/unlink.sh ../elephant-ui"
```

the link/unlink scripts takes a relative path to the package as argument.

## Running multiple dev instances with Caddy

`npm run dev:multi` kicks off `tooling/multi.sh`, which ensures `concurrently` + `caddy` exist before launching both dev stacks and the proxy from `Caddyfile`.

* Instance A: `PORT=5183`, `VITE_DEV_SERVER_PORT=5173`, `VITE_HMR_PORT=6000`
* Instance B: `PORT=5283`, `VITE_DEV_SERVER_PORT=5273`, `VITE_HMR_PORT=5000`
* Caddy listens on `http://localhost:3333` and round-robins HTTP + websockets between both

Edit `tooling/multi.sh` (and `Caddyfile`) to change ports; run the script directly or stick with npm.
For single-instance work, just run `npm run dev` with your own env vars.
To install caddy:

```bash
brew install caddy #MacOS
sudo apt install caddy #Debian/Ubuntu
nix-shell -p caddy #Nixos
```
