const mongoose = require("mongoose")

const endpointSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  description: String,
  parameters: [{
    name: String,
    type: String,
    required: Boolean,
    description: String
  }],
  responses: [{
    code: Number,
    description: String,
    schema: mongoose.Schema.Types.Mixed
  }],
  security: [{
    type: String,
    scopes: [String]
  }]
})

const apiSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  version: String,
  baseUrl: String,
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  endpoints: [endpointSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
})

apiSchema.pre("save", function(next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model("Api", apiSchema)