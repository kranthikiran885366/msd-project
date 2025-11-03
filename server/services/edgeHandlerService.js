const EdgeHandler = require('../models/EdgeHandler');
const { Worker } = require('worker_threads');
const path = require('path');

class EdgeHandlerService {
  async createHandler(handlerData) {
    const handler = new EdgeHandler(handlerData);
    return handler.save();
  }

  async listHandlers() {
    return EdgeHandler.find().sort({ createdAt: -1 });
  }

  async getHandler(id) {
    return EdgeHandler.findById(id);
  }

  async updateHandler(id, updates) {
    return EdgeHandler.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteHandler(id) {
    return EdgeHandler.findByIdAndDelete(id);
  }

  async deployHandler(id) {
    const handler = await EdgeHandler.findById(id);
    if (!handler) {
      throw new Error('Handler not found');
    }

    try {
      // Here you would deploy the handler to your edge network
      // This is a placeholder for actual deployment logic
      await this._validateHandler(handler.code);
      return handler.deploy();
    } catch (error) {
      handler.status = 'error';
      await handler.save();
      throw error;
    }
  }

  async testHandler(id, testRequest) {
    const handler = await EdgeHandler.findById(id);
    if (!handler) {
      throw new Error('Handler not found');
    }

    try {
      const startTime = Date.now();
      const result = await this._runHandlerInSandbox(handler.code, testRequest);
      const endTime = Date.now();

      const testResult = {
        success: true,
        response: result,
        performance: {
          responseTime: endTime - startTime,
          coldStart: result.coldStart || 0,
          memory: result.memoryUsage || 0,
        },
      };

      await handler.recordTest(testResult);
      return testResult;
    } catch (error) {
      const testResult = {
        success: false,
        error: error.message,
      };
      await handler.recordTest(testResult);
      throw error;
    }
  }

  async _validateHandler(code) {
    try {
      // Basic syntax validation
      new Function(code);
      return true;
    } catch (error) {
      throw new Error(`Invalid handler code: ${error.message}`);
    }
  }

  async _runHandlerInSandbox(code, request) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(
        path.join(__dirname, '../utils/edge-handler-sandbox.js'),
        {
          workerData: { code, request },
        }
      );

      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }
}

module.exports = Object.freeze(new EdgeHandlerService());