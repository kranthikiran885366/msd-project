const DEFAULT_IMAGE = process.env.DBAAS_MONGODB_IMAGE || "mongo:7"

function buildSpec({ id, port, username, password, databaseName, cpuLimit, memoryLimitMb, publicAccess }) {
  const containerName = `db-${id}`
  const volumeName = `db-${id}-data`
  const internalPort = 27017

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
    `MONGO_INITDB_ROOT_USERNAME=${username}`,
    "-e",
    `MONGO_INITDB_ROOT_PASSWORD=${password}`,
    "-e",
    `MONGO_INITDB_DATABASE=${databaseName}`,
    "-v",
    `${volumeName}:/data/db`,
  ]

  if (publicAccess) {
    args.push("-p", `${port}:${internalPort}`)
  } else {
    args.push("-p", `127.0.0.1:${port}:${internalPort}`)
  }

  args.push(DEFAULT_IMAGE)

  return {
    type: "mongodb",
    image: DEFAULT_IMAGE,
    containerName,
    volumeName,
    internalPort,
    args,
  }
}

function buildConnectionString({ username, password, host, port, databaseName }) {
  return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${databaseName}?authSource=admin`
}

module.exports = {
  type: "mongodb",
  buildSpec,
  buildConnectionString,
}
