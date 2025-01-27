# Keycloak configuration
AUTH_SECRET=...
AUTH_KEYCLOAK_ID=elephant
AUTH_KEYCLOAK_SECRET=...
AUTH_KEYCLOAK_ISSUER=https://...
AUTH_KEYCLOAK_IDP_HINT=saml
AUTH_POST_LOGOUT_URI=http://localhost:5173/elephant

# Repository
REPOSITORY_URL=https://...

# Redis cache and pub/sub
# rediss://user:pass@host:port for TLS
# redis://localhost:6379 for no-tls, no-auth
REDIS_URL=

# Opensearch index
INDEX_URL="https://...se:443"

# Websocket
WS_URL=https:// ...

# Image resource
CONTENT_API_URL=https:// ...

# Spelling backend
SPELLCHECK_URL=https:// ...

# Server configuration
PROTOCOL=http
HOST=localhost
PORT=5183
BASE_URL=/elephant


FARO_URL=
FARO_NAME=
