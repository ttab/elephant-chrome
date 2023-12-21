# Environment
NODE_ENV="development"

# Google OAuth2 secrets
GOOGLE_CLIENT_ID="12345..."
GOOGLE_CLIENT_SECRET="GO..."

# Repository
REPOSITORY_URL="https://..."
JWKS_URL="https://.../.well-known/jwks.json"

# Redis cache and pub/sub
# rediss://user:pass:host:port for TLS
# redis://localhost:6379 for no-tls, no-auth
REDIS_URL=
# Opensearch index
INDEX_URL="https://...se:443"

# Server configuration
PROTOCOL=http
HOST=localhost
PORT=5183
BASE_URL=/elephant

# Used for cors with development server
DEV_CLIENT_PORT=5173
