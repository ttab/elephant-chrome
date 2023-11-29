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
      Metadata.tsx
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
