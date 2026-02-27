import fs from 'node:fs'
import path from 'node:path'

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

function toPascalCase(str: string): string {
  return str.replace(
    /(^|[-_\s])(\w)/g,
    (_match: string, _sep: string, c: string) => c.toUpperCase()
  )
}

function main() {
  const viewArg = process.argv.find((a) => a.startsWith('--view='))

  if (!viewArg) {
    console.error('Usage: npx tsx e2e/scripts/scaffold-test.ts --view=ViewName')
    process.exit(1)
  }

  const viewName = viewArg.split('=')[1]
  const kebab = toKebabCase(viewName)
  const pascal = toPascalCase(viewName)

  const rootDir = path.resolve(import.meta.dirname, '..')
  const pagePath = path.join(rootDir, 'pages', `${kebab}.page.ts`)
  const testDir = path.join(rootDir, 'tests', kebab)
  const testPath = path.join(testDir, `${kebab}.spec.ts`)
  const coveragePath = path.join(rootDir, 'coverage-map.ts')

  // Check for existing files
  if (fs.existsSync(pagePath)) {
    console.error(`Page object already exists: ${pagePath}`)
    process.exit(1)
  }

  if (fs.existsSync(testPath)) {
    console.error(`Test file already exists: ${testPath}`)
    process.exit(1)
  }

  // Create page object
  const pageContent = `import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class ${pascal}Page {
  constructor(private page: Page) {}

  // Actions
  async goto() {
    await this.page.goto('${kebab}')
  }
}
`
  fs.writeFileSync(pagePath, pageContent)
  console.log(`Created page object: ${pagePath}`)

  // Create test file
  fs.mkdirSync(testDir, { recursive: true })
  const testContent = `import { test, expect } from '../../fixtures'

test.describe('${pascal} @secondary', () => {
  test('page loads', async ({ page }) => {
    await page.goto('${kebab}')
    // TODO: add assertions
  })
})
`
  fs.writeFileSync(testPath, testContent)
  console.log(`Created test file: ${testPath}`)

  // Update coverage map
  const coverageContent = fs.readFileSync(coveragePath, 'utf-8')
  const entry = `  '${kebab}': {\n`
    + `    tests: ['${kebab}/${kebab}.spec.ts'],\n`
    + `    status: 'uncovered',\n`
    + `  },\n`
  const updated = coverageContent.replace(
    '} as const',
    `\n  // Scaffolded\n${entry}} as const`
  )
  fs.writeFileSync(coveragePath, updated)
  console.log(`Updated coverage map: ${coveragePath}`)

  console.log('\nNext steps:')
  console.log(`  1. Add locators and actions to ${pagePath}`)
  console.log(`  2. Write tests in ${testPath}`)
  console.log(`  3. Register fixture in e2e/fixtures/index.ts`)
  console.log(`  4. Update status in coverage-map.ts to 'covered'`)
}

main()
