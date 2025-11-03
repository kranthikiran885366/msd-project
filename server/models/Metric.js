const mongoose = require("mongoose")
const { Schema } = mongoose

const metricSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  resourceType: { type: String, required: true },
  resourceId: mongoose.Schema.Types.ObjectId,
  metricType: {
    type: String,
    enum: ["invocations", "errors", "duration", "memory", "cpu", "requests", "latency", "throughput"],
    required: true,
  },
  value: { type: Number, required: true },
  unit: String,
  tags: { type: Map, of: String },
  timestamp: { type: Date, default: Date.now },
})

metricSchema.index({ projectId: 1, timestamp: -1 })
metricSchema.index({ projectId: 1, resourceType: 1, timestamp: -1 })

module.exports = mongoose.models.Metric || mongoose.model("Metric", metricSchema)
