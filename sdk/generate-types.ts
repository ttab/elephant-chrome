/**
 * Generates sdk/index.d.ts from the pluginApi barrel file.
 *
 * Uses the TypeScript compiler API to resolve all exports from the
 * barrel and emit a single flat declaration file with clean types.
 *
 * Usage: npx tsx sdk/generate-types.ts
 */
import ts from 'typescript'
import { readFileSync, writeFileSync, rmSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const barrelPath = resolve(projectRoot, 'src/lib/plugins/pluginApi.ts')
const outputPath = resolve(__dirname, 'index.d.ts')
const preamblePath = resolve(__dirname, 'preamble.d.ts')

// Load the project's tsconfig
const configPath = ts.findConfigFile(projectRoot, ts.sys.fileExists, 'tsconfig.json')
if (!configPath) {
  throw new Error('Could not find tsconfig.json')
}
const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, projectRoot)

const program = ts.createProgram({
  rootNames: parsedConfig.fileNames,
  options: { ...parsedConfig.options, noEmit: true }
})

const checker = program.getTypeChecker()
const barrelSource = program.getSourceFile(barrelPath)
if (!barrelSource) {
  throw new Error(`Could not find barrel source: ${barrelPath}`)
}

const barrelSymbol = checker.getSymbolAtLocation(barrelSource)
if (!barrelSymbol) {
  throw new Error('Could not get barrel module symbol')
}

const allExports = checker.getExportsOfModule(barrelSymbol)

// Collect types that need to be emitted as supporting declarations
const emittedNames = new Set<string>()
const supportingDecls: string[] = []
const mainDecls: string[] = []

// Format flags for clean type output
const typeFlags =
  ts.TypeFormatFlags.NoTruncation |
  ts.TypeFormatFlags.UseFullyQualifiedType |
  ts.TypeFormatFlags.WriteTypeArgumentsOfSignature

// Types that are locally defined in the SDK output — references to these
// via import("...").X should be replaced with just X
const localTypes = new Set([
  'YDocument', 'ViewProps', 'ViewMetadata', 'ViewRegistryItem',
  'ActivityDefinition', 'ViewRouteFunc', 'ResolvedRoute',
  'PluginInstance', 'PluginContext', 'TextBox', 'ExecuteOptions',
  'resolveEventOptions'
])

/**
 * Clean up type strings produced by checker.typeToString().
 *
 * The TS compiler resolves types to their full form, which means exported
 * signatures contain absolute import("/.../node_modules/...") paths and
 * references to host-internal types. This function rewrites those into
 * clean SDK-friendly forms.
 *
 * Guiding principles for what gets replaced:
 *
 * 1. **Standard shared deps** (React, Yjs) are mapped to their package
 *    namespace (`React.X`, `Y.X`) since plugins already depend on them.
 *
 * 2. **SDK-local types** (YDocument, ViewProps, etc.) are referenced by
 *    bare name since they're defined in the generated output itself.
 *
 * 3. **Host-internal types** are replaced with `unknown` when they would
 *    force plugin authors to depend on a host-internal package. The rule
 *    is: if exposing a type would require `npm install <host-dep>` in the
 *    plugin project just to satisfy the type checker, use `unknown` instead.
 *    Examples:
 *    - `EleDocumentResponse` — internal protobuf type from @ttab/elephant-api,
 *      used by useYDocument's `data` option for pre-populating documents.
 *    - `TemplatePayload` — internal document template type.
 *    - `HocuspocusProvider` — collaboration transport detail; plugins interact
 *      with documents through useYDocument, not the provider directly.
 *
 * 4. **Shared optional deps** like lucide-react are exposed as window globals
 *    by the host, so plugins can use them without installing them. Their
 *    types are kept as-is (e.g. `LucideIcon`) with an import in the output.
 *    - `MatchFunc` — internal routing matcher, not part of the plugin API.
 *
 * 5. **Simple type aliases** are inlined to avoid exposing internal naming:
 *    - `ViewWidths` → `Record<string, number>`
 *    - `Target` → `'self' | 'blank' | 'last'`
 *    - `View` → `string` (it's a string union that accepts arbitrary names)
 */
