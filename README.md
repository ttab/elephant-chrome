# Elephant Chrome

This is the main Elephant application. Start using `npm run dev:web` && `npm run dev:css`

# Development info

## Structure in **elephant-chrome**

### Directory structure

Views that can function in their own right should be in `src/views/`, components in `src/commponents/` and support "library" functions in `src/lib/` as per below example.

```
src/
  views/
    editor/
      index.tsx
      metadata.tsx
      editable.tsx
    planning
      overview
        index.tsx
      add-item
        index.tsx
  components
    planning
      item-card
        index.tsx
        item-card-hader.tsx
        item-card-footer.tsx
      item-list
        index.tsx
    usermenu
      index.tsx
  lib
    auth
      handlLogin.ts
      handleLogout.ts
```

### Naming
Components and views filanames should be use lowercase only with dash separating words. All directories should have a default `index.tsx` with the main component implementation with all exports. All exported react components should be named according to _PascalCase_ and use named exports.

Support functions in component files should use _camelCase_ (i.e `myFunction()` and never be exported.

Components should be declared using fat arrow functions but regular _function()_ style for support functions below component function if applicable. Sub components should be broken out to their own files and exported through the main file.

```js
// src/components/my-component/index.tsx

export { MySubComponent } from '@/components/my-component/my-sub-component'

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

Use `@/lib/...`, `@/components/` etc to import components and functions.

Support library functions should use _camelCase_ (i.e `myFunction()`) in both file name and export.