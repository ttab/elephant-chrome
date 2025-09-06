import { Hocuspocus, type Configuration } from '@hocuspocus/server'


// eslint-disable-next-line @typescript-eslint/require-await
export const newHocuspocus = async (options?: Partial<Configuration>): Promise<Hocuspocus> => {
  const server = new Hocuspocus({
    // We don’t need the logging in testing.
    quiet: true,
    // Add or overwrite settings, depending on the test case.
    ...options
  })

  return server
}