function cleanTypeString(s: string): string {
  // Replace import("...").TypeName with just TypeName when locally defined
  s = s.replace(/import\("[^"]*"\)\.([\w]+)/g, (match, typeName) => {
    if (localTypes.has(typeName)) {
      return typeName
    }
    return match
  })

  // --- Standard shared deps: rewrite absolute paths to package namespaces ---

  s = s.replace(/import\("[^"]*\/@types\/react\/[^"]*"\)\./g, 'React.')
  s = s.replace(/import\("[^"]*\/react\/jsx-runtime"\)\./g, '')
  s = s.replace(/import\("[^"]*\/yjs\/[^"]*"\)\./g, 'Y.')
  s = s.replace(/import\("[^"]*\/src\/modules\/yjs\/hooks[^"]*"\)\./g, '')

  // --- Host-internal and opinionated deps: replace with unknown ---

  // lucide-react is exposed as a window global, so keep the type name
  s = s.replace(/import\("[^"]*lucide-react[^"]*"\)\./g, '')
  // HocuspocusProvider — collaboration transport detail, not a plugin concern
  s = s.replace(/import\("[^"]*@hocuspocus[^"]*"\)\.HocuspocusProvider/g, 'unknown')
  // Catch-all for remaining internal imports (shared/, src/)
  s = s.replace(/import\("[^"]*\/(?:shared|src)\/[^"]*"\)\.([\w]+)/g, (_match, typeName) => {
    return typeName
  })

  // --- Yjs name normalization ---

  s = s.replace(/React\.JSX\.Element/g, 'JSX.Element')
  s = s.replace(/Y\.YMap/g, 'Y.Map')
  s = s.replace(/Y\.YDoc/g, 'Y.Doc')
  s = s.replace(/Y\.YXmlText/g, 'Y.XmlText')
  s = s.replace(/Y\.YArray/g, 'Y.Array')
  s = s.replace(/Y\.YAwarenessUser/g, 'unknown')

  // --- Host-internal types → unknown ---
  // These would require plugin authors to install @ttab/elephant-api or other
  // host-internal packages just to satisfy the type checker.

  s = s.replace(/EleDocumentResponse \| undefined/g, 'unknown')
  s = s.replace(/EleDocumentResponse/g, 'unknown')
  s = s.replace(/TemplatePayload \| undefined/g, 'unknown')
  s = s.replace(/TemplatePayload/g, 'unknown')
  s = s.replace(/MatchFunc \| undefined/g, 'unknown')
  s = s.replace(/MatchFunc/g, 'unknown')

  // Descendant (from slate) — plugins don't use the onChange callback
  s = s.replace(/import\("[^"]*slate[^"]*"\)\.Descendant/g, 'unknown')
  s = s.replace(/\bDescendant\b/g, 'unknown')

  // class-variance-authority types — internal styling detail
  s = s.replace(/import\("[^"]*class-variance-authority[^"]*"\)\.\w+/g, 'unknown')

  // --- Simple aliases inlined to avoid leaking internal naming ---

  // YPath — shared utility type, inline the definition
  s = s.replace(/\bYPath\b/g, '[string, ...(string | number)[]]')

  // FormProps — internal form plumbing, plugins just pass children
  s = s.replace(/\bFormProps\b/g, 'Record<string, unknown>')

  s = s.replace(/ViewWidths/g, 'Record<string, number>')

  s = s.replace(/Target \| undefined/g, "'self' | 'blank' | 'last' | undefined")
  s = s.replace(/\bTarget\b/g, "'self' | 'blank' | 'last'")

  if (s === 'View') {
    return 'string'
  }

  return s
}

/**
 * Emit a function declaration as just its signature
 */
function emitFunctionDecl(name: string, symbol: ts.Symbol): string {
  const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.declarations![0])
  const sigs = type.getCallSignatures()
  if (sigs.length === 0) {
    return ''
  }

  const sig = sigs[0]
  const typeParams = sig.typeParameters?.map((tp) => {
    const constraint = tp.getConstraint()
    const constraintStr = constraint && !(constraint.flags & ts.TypeFlags.Unknown)
      ? ` extends ${cleanTypeString(checker.typeToString(constraint))}`
      : ''
    return `${tp.symbol.name}${constraintStr}`
  }).join(', ')

  const params = sig.parameters.map((p) => {
    const paramType = checker.getTypeOfSymbolAtLocation(p, p.declarations![0])
    const optional = (p.declarations![0] as ts.ParameterDeclaration).questionToken ? '?' : ''
    return `${p.name}${optional}: ${cleanTypeString(checker.typeToString(paramType, undefined, typeFlags))}`
  }).join(', ')

  const retType = checker.getReturnTypeOfSignature(sig)
  const retStr = cleanTypeString(checker.typeToString(retType, undefined, typeFlags))

  const tpStr = typeParams ? `<${typeParams}>` : ''
  return `export declare function ${name}${tpStr}(${params}): ${retStr};`
}

/**
 * Emit an interface declaration
 */
function emitInterfaceDecl(name: string, symbol: ts.Symbol): string {
  const decl = symbol.declarations?.[0]
  if (!decl || !ts.isInterfaceDeclaration(decl)) {
    return ''
  }

  const typeParams = decl.typeParameters?.map((tp) => {
    const constraint = tp.constraint
      ? ` extends ${cleanTypeString(tp.constraint.getText(decl.getSourceFile()))}`
      : ''
    return `${tp.name.text}${constraint}`
  }).join(', ')

  const tpStr = typeParams ? `<${typeParams}>` : ''

  const type = checker.getDeclaredTypeOfSymbol(symbol)
  const props = type.getProperties()

  const members = props.map((prop) => {
    const propType = checker.getTypeOfSymbolAtLocation(prop, prop.declarations![0])
    const optional = prop.declarations?.[0] && (prop.declarations[0] as ts.PropertySignature).questionToken ? '?' : ''
    const typeStr = cleanTypeString(checker.typeToString(propType, undefined, typeFlags))
    return `  ${prop.name}${optional}: ${typeStr};`
  }).join('\n')

  return `export interface ${name}${tpStr} {\n${members}\n}`
}

/**
 * Emit a type alias
 */
function emitTypeAlias(name: string, symbol: ts.Symbol): string {
  const decl = symbol.declarations?.[0]
  if (!decl || !ts.isTypeAliasDeclaration(decl)) {
    return ''
  }

  const typeParams = decl.typeParameters?.map((tp) => tp.name.text).join(', ')
  const tpStr = typeParams ? `<${typeParams}>` : ''

  // Use the type node text directly to avoid self-referential resolution
  const typeNode = decl.type
  const typeStr = cleanTypeString(typeNode.getText(decl.getSourceFile()))

  return `export type ${name}${tpStr} = ${typeStr};`
}

/**
 * Emit a const declaration (for compound objects like ViewHeader, View)
 */
function emitConstDecl(name: string, symbol: ts.Symbol): string {
  const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.declarations![0])
  const props = type.getProperties()

  const members = props.map((prop) => {
    const propType = checker.getTypeOfSymbolAtLocation(prop, prop.declarations![0])
    const sigs = propType.getCallSignatures()
    if (sigs.length > 0) {
      // It's a function component
      const sig = sigs[0]
      const params = sig.parameters.map((p) => {
        const pType = checker.getTypeOfSymbolAtLocation(p, p.declarations![0])
        return `${p.name}: ${cleanTypeString(checker.typeToString(pType, undefined, typeFlags))}`
      }).join(', ')
      const ret = cleanTypeString(checker.typeToString(checker.getReturnTypeOfSignature(sig), undefined, typeFlags))
      return `  ${prop.name}: (${params}) => ${ret};`
    }
    const typeStr = cleanTypeString(checker.typeToString(propType, undefined, typeFlags))
    return `  ${prop.name}: ${typeStr};`
  }).join('\n')

  return `export declare const ${name}: {\n${members}\n};`
}

// Process each export
for (const sym of allExports) {
  const name = sym.name
  if (emittedNames.has(name)) {
    continue
  }
  emittedNames.add(name)

  const resolved = sym.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(sym)
    : sym

  const decl = resolved.declarations?.[0]
  if (!decl) {
    continue
  }

  let output = ''

  if (ts.isFunctionDeclaration(decl)) {
    output = emitFunctionDecl(name, resolved)
  } else if (ts.isInterfaceDeclaration(decl)) {
    output = emitInterfaceDecl(name, resolved)
  } else if (ts.isTypeAliasDeclaration(decl)) {
    output = emitTypeAlias(name, resolved)
  } else if (ts.isVariableDeclaration(decl)) {
    // Check if it's a compound object (ViewHeader, View) or simple value
    const type = checker.getTypeOfSymbolAtLocation(resolved, decl)
    if (type.getProperties().length > 0 && type.getCallSignatures().length === 0) {
      output = emitConstDecl(name, resolved)
    } else {
      const typeStr = cleanTypeString(checker.typeToString(type, undefined, typeFlags))
      output = `export declare const ${name}: ${typeStr};`
    }
  }

  if (output) {
    mainDecls.push(output)
  }
}

// Build the final output
const preamble = readFileSync(preamblePath, 'utf-8')

const imports = [
  "import type * as Y from 'yjs';",
  "import type * as React from 'react';",
  "import type { JSX } from 'react';",
  "import type { LucideIcon } from 'lucide-react';"
]

const body = [
  '// Auto-generated by sdk/generate-types.ts — do not edit manually',
  '',
  ...imports,
  '',
  preamble.trim(),
  '',
  ...supportingDecls,
  ...mainDecls
].join('\n\n') + '\n'

// Clean up excessive blank lines
const content = body.replace(/\n{3,}/g, '\n\n')

writeFileSync(outputPath, content)

// Clean up tsc tmp output if it exists
const tmpDir = resolve(__dirname, 'tmp')
rmSync(tmpDir, { recursive: true, force: true })

console.log(`Generated ${outputPath} with ${allExports.length} exports`)
