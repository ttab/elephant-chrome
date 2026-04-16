/**
 * Test fixture: triggers an uncaughtException to verify the handler behavior.
 */
export {}

// Mock collaboration server
const collaborationServer = {
  close: () => {
    console.error('close called')
    return Promise.resolve()
  }
}

// Simple stderr logger (mimics pino fatal)
const logger = {
  fatal: (obj: Record<string, unknown>, msg?: string) => {
    console.error(msg || JSON.stringify(obj))
  }
}

// Set up handler (same logic as src-srv/index.ts)
process.on('uncaughtException', (ex: Error) => {
  logger.fatal({ err: ex }, 'Uncaught exception')

  const forceExit = setTimeout(() => {
    process.abort()
  }, 1000)

  collaborationServer.close()
    .catch((err) => logger.fatal({ err }, 'Failed to close collaboration server'))
    .finally(() => {
      clearTimeout(forceExit)
      process.exit(1)
    })
})

// Trigger uncaughtException
throw new Error('Test uncaught exception')
