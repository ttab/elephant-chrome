function assertEnvs(): void {
  const envs = [
    'AUTH_KEYCLOAK_ISSUER',
    'AUTH_KEYCLOAK_SECRET',
    'AUTH_KEYCLOAK_ID',
    'AUTH_TRUST_HOST',
    'AUTH_SECRET',
    'REPOSITORY_URL',
    'REDIS_URL',
    'INDEX_URL',
    'WS_URL',
    'CONTENT_API_URL',
    'PROTOCOL',
    'HOST',
    'PORT',
    'BASE_URL'

  ]

  envs.forEach((env) => {
    if (!process.env[env]) {
      throw new Error(`Environment variable ${env} is required`)
    }
  })
}

export default assertEnvs
