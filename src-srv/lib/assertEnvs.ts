function assertEnvs(): void {
  const envs = [
    'AUTH_KEYCLOAK_ISSUER',
    'AUTH_KEYCLOAK_SECRET',
    'AUTH_KEYCLOAK_ID',
    // The sid cookie's MAC secret. Must be byte-identical on every replica —
    // if they disagree, each rejects the others' cookies and it looks like a
    // random mass logout.
    'TT_SESSION_SID_SECRET',
    'ELEPHANT_CHROME_CLIENT_ID',
    'ELEPHANT_CHROME_CLIENT_SECRET',
    'REPOSITORY_URL',
    'USER_URL',
    'REDIS_URL',
    'INDEX_URL',
    'WS_URL',
    'IMAGE_SEARCH_URL',
    'IMAGE_SEARCH_PROVIDER',
    'PROTOCOL',
    'HOST',
    'PORT',
    'BASE_URL',
    'SYSTEM_LANGUAGE'
  ]

  envs.forEach((env) => {
    if (!process.env[env]) {
      throw new Error(`Environment variable ${env} is required`)
    }
  })
}

export default assertEnvs
