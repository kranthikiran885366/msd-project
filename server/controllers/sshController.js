const sshService = require("../services/sshService")

class SSHController {
  async listKeys(req, res, next) {
    try {
      const keys = await sshService.getSSHKeys(req.user.id)
      res.json(keys)
    } catch (error) {
      next(error)
    }
  }

  async addKey(req, res, next) {
    try {
      const { name, publicKey } = req.body
      const key = await sshService.addSSHKey(req.user.id, { name, publicKey })
      res.status(201).json(key)
    } catch (error) {
      next(error)
    }
  }

  async deleteKey(req, res, next) {
    try {
      const { id } = req.params
      await sshService.deleteSSHKey(id, req.user.id)
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }

  async connectToService(req, res, next) {
    try {
      const { serviceId } = req.params
      const { ws } = req

      if (!ws) {
        return res.status(400).json({ error: "WebSocket connection required" })
      }

      await sshService.connectToService(serviceId, req.user.id, ws)
      res.json({ message: "SSH connection established" })
    } catch (error) {
      next(error)
    }
  }

  async disconnectFromService(req, res, next) {
    try {
      const { serviceId } = req.params
      await sshService.disconnectFromService(serviceId, req.user.id)
      res.json({ message: "SSH connection terminated" })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new SSHController()