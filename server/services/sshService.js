const SSHKey = require("../models/SSHKey")
const { NodeSSH } = require("node-ssh")
const WebSocket = require("ws")

class SSHService {
  constructor() {
    this.connections = new Map()
  }

  async getSSHKeys(userId) {
    return await SSHKey.find({ userId })
  }

  async addSSHKey(userId, keyData) {
    const sshKey = new SSHKey({
      ...keyData,
      userId,
    })
    return await sshKey.save()
  }

  async deleteSSHKey(keyId, userId) {
    return await SSHKey.findOneAndDelete({ _id: keyId, userId })
  }

  async connectToService(serviceId, userId, ws) {
    try {
      // Get service details (hostname, port, etc.)
      const service = await this.getServiceDetails(serviceId)
      
      // Get user's SSH key
      const sshKey = await SSHKey.findOne({ userId })
      if (!sshKey) {
        throw new Error("No SSH key found")
      }

      // Initialize SSH connection
      const ssh = new NodeSSH()
      await ssh.connect({
        host: service.hostname,
        port: service.port,
        username: service.username,
        privateKey: sshKey.privateKey,
      })

      // Store connection
      this.connections.set(ws, { ssh, service })

      // Handle WebSocket messages (terminal input)
      ws.on("message", async (data) => {
        const conn = this.connections.get(ws)
        if (conn && conn.ssh) {
          await conn.ssh.execCommand(data.toString(), {
            onStdout: (chunk) => ws.send(chunk.toString()),
            onStderr: (chunk) => ws.send(chunk.toString()),
          })
        }
      })

      // Handle WebSocket close
      ws.on("close", () => {
        const conn = this.connections.get(ws)
        if (conn && conn.ssh) {
          conn.ssh.dispose()
        }
        this.connections.delete(ws)
      })

      return true
    } catch (error) {
      throw new Error(`SSH connection failed: ${error.message}`)
    }
  }

  async getServiceDetails(serviceId) {
    // This should fetch service connection details from your database
    // For example: hostname, port, username, etc.
    return {
      hostname: "service-hostname",
      port: 22,
      username: "service-user",
    }
  }
}

module.exports = new SSHService()