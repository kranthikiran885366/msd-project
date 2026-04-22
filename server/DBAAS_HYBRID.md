# Hybrid DBaaS API

This platform provisions databases through a hybrid model:

- `free` plan -> Docker provider on worker nodes
- `pro` / `enterprise` -> managed provider (`aws` for PostgreSQL, `atlas` for MongoDB)

## Required Environment Variables

### Core

- `JWT_SECRET`
- `NODE_PRIVATE_IP`
- `NODE_PUBLIC_IP`

### Docker tier

- `PORT_RANGE_START`
- `PORT_RANGE_END`
- `DBAAS_BACKUP_DIR` (optional, defaults to `server/backups`)

### AWS RDS tier

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_RDS_SECURITY_GROUP_IDS` (comma-separated)

### Atlas tier

- `ATLAS_PROJECT_ID`
- `ATLAS_PUBLIC_KEY`
- `ATLAS_PRIVATE_KEY`
- `ATLAS_ACCESS_LIST` (comma-separated CIDR allow-list)

## Database API

- `POST /api/databases`
  - body:
    - `projectId` (required)
    - `name` (required)
    - `type`: `mongodb | postgresql | redis`
    - `config.size`: `micro | small | medium | large | xlarge`
    - `config.providerOverride`: `docker | aws | atlas` (optional)
    - `config.publicAccess`: `boolean`
- `GET /api/databases?projectId=<id>`
- `GET /api/databases/:databaseId`
- `PATCH /api/databases/:databaseId`
- `DELETE /api/databases/:databaseId`
- `POST /api/databases/:databaseId/start` (docker only)
- `POST /api/databases/:databaseId/stop` (docker only)
- `POST /api/databases/:databaseId/pause` (docker only)
- `POST /api/databases/:databaseId/restart` (docker only)
- `POST /api/databases/:databaseId/backups`
- `GET /api/databases/:databaseId/backups`

## Automatic deployment env injection

When an app deployment starts, DB connections are injected automatically:

- `DATABASE_URL` (primary)
- `<TYPE>_URL` (`MONGODB_URL`, `POSTGRESQL_URL`, `REDIS_URL`)

Values are decrypted only in deploy pipeline memory and are not persisted in plaintext.

## Failure handling

- Provider create/delete operations use retry with exponential wait
- DB status monitoring runs continuously and updates:
  - `running`
  - `failed`
  - `stopped`
- Docker databases attempt auto-start when health checks detect failure
