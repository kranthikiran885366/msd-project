// SSL Controller
const sslService = require("../services/sslService")
const multer = require("multer")

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 3 // Allow up to 3 files (certificate, key, and chain)
  },
  fileFilter: (req, file, cb) => {
    try {
      const allowedTypes = [".crt", ".pem", ".cer", ".key"]
      const fileExt = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf("."))
      if (allowedTypes.includes(fileExt)) {
        cb(null, true)
      } else {
        cb(new Error("Invalid file type. Only .crt, .pem, .cer, and .key files are allowed."))
      }
    } catch (error) {
      cb(error)
    }
  }
})

class SSLController {
  async getSSLCertificates(req, res, next) {
    try {
      const { domainId } = req.query
      if (!domainId) {
        return res.status(400).json({ success: false, error: "Domain ID is required" })
      }
      
      const certificates = await sslService.getSSLCertificates(domainId)
      res.json({ success: true, data: certificates })
    } catch (error) {
      next(error)
    }
  }

  async uploadSSLCertificate(req, res, next) {
    try {
      const { domainId, name, domain } = req.body
      const files = req.files

      if (!files || !files.certificate || !files.key) {
        return res.status(400).json({ 
          success: false, 
          error: "Certificate and private key files are required" 
        })
      }

      const certificateData = files.certificate[0].buffer.toString()
      const privateKey = files.key[0].buffer.toString()
      const chainData = files.chain ? files.chain[0].buffer.toString() : null

      const certificate = await sslService.uploadSSLCertificate({
        domainId,
        name,
        domain,
        certificateData,
        privateKey,
        chainData,
      })

      res.status(201).json({ success: true, data: certificate })
    } catch (error) {
      next(error)
    }
  }

  async deleteSSLCertificate(req, res, next) {
    try {
      const { id } = req.params
      const certificate = await sslService.deleteSSLCertificate(id)
      if (!certificate) {
        return res.status(404).json({ success: false, error: "Certificate not found" })
      }
      res.json({ success: true, message: "Certificate deleted successfully" })
    } catch (error) {
      next(error)
    }
  }

  async renewSSLCertificate(req, res, next) {
    try {
      const { id } = req.params
      const certificate = await sslService.renewSSLCertificate(id)
      res.json({ success: true, data: certificate })
    } catch (error) {
      next(error)
    }
  }

  async getSSLCertificateById(req, res, next) {
    try {
      const { id } = req.params
      const certificate = await sslService.getSSLCertificateById(id)
      if (!certificate) {
        return res.status(404).json({ success: false, error: "Certificate not found" })
      }
      res.json({ success: true, data: certificate })
    } catch (error) {
      next(error)
    }
  }

  // Middleware for file upload
  getUploadMiddleware() {
    return upload.fields([
      { name: "certificate", maxCount: 1 },
      { name: "key", maxCount: 1 },
      { name: "chain", maxCount: 1 },
    ])
  }
}

module.exports = new SSLController()