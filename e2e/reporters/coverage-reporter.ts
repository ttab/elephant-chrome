import type {
  FullResult,
  Reporter,
  TestCase,
  TestResult
} from '@playwright/test/reporter'
import fs from 'node:fs'
import path from 'node:path'
import { coverageMap } from '../coverage-map'

interface TestFileResult {
  file: string
  passed: number
  failed: number
  skipped: number
}

export default class CoverageReporter implements Reporter {
  private testFiles = new Map<string, TestFileResult>()

  onTestEnd(test: TestCase, result: TestResult) {
    const file = path.relative(
      path.resolve(import.meta.dirname, '../tests'),
      test.location.file
    )
    const entry = this.testFiles.get(file) ?? {
      file,
      passed: 0,
      failed: 0,
      skipped: 0
    }

    if (result.status === 'passed') {
      entry.passed++
    } else if (result.status === 'failed' || result.status === 'timedOut') {
      entry.failed++
    } else {
      entry.skipped++
    }

    this.testFiles.set(file, entry)
  }

  onEnd(_result: FullResult) {
    const mappedFiles = new Set(
      Object.values(coverageMap).flatMap((v) => v.tests)
    )
    const ranFiles = new Set(this.testFiles.keys())

    const covered = Object.entries(coverageMap)
      .filter(([, v]) => v.status === 'covered')
    const partial = Object.entries(coverageMap)
      .filter(([, v]) => v.status === 'partial')
    const uncovered = Object.entries(coverageMap)
      .filter(([, v]) => v.status === 'uncovered')
    const unmapped = [...ranFiles].filter((f) => !mappedFiles.has(f))

    // Console output
    console.log('\n=== E2E Coverage Report ===\n')
    console.log(`Covered:   ${covered.length} features`)
    console.log(`Partial:   ${partial.length} features`)
    console.log(`Uncovered: ${uncovered.length} features`)
    console.log(`Test files ran: ${ranFiles.size}`)

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

    // HTML report
    this.writeHtmlReport(covered, partial, uncovered, unmapped)

    // Fail if uncovered and env var set
    if (
      uncovered.length > 0
      && process.env.E2E_FAIL_ON_UNCOVERED === 'true'
    ) {
      console.error(
        `ERROR: ${uncovered.length} uncovered feature(s) detected`
      )
      process.exitCode = 1
    }
  }

  private writeHtmlReport(
    covered: [string, { tests: string[] }][],
    partial: [string, { tests: string[] }][],
    uncovered: [string, { tests: string[] }][],
    unmapped: string[]
  ) {
    const row = (feature: string, status: string, color: string) =>
      `<tr><td>${feature}</td>`
      + `<td style="color:${color}">${status}</td></tr>`

    const rows = [
      ...covered.map(([f]) => row(f, 'covered', '#22c55e')),
      ...partial.map(([f]) => row(f, 'partial', '#eab308')),
      ...uncovered.map(([f]) => row(f, 'uncovered', '#ef4444'))
    ].join('\n')

    const unmappedSection = unmapped.length > 0
      ? `<h3>Unmapped test files</h3><ul>${
        unmapped.map((f) => `<li>${f}</li>`).join('')
      }</ul>`
      : ''

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>E2E Coverage</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 800px;
    margin: 2rem auto; padding: 0 1rem; }
  table { border-collapse: collapse; width: 100%; }
  th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #ddd; }
  th { background: #f5f5f5; }
  h2 { margin-top: 2rem; }
</style>
</head><body>
<h1>E2E Coverage Report</h1>
<p>Covered: ${covered.length} | Partial: ${partial.length}`
+ ` | Uncovered: ${uncovered.length}</p>
<table>
<tr><th>Feature</th><th>Status</th></tr>
${rows}
</table>
${unmappedSection}
</body></html>`

    try {
      const reportDir = path.resolve(
        import.meta.dirname, '../playwright-report'
      )
      fs.mkdirSync(reportDir, { recursive: true })
      fs.writeFileSync(path.join(reportDir, 'coverage.html'), html)
    } catch (error) {
      console.error(
        '[CoverageReporter] Failed to write HTML report:',
        error instanceof Error ? error.message : error
      )
    }
  }
}
