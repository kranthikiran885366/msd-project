'use strict';
// Project Model
const mongoose = require('mongoose');

const deployLockSchema = new mongoose.Schema({
    enabled:  { type: Boolean, default: false },
    reason:   String,
    lockedAt: Date,
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const repositorySchema = new mongoose.Schema({
    provider:    { type: String, enum: ['github', 'gitlab', 'bitbucket'], required: true },
    name:        { type: String, required: true },
    fullName:    String,   // owner/repo
    owner:       { type: String, required: true },
    branch:      { type: String, default: 'main' },
    url:         String,   // https clone URL — used by workers to clone
    isPrivate:   { type: Boolean, default: false },
    webhookId:   String,
    webhookSecret: String, // HMAC secret for push-event verification
    deployOnPush:{ type: Boolean, default: true },
    autoBuild:   { type: Boolean, default: true },
    buildCommand:    String,
    outputDirectory: String,
    environmentVariables: [{
        key:      String,
        value:    String,
        isSecret: { type: Boolean, default: false },
    }],
});

const scheduledDeploymentSchema = new mongoose.Schema({
    cronExpression: { type: String, required: true },
    branch:      String,
    environment: { type: String, enum: ['production', 'staging', 'preview'], default: 'production' },
    enabled:     { type: Boolean, default: true },
    nextRun:     Date,
    lastRun:     Date,
});

// ── NEW: per-variable schema used by runtimeConfig.envVariables ──────────────
const envVarSchema = new mongoose.Schema({
    key:      { type: String, required: true, trim: true },
    // value is stored encrypted when isSecret=true; plaintext otherwise
    value:    { type: String, default: '' },
    isSecret: { type: Boolean, default: false },
}, { _id: false });

const projectSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        description: String,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        framework: {
            type: String,
            enum: ['Next.js', 'Express', 'React', 'Vue', 'Svelte', 'Other'],
            default: 'Next.js',
        },
        repository:          repositorySchema,
        deployLock:          deployLockSchema,
        scheduledDeployments:[scheduledDeploymentSchema],

        buildSettings: {
            nodeVersion:      String,
            installCommand:   String,
            buildCommand:     String,
            startCommand:     String,
            outputDirectory:  String,
            rootDirectory:    { type: String, default: '/' },
            environmentVariables: [{
                key:      String,
                value:    String,
                isSecret: { type: Boolean, default: false },
            }],
        },

        // ── NEW: runtime configuration ────────────────────────────────────────
        runtimeConfig: {
            // Build pipeline
            installCommand: { type: String, default: '' },
            buildCommand:   { type: String, default: '' },
            startCommand:   { type: String, default: '' },
            // Runtime
            runtime: {
                type: String,
                enum: ['node', 'python', 'static', 'docker', 'auto'],
                default: 'auto',
            },
            // Port the app listens on inside the container
            port: { type: Number, default: 3000 },
            // Environment variables (values encrypted at rest for secrets)
            envVariables: [envVarSchema],
        },

        deploymentSettings: {
            autoDeploy:         { type: Boolean, default: true },
            autoAlias:          { type: Boolean, default: true },
            deploymentRegions:  [String],
            productionBranch:   { type: String, default: 'main' },
            stagingBranch:      { type: String, default: 'staging' },
            previewsEnabled:    { type: Boolean, default: true },
            previewExpiry:      { type: Number, default: 7 },
            region: {
                type: String,
                enum: ['iad1', 'fra1', 'sfo1', 'sin1'],
                default: 'iad1',
            },
        },

        features: {
            canaryDeployments: { type: Boolean, default: false },
            buildCache:        { type: Boolean, default: true },
            autoScaling:       { type: Boolean, default: false },
            customHeaders:     { type: Boolean, default: false },
        },

        status: {
            type: String,
            enum: ['active', 'paused', 'archived'],
            default: 'active',
        },
        lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true },
);

// Indexes
projectSchema.index({ slug: 1 });
projectSchema.index({ userId: 1 });
projectSchema.index({ 'repository.provider': 1, 'repository.owner': 1, 'repository.name': 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });

// Slug generation middleware (unchanged)
projectSchema.pre('save', function (next) {
    if (!this.slug) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    const addSuffix = async (suffix = 0) => {
        const newSlug = suffix === 0 ? this.slug : `${this.slug}-${suffix}`;
        const existing = await mongoose.models.Project.findOne({ slug: newSlug });
        if (!existing || existing._id.equals(this._id)) {
            this.slug = newSlug;
            next();
        } else {
            addSuffix(suffix + 1);
        }
    };
    addSuffix();
});

module.exports = mongoose.model('Project', projectSchema);
