'use strict';
const Project = require('../models/Project');
const { encrypt, decrypt, isEncrypted } = require('../utils/encryption');

// Runtimes we can auto-detect and their defaults
const RUNTIME_DEFAULTS = {
    node:   { installCommand: 'npm install', buildCommand: '', startCommand: 'npm start',    port: 3000 },
    nextjs: { installCommand: 'npm install', buildCommand: 'npm run build', startCommand: 'npm start', port: 3000 },
    react:  { installCommand: 'npm install', buildCommand: 'npm run build', startCommand: '',           port: 80  },
    vue:    { installCommand: 'npm install', buildCommand: 'npm run build', startCommand: '',           port: 80  },
    python: { installCommand: 'pip install -r requirements.txt', buildCommand: '', startCommand: 'python app.py', port: 5000 },
    static: { installCommand: '', buildCommand: '', startCommand: '',                                   port: 80  },
};

class ProjectConfigService {

    // ── Ownership guard ───────────────────────────────────────────────────────

    async _getOwnedProject(projectId, userId) {
        const project = await Project.findById(projectId);
        if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });
        if (String(project.userId) !== String(userId)) {
            throw Object.assign(new Error('Forbidden'), { status: 403 });
        }
        return project;
    }

    // ── Environment variables ─────────────────────────────────────────────────

    /**
     * Replace all env variables for a project.
     * variables: { KEY: { value: '...', isSecret: true/false } }
     *   OR plain object: { KEY: 'value' }
     */
    async setEnvVariables(projectId, userId, variables) {
        const project = await this._getOwnedProject(projectId, userId);

        const envVars = Object.entries(variables).map(([key, entry]) => {
            const isSecret = typeof entry === 'object' ? !!entry.isSecret : false;
            const rawValue = typeof entry === 'object' ? String(entry.value ?? '') : String(entry);
            return {
                key:      key.trim(),
                value:    isSecret ? encrypt(rawValue) : rawValue,
                isSecret,
            };
        });

        project.runtimeConfig = project.runtimeConfig || {};
        project.runtimeConfig.envVariables = envVars;
        project.markModified('runtimeConfig');
        await project.save();

        return this._redactEnvVars(project.runtimeConfig.envVariables);
    }

    /**
     * Upsert a single env variable.
     */
    async upsertEnvVariable(projectId, userId, key, value, isSecret = false) {
        const project = await this._getOwnedProject(projectId, userId);
        project.runtimeConfig = project.runtimeConfig || {};
        const vars = project.runtimeConfig.envVariables || [];

        const idx = vars.findIndex(v => v.key === key.trim());
        const stored = isSecret ? encrypt(String(value)) : String(value);

        if (idx >= 0) {
            vars[idx].value    = stored;
            vars[idx].isSecret = isSecret;
        } else {
            vars.push({ key: key.trim(), value: stored, isSecret });
        }

        project.runtimeConfig.envVariables = vars;
        project.markModified('runtimeConfig');
        await project.save();

        return this._redactEnvVars(project.runtimeConfig.envVariables);
    }

    /**
     * Delete a single env variable by key.
     */
    async deleteEnvVariable(projectId, userId, key) {
        const project = await this._getOwnedProject(projectId, userId);
        project.runtimeConfig = project.runtimeConfig || {};
        const before = (project.runtimeConfig.envVariables || []).length;
        project.runtimeConfig.envVariables = (project.runtimeConfig.envVariables || [])
            .filter(v => v.key !== key);
        project.markModified('runtimeConfig');
        await project.save();
        return { deleted: before !== project.runtimeConfig.envVariables.length };
    }

    /**
     * Get env variables — secrets are redacted (****) for API responses.
     */
    async getEnvVariables(projectId, userId) {
        const project = await this._getOwnedProject(projectId, userId);
        return this._redactEnvVars(project.runtimeConfig?.envVariables || []);
    }

    /**
     * Get DECRYPTED env variables — only called internally by the deployment pipeline.
     * Returns a plain { KEY: VALUE } object ready for injection into Docker.
     */
    async getDecryptedEnvMap(projectId) {
        const project = await Project.findById(projectId).select('runtimeConfig');
        if (!project) return {};
        const vars = project.runtimeConfig?.envVariables || [];
        const map = {};
        for (const v of vars) {
            map[v.key] = v.isSecret ? decrypt(v.value) : v.value;
        }
        return map;
    }

    // ── Runtime configuration ─────────────────────────────────────────────────

    /**
     * Update build/runtime config for a project.
     * Accepted fields: installCommand, buildCommand, startCommand, port, runtime
     */
    async updateRuntimeConfig(projectId, userId, config) {
        const project = await this._getOwnedProject(projectId, userId);
        project.runtimeConfig = project.runtimeConfig || {};

        const allowed = ['installCommand', 'buildCommand', 'startCommand', 'port', 'runtime'];
        for (const field of allowed) {
            if (config[field] !== undefined) {
                project.runtimeConfig[field] = config[field];
            }
        }

        // Sync back to buildSettings for backward compatibility
        if (config.buildCommand !== undefined)   project.buildSettings = { ...project.buildSettings, buildCommand:   config.buildCommand };
        if (config.startCommand !== undefined)   project.buildSettings = { ...project.buildSettings, startCommand:   config.startCommand };
        if (config.installCommand !== undefined) project.buildSettings = { ...project.buildSettings, installCommand: config.installCommand };

        project.markModified('runtimeConfig');
        project.markModified('buildSettings');
        await project.save();

        return this._safeConfig(project.runtimeConfig);
    }

    /**
     * Get runtime config for a project.
     */
    async getRuntimeConfig(projectId, userId) {
        const project = await this._getOwnedProject(projectId, userId);
        return this._safeConfig(project.runtimeConfig || {});
    }

    /**
     * Auto-detect defaults based on framework if commands are not set.
     * Called by deploymentService before queuing a job.
     */
    async resolveDeployConfig(projectId) {
        const project = await Project.findById(projectId)
            .select('framework runtimeConfig buildSettings repository');
        if (!project) throw new Error('Project not found');

        const rc = project.runtimeConfig || {};

        // Determine runtime
        let runtime = rc.runtime || 'auto';
        if (runtime === 'auto') {
            runtime = this._detectRuntime(project.framework);
        }

        const defaults = RUNTIME_DEFAULTS[runtime] || RUNTIME_DEFAULTS.node;

        return {
            runtime,
            installCommand: rc.installCommand || project.buildSettings?.installCommand || defaults.installCommand,
            buildCommand:   rc.buildCommand   || project.buildSettings?.buildCommand   || defaults.buildCommand,
            startCommand:   rc.startCommand   || project.buildSettings?.startCommand   || defaults.startCommand,
            port:           rc.port           || defaults.port,
        };
    }

    // ── Validation ────────────────────────────────────────────────────────────

    /**
     * Validate env variable keys and values before saving.
     * Returns { valid: bool, errors: string[] }
     */
    validateEnvVariables(variables) {
        const errors = [];
        const KEY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

        for (const [key, entry] of Object.entries(variables)) {
            if (!KEY_RE.test(key)) {
                errors.push(`Invalid key "${key}": must match [A-Za-z_][A-Za-z0-9_]*`);
            }
            const value = typeof entry === 'object' ? entry.value : entry;
            if (value === null || value === undefined) {
                errors.push(`Key "${key}" has a null/undefined value`);
            }
        }

        return { valid: errors.length === 0, errors };
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    _redactEnvVars(vars) {
        return (vars || []).map(v => ({
            key:      v.key,
            value:    v.isSecret ? '****' : v.value,
            isSecret: v.isSecret,
        }));
    }

    _safeConfig(rc) {
        return {
            installCommand: rc.installCommand || '',
            buildCommand:   rc.buildCommand   || '',
            startCommand:   rc.startCommand   || '',
            runtime:        rc.runtime        || 'auto',
            port:           rc.port           || 3000,
        };
    }

    _detectRuntime(framework) {
        if (!framework) return 'node';
        const f = framework.toLowerCase();
        if (f.includes('next'))   return 'nextjs';
        if (f.includes('react'))  return 'react';
        if (f.includes('vue'))    return 'vue';
        if (f.includes('svelte')) return 'react'; // same build pattern
        if (f.includes('python')) return 'python';
        return 'node';
    }
}

module.exports = new ProjectConfigService();
