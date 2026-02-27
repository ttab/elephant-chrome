import fs from 'node:fs'
import path from 'node:path'
import { coverageMap } from '../coverage-map'

const TESTS_DIR = path.resolve(import.meta.dirname, '../tests')

function getTestFiles(dir: string): string[] {
  const files: string[] = []

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      files.push(...getTestFiles(path.join(dir, entry.name)))
    } else if (entry.name.endsWith('.spec.ts')) {
      files.push(path.relative(TESTS_DIR, path.join(dir, entry.name)))
    }
  }

  return files
}

function main() {
  const testFiles = getTestFiles(TESTS_DIR)

  const covered = Object.entries(coverageMap)
    .filter(([, v]) => v.status === 'covered')
  const partial = Object.entries(coverageMap)
    .filter(([, v]) => v.status === 'partial')
  const uncovered = Object.entries(coverageMap)
    .filter(([, v]) => v.status === 'uncovered')

  // Check for test files not referenced in coverage map
  const mappedFiles = new Set(
    Object.values(coverageMap).flatMap((v) => v.tests)
  )
  const unmapped = testFiles.filter((f) => !mappedFiles.has(f))

  console.log('\n=== E2E Coverage Report ===\n')
  console.log(`Covered:   ${covered.length} features`)
  console.log(`Partial:   ${partial.length} features`)
  console.log(`Uncovered: ${uncovered.length} features`)
  console.log(`Test files: ${testFiles.length}`)

  if (partial.length > 0) {
    console.log('\n--- Partial Coverage ---')
    for (const [feature] of partial) {
      console.log(`  - ${feature}`)
    }
  }

  if (uncovered.length > 0) {
    console.log('\n--- Uncovered Features ---')
    for (const [feature] of uncovered) {
      console.log(`  - ${feature}`)
    }
  }

  if (unmapped.length > 0) {
    console.log('\n--- Test files not in coverage map ---')
    for (const file of unmapped) {
      console.log(`  - ${file}`)
    }
  }

  console.log('')

  if (uncovered.length > 0) {
    process.exit(1)
  }
}

main()
