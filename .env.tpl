# Keycloak configuration
AUTH_KEYCLOAK_ID=elephant
AUTH_KEYCLOAK_SECRET=...
AUTH_KEYCLOAK_ISSUER=https://...
AUTH_KEYCLOAK_IDP_HINT=saml
AUTH_POST_LOGOUT_URI=http://localhost:5173/elephant
ELEPHANT_CHROME_CLIENT_ID=elephant-chrome
ELEPHANT_CHROME_CLIENT_SECRET=...

# Session (@ttab/tt-session)
# HMAC secret for the opaque sid cookie, 32+ random bytes. MUST be identical on
# every replica: if they differ, each replica rejects the others' cookies, which
# surfaces as a random mass logout. Rotation: set _OLD to the previous value —
# the first signs, both verify.
TT_SESSION_SID_SECRET=...
TT_SESSION_SID_SECRET_OLD=
# Dedicated Redis for sessions. Falls back to REDIS_URL, which is fine locally
# but wrong in production: the cache may run `allkeys-lru`, which would evict
# live sessions. Use `maxmemory-policy noeviction` on this instance.
TT_SESSION_REDIS_URL=
# Sliding session TTL in seconds. Defaults to 86400.
TT_SESSION_TTL_SECONDS=86400
# Namespaces the cookie so another TT app on the same host cannot take the
# session over with its own client grants. Defaults to elephant-chrome.
TT_SESSION_NAMESPACE=elephant-chrome
# Absolute public origin, e.g. https://tt.se. Needed behind an ingress that
# terminates TLS or rewrites Host. Defaults to PROTOCOL://HOST:PORT.
APP_ORIGIN=

# Repository
REPOSITORY_URL=https://...

# User API
USER_URL=http://localhost:1180

# Redis cache and pub/sub
# rediss://user:pass@host:port for TLS
# redis://localhost:6379 for no-tls, no-auth
REDIS_URL=

# Opensearch index
INDEX_URL="https://...se:443"

# Websocket
WS_URL=https:// ...

# Image resource
IMAGE_SEARCH_URL=https:// ...
IMAGE_SEARCH_PROVIDER=
IMAGE_BASE_URL=https:// ...

# Spelling backend
SPELLCHECK_URL=https:// ...

# Baboon print backend
BABOON_URL=https:// ...

# Server configuration
PROTOCOL=http
HOST=localhost
PORT=5183
BASE_URL=/elephant


FARO_URL=
FARO_NAME=
PYROSCOPE_URL=

SYSTEM_LANGUAGE=

