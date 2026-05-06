import { describe, it, expect } from 'vitest'
import { spawn } from 'child_process'
import path from 'path'

/**
 * Tests for process fatal handlers (uncaughtException, unhandledRejection).
 *
 * These tests spawn child processes that trigger fatal errors and verify:
 * 1. The process exits with code 1
 * 2. The correct log message is output
 * 3. Graceful shutdown is attempted before exit
 */

const FIXTURE_DIR = path.join(__dirname, 'fixtures')

function runFixture(name: string): Promise<{ code: number | null, stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsx', path.join(FIXTURE_DIR, `${name}.ts`)], {
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: ['ignore', 'ignore', 'pipe']
    })

    let stderr = ''
    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      resolve({ code, stderr })
    })

    // Safety timeout - force kill if test hangs
    setTimeout(() => {
      child.kill('SIGKILL')
      resolve({ code: null, stderr: stderr + '\n[TEST TIMEOUT]' })
    }, 5000)
  })
}

describe('fatal handlers', () => {
  it('uncaughtException exits with code 1 and logs "Uncaught exception"', async () => {
    const { code, stderr } = await runFixture('uncaughtException')

    expect(code).toBe(1)
    expect(stderr).toContain('Uncaught exception')
  })

  it('unhandledRejection exits with code 1 and logs "Unhandled rejection"', async () => {
    const { code, stderr } = await runFixture('unhandledRejection')

    expect(code).toBe(1)
    expect(stderr).toContain('Unhandled rejection')
  })

  it('graceful shutdown is attempted before exit', async () => {
    const { code, stderr } = await runFixture('uncaughtException')

    expect(code).toBe(1)
    expect(stderr).toContain('close called')
  })
})
