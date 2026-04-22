const DEFAULT_IMAGE = process.env.DBAAS_REDIS_IMAGE || "redis:7-alpine"

function buildSpec({ id, port, password, cpuLimit, memoryLimitMb, publicAccess }) {
  const containerName = `db-${id}`
  const volumeName = `db-${id}-data`
  const internalPort = 6379

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
    "-v",
    `${volumeName}:/data`,
  ]

  if (publicAccess) {
    args.push("-p", `${port}:${internalPort}`)
  } else {
    args.push("-p", `127.0.0.1:${port}:${internalPort}`)
  }

  args.push(DEFAULT_IMAGE, "redis-server", "--appendonly", "yes", "--requirepass", password)

  return {
    type: "redis",
    image: DEFAULT_IMAGE,
    containerName,
    volumeName,
    internalPort,
    args,
  }
}

function buildConnectionString({ password, host, port }) {
  return `redis://:${encodeURIComponent(password)}@${host}:${port}`
}

module.exports = {
  type: "redis",
  buildSpec,
  buildConnectionString,
}
