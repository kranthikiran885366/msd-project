const mongoose = require("mongoose")

const submissionSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Form",
    required: true,
  },
  data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  files: [{
    fieldName: String,
    fileName: String,
    fileType: String,
    fileSize: Number,
    fileUrl: String,
  }],
  metadata: {
    ip: String,
    userAgent: String,
    referer: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

submissionSchema.index({ formId: 1, createdAt: -1 })

module.exports = mongoose.model("Submission", submissionSchema)