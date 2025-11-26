# Elephant Chrome

This is the main Elephant application. Start using `npm run dev:web` && `npm run dev:css`

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
