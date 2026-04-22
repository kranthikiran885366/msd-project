const { RDSClient, CreateDBInstanceCommand, DeleteDBInstanceCommand, DescribeDBInstancesCommand } = require("@aws-sdk/client-rds")

class AwsRdsProvider {
  constructor() {
    this.region = process.env.AWS_REGION || "us-east-1"
    this.client = new RDSClient({
      region: this.region,
      credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
    })
  }

  async createDatabase({ databaseId, username, password, databaseName, size }) {
    const dbInstanceIdentifier = `db-${String(databaseId).slice(-12).toLowerCase()}`
    const params = {
      DBInstanceIdentifier: dbInstanceIdentifier,
      Engine: "postgres",
      DBInstanceClass: this._resolveInstanceClass(size),
      AllocatedStorage: this._resolveStorage(size),
      MasterUsername: username,
      MasterUserPassword: password,
      DBName: databaseName,
      VpcSecurityGroupIds: (process.env.AWS_RDS_SECURITY_GROUP_IDS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      PubliclyAccessible: process.env.AWS_RDS_PUBLIC === "true",
      MultiAZ: process.env.AWS_RDS_MULTI_AZ === "true",
      BackupRetentionPeriod: Number(process.env.AWS_RDS_BACKUP_RETENTION_DAYS || 7),
      StorageEncrypted: true,
      DeletionProtection: process.env.AWS_RDS_DELETION_PROTECTION === "true",
      AutoMinorVersionUpgrade: true,
      Tags: [{ Key: "managed-by", Value: "clouddeck" }],
    }

    await this.client.send(new CreateDBInstanceCommand(params))
    const details = await this._waitForAvailable(dbInstanceIdentifier)
    const host = details.Endpoint?.Address
    const port = details.Endpoint?.Port || 5432
    return {
      provider: "aws",
      host,
      privateHost: host,
      port,
      externalResourceId: dbInstanceIdentifier,
      connectionString: `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${databaseName}`,
    }
  }

  async deleteDatabase(meta) {
    if (!meta.externalResourceId) return { deleted: true }
    await this.client.send(
      new DeleteDBInstanceCommand({
        DBInstanceIdentifier: meta.externalResourceId,
        SkipFinalSnapshot: process.env.AWS_RDS_SKIP_FINAL_SNAPSHOT === "true",
      })
    )
    return { deleted: true }
  }

  async getStatus(meta) {
    const details = await this.client.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: meta.externalResourceId })
    )
    return details.DBInstances?.[0]?.DBInstanceStatus || "unknown"
  }

  async _waitForAvailable(identifier) {
    const timeoutMs = Number(process.env.AWS_RDS_CREATE_TIMEOUT_MS || 1800000)
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      const out = await this.client.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: identifier }))
      const instance = out.DBInstances?.[0]
      if (instance?.DBInstanceStatus === "available") return instance
      await new Promise((r) => setTimeout(r, 15000))
    }
    throw new Error("Timed out waiting for RDS instance availability")
  }

  _resolveInstanceClass(size = "small") {
    const map = {
      micro: "db.t4g.micro",
      small: "db.t4g.small",
      medium: "db.t4g.medium",
      large: "db.t4g.large",
      xlarge: "db.m6g.xlarge",
    }
    return map[size] || "db.t4g.small"
  }

  _resolveStorage(size = "small") {
    const map = { micro: 20, small: 20, medium: 50, large: 100, xlarge: 200 }
    return map[size] || 20
  }
}

module.exports = AwsRdsProvider
