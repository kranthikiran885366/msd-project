const DEFAULT_IMAGE = process.env.DBAAS_POSTGRES_IMAGE || "postgres:16-alpine"

function buildSpec({ id, port, username, password, databaseName, cpuLimit, memoryLimitMb, publicAccess }) {
  const containerName = `db-${id}`
  const volumeName = `db-${id}-data`
  const internalPort = 5432

  const args = [
    "run",
    "-d",
    "--name",
    containerName,
    "--restart=unless-stopped",
    "--memory",
    `${memoryLimitMb}m`,
    "--cpus",
    String(cpuLimit),
    "-e",
    `POSTGRES_USER=${username}`,
    "-e",
    `POSTGRES_PASSWORD=${password}`,
    "-e",
    `POSTGRES_DB=${databaseName}`,
    "-v",
    `${volumeName}:/var/lib/postgresql/data`,
  ]

  if (publicAccess) {
    args.push("-p", `${port}:${internalPort}`)
  } else {
    args.push("-p", `127.0.0.1:${port}:${internalPort}`)
  }

  args.push(DEFAULT_IMAGE)

  return {
    type: "postgresql",
    image: DEFAULT_IMAGE,
    containerName,
    volumeName,
    internalPort,
    args,
  }
}

function buildConnectionString({ username, password, host, port, databaseName }) {
  return `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${databaseName}`
}

module.exports = {
  type: "postgresql",
  buildSpec,
  buildConnectionString,
}
