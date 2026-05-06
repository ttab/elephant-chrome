type FatalLogger = {
  fatal: (obj: object, msg: string) => void
}

type FatalHandlerDeps = {
  collaborationServer: { close: () => Promise<unknown> }
  logger: FatalLogger
  forceExitMs?: number
}

export function createFatalHandler(label: string, deps: FatalHandlerDeps) {
  const { collaborationServer, logger, forceExitMs = 1000 } = deps
  return (ex: Error) => {
    logger.fatal({ err: ex }, label)

    const forceExit = setTimeout(() => {
      process.abort()
    }, forceExitMs)

    collaborationServer.close()
      .catch((err: unknown) => logger.fatal({ err }, 'Failed to close collaboration server'))
      .finally(() => {
        clearTimeout(forceExit)
        process.exit(1)
      })
  }
}

export function installFatalHandlers(deps: FatalHandlerDeps) {
  process.on('uncaughtException', createFatalHandler('Uncaught exception', deps))
  process.on('unhandledRejection', createFatalHandler('Unhandled rejection', deps))
}
