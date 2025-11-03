const mongoose = require("mongoose")

const sshKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  publicKey: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fingerprint: String,
  lastUsed: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

sshKeySchema.pre("save", function(next) {
  // Generate fingerprint from public key
  if (this.isModified("publicKey")) {
    const crypto = require("crypto")
    const hash = crypto.createHash("md5")
    hash.update(this.publicKey)
    this.fingerprint = hash.digest("hex")
  }
  next()
})

module.exports = mongoose.model("SSHKey", sshKeySchema)