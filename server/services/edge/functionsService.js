/**
 * Edge Functions Service
 * Deploy and manage serverless functions at global edge locations
 * Uses Knative Serving + KNative Eventing for automatic scaling
 */

const kubernetes = require('@kubernetes/client-node');
const fs = require('fs');
const path = require('path');
const postgres = require('../db/postgres');
const redis = require('../cache/redis');
const yaml = require('js-yaml');

class EdgeFunctionsService {
  constructor() {
    this.kc = new kubernetes.KubeConfig();
    this.kc.loadFromDefault();
    this.k8sApi = this.kc.makeApiClient(kubernetes.AppsV1Api);
    this.customApi = this.kc.makeApiClient(kubernetes.CustomObjectsApi);
  }

  /**
   * DEPLOY EDGE FUNCTION
   * Deploy serverless function to Knative
   */
  async deployEdgeFunction(projectId, functionConfig) {
    try {
      const {
        name,
        runtime, // node18, python311, go121, rust
        code,
        environment,
        memory, // 128-3008 MB
        timeout, // 30-900 seconds
        concurrency // 1-1000
      } = functionConfig;

      // Validate inputs
      if (!['node18', 'python311', 'go121', 'rust'].includes(runtime)) {
        throw new Error(`Unsupported runtime: ${runtime}`);
      }

      // Create Docker image with function code
      const imageName = `${process.env.REGISTRY_URL}/${projectId}/function-${name}:latest`;
      const dockerfile = this._generateDockerfile(runtime, code);
      
      // Build image (simplified - in production use Kaniko in cluster)
      await this._buildImage(dockerfile, imageName);

      // Create Knative Service manifest
      const knativeService = {
        apiVersion: 'serving.knative.dev/v1',
        kind: 'Service',
        metadata: {
          name: `function-${name}`,
          namespace: `project-${projectId}`,
          labels: {
            'project-id': projectId,
            'function-name': name
          }
        },
        spec: {
          template: {
            metadata: {
              annotations: {
                'autoscaling.knative.dev/minScale': '0',
                'autoscaling.knative.dev/maxScale': '1000',
                'autoscaling.knative.dev/target': '70',
                'client.knative.dev/user-image': imageName
              }
            },
            spec: {
              containerConcurrency: concurrency,
              timeoutSeconds: timeout,
              containers: [{
                image: imageName,
                ports: [{ containerPort: 8080 }],
                env: Object.entries(environment || {}).map(([key, value]) => ({
                  name: key,
                  value: String(value)
                })),
                resources: {
                  limits: {
                    memory: `${memory}Mi`,
                    cpu: `${Math.ceil(memory / 256)}000m` // ~1 CPU per 256MB
                  },
                  requests: {
                    memory: `${Math.ceil(memory * 0.8)}Mi`,
                    cpu: `${Math.ceil(memory / 512)}000m`
                  }
                },
                livenessProbe: {
                  httpGet: {
                    path: '/health',
                    port: 8080
                  },
                  initialDelaySeconds: 5,
                  periodSeconds: 10
                }
              }],
              affinity: {
                // Distribute across nodes
                podAntiAffinity: {
                  preferredDuringSchedulingIgnoredDuringExecution: [{
                    weight: 100,
                    podAffinityTerm: {
                      labelSelector: {
                        matchExpressions: [{
                          key: 'function-name',
                          operator: 'In',
                          values: [name]
                        }]
                      },
                      topologyKey: 'kubernetes.io/hostname'
                    }
                  }]
                }
              }
            }
          },
          traffic: [{
            percent: 100,
            latestRevision: true
          }]
        }
      };

      // Create Knative Service
      await this.customApi.createNamespacedCustomObject(
        'serving.knative.dev',
        'v1',
        `project-${projectId}`,
        'services',
        knativeService
      );

      // Get service endpoint
      let endpoint = null;
      let retries = 30; // Wait up to 30s
      while (!endpoint && retries > 0) {
        try {
          const svc = await this.customApi.getNamespacedCustomObject(
            'serving.knative.dev',
            'v1',
            `project-${projectId}`,
            'services',
            `function-${name}`
          );
          endpoint = svc.status?.url;
          if (endpoint) break;
        } catch (e) {
          // Not ready yet
        }
        await new Promise(r => setTimeout(r, 1000));
        retries--;
      }

      // Save function metadata
      await postgres.query(
        `INSERT INTO edge_functions (project_id, name, runtime, memory, timeout, concurrency, endpoint, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')`,
        [projectId, name, runtime, memory, timeout, concurrency, endpoint]
      );

      return {
        functionId: `${projectId}-${name}`,
        name,
        endpoint,
        runtime,
        memory,
        timeout,
        concurrency,
        deployedAt: new Date()
      };
    } catch (error) {
      console.error('Deploy edge function error:', error);
      throw error;
    }
  }

  /**
   * INVOKE EDGE FUNCTION
   * Call function and track metrics
   */
  async invokeFunction(projectId, functionName, payload, context = {}) {
    try {
      // Get function details
      const func = await postgres.query(
        `SELECT * FROM edge_functions 
        WHERE project_id = $1 AND name = $2`,
        [projectId, functionName]
      );

      if (!func.rows[0]) {
        throw new Error(`Function not found: ${functionName}`);
      }

      const endpoint = func.rows[0].endpoint;
      const startTime = Date.now();

      // Add request to distributed tracing
      const traceId = context.traceId || `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const spanId = `span-${Math.random().toString(36).substr(2, 9)}`;

      // Invoke function with timeout
      const axios = require('axios');
      const response = await axios.post(`${endpoint}/invoke`, payload, {
        timeout: (func.rows[0].timeout || 30) * 1000,
        headers: {
          'X-Trace-ID': traceId,
          'X-Span-ID': spanId,
          'Content-Type': 'application/json'
        }
      });

      const duration = Date.now() - startTime;

      // Record invocation metric
      await postgres.query(
        `INSERT INTO function_invocations (function_id, duration_ms, status, result_size, invoked_at)
        VALUES ($1, $2, $3, $4, NOW())`,
        [func.rows[0].id, duration, 200, JSON.stringify(response.data).length]
      );

      // Track in prometheus
      await this._recordMetric('function_invocation_duration_ms', duration, {
        project_id: projectId,
        function_name: functionName,
        status: 'success'
      });

      return {
        data: response.data,
        duration,
        traceId,
        billable: {
          invocations: 1,
          computeTimeMs: duration,
          memoryAllocatedMb: func.rows[0].memory
        }
      };
    } catch (error) {
      // Track error metric
      await this._recordMetric('function_invocation_errors', 1, {
        project_id: projectId,
        function_name: functionName,
        error_type: error.code || 'UNKNOWN'
      });

      throw error;
    }
  }

  /**
   * BATCH DEPLOY EDGE FUNCTIONS
   * Deploy function to multiple regions simultaneously
   */
  async deployMultiRegion(projectId, functionConfig, regions) {
    try {
      const deployments = [];

      for (const region of regions) {
        try {
          // Switch K8s context to region
          const context = `${region}-cluster`;
          this.kc.setCurrentContext(context);

          // Deploy to region
          const deployment = await this.deployEdgeFunction(projectId, functionConfig);
          deployment.region = region;
          deployments.push(deployment);
        } catch (error) {
          console.error(`Failed to deploy to region ${region}:`, error.message);
          deployments.push({
            region,
            status: 'failed',
            error: error.message
          });
        }
      }

      // Store multi-region deployment
      await postgres.query(
        `INSERT INTO multi_region_functions (project_id, function_name, regions, deployment_data)
        VALUES ($1, $2, $3, $4)`,
        [projectId, functionConfig.name, JSON.stringify(regions), JSON.stringify(deployments)]
      );

      return {
        functionName: functionConfig.name,
        deployments,
        globalEndpoint: `https://functions-${projectId}.global.example.com/${functionConfig.name}`
      };
    } catch (error) {
      console.error('Multi-region deployment error:', error);
      throw error;
    }
  }

  /**
   * AUTO-SCALING CONFIGURATION
   * Configure KPA (Knative Pod Autoscaler) metrics
   */
  async configureAutoscaling(projectId, functionName, scalingConfig) {
    try {
      const {
        minReplicas = 0,
        maxReplicas = 1000,
        targetConcurrency = 100,
        targetRPS = 1000
      } = scalingConfig;

      const policyPatch = {
        spec: {
          template: {
            metadata: {
              annotations: {
                'autoscaling.knative.dev/minScale': String(minReplicas),
                'autoscaling.knative.dev/maxScale': String(maxReplicas),
                'autoscaling.knative.dev/target': String(targetConcurrency),
                'autoscaling.knative.dev/targetBurstCapacity': String(targetRPS)
              }
            }
          }
        }
      };

      // Patch Knative Service
      await this.customApi.patchNamespacedCustomObject(
        'serving.knative.dev',
        'v1',
        `project-${projectId}`,
        'services',
        `function-${functionName}`,
        policyPatch
      );

      // Save config
      await postgres.query(
        `UPDATE edge_functions 
        SET autoscaling_config = $1 
        WHERE project_id = $2 AND name = $3`,
        [JSON.stringify(scalingConfig), projectId, functionName]
      );

      return { status: 'configured', config: scalingConfig };
    } catch (error) {
      console.error('Autoscaling configuration error:', error);
      throw error;
    }
  }

  /**
   * GET FUNCTION METRICS
   * Real-time metrics for function execution
   */
  async getFunctionMetrics(projectId, functionName, interval = '1h') {
    try {
      const metrics = await postgres.query(
        `SELECT 
          DATE_TRUNC('minute', invoked_at) as minute,
          COUNT(*) as invocation_count,
          AVG(duration_ms) as avg_duration,
          MAX(duration_ms) as max_duration,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration,
          SUM(result_size) as total_result_size
        FROM function_invocations fi
        JOIN edge_functions ef ON fi.function_id = ef.id
        WHERE ef.project_id = $1 
        AND ef.name = $2
        AND fi.invoked_at > NOW() - INTERVAL $3
        GROUP BY DATE_TRUNC('minute', invoked_at)
        ORDER BY minute DESC`,
        [projectId, functionName, interval]
      );

      // Calculate cost
      const func = await postgres.query(
        `SELECT * FROM edge_functions WHERE project_id = $1 AND name = $2`,
        [projectId, functionName]
      );

      if (!func.rows[0]) throw new Error('Function not found');

      const totalInvocations = metrics.rows.reduce((a, b) => a + b.invocation_count, 0);
      const totalComputeMs = metrics.rows.reduce((a, b) => a + (b.avg_duration * b.invocation_count), 0);
      const costPerInvocation = 0.0000002; // $0.0000002 per invocation
      const costPerGB_s = 0.0000166; // $0.0000166 per GB-second
      const memoryGB = func.rows[0].memory / 1024;
      const computeSeconds = totalComputeMs / 1000;

      const estimatedCost = (totalInvocations * costPerInvocation) + (memoryGB * computeSeconds * costPerGB_s);

      return {
        functionName,
        interval,
        metrics: metrics.rows,
        summary: {
          totalInvocations,
          avgDuration: Math.round(metrics.rows.reduce((a, b) => a + b.avg_duration, 0) / metrics.rows.length),
          peakInvocationsPerMin: Math.max(...metrics.rows.map(m => m.invocation_count)),
          estimatedCost: `$${estimatedCost.toFixed(6)}`,
          estimatedCostPerInvocation: `$${(estimatedCost / totalInvocations).toFixed(8)}`
        }
      };
    } catch (error) {
      console.error('Get function metrics error:', error);
      throw error;
    }
  }

  /**
   * DELETE EDGE FUNCTION
   * Gracefully remove function and related resources
   */
  async deleteEdgeFunction(projectId, functionName) {
    try {
      // Delete Knative Service
      await this.customApi.deleteNamespacedCustomObject(
        'serving.knative.dev',
        'v1',
        `project-${projectId}`,
        'services',
        `function-${functionName}`,
        {}
      );

      // Archive metrics
      await postgres.query(
        `UPDATE edge_functions 
        SET status = 'deleted', deleted_at = NOW() 
        WHERE project_id = $1 AND name = $2`,
        [projectId, functionName]
      );

      return { status: 'deleted', functionName };
    } catch (error) {
      console.error('Delete edge function error:', error);
      throw error;
    }
  }

  /**
   * PRIVATE HELPER METHODS
   */

  _generateDockerfile(runtime, code) {
    const baseImages = {
      node18: 'node:18-alpine',
      python311: 'python:3.11-slim',
      go121: 'golang:1.21-alpine',
      rust: 'rust:latest'
    };

    let dockerfile = `FROM ${baseImages[runtime]}\n`;
    dockerfile += `WORKDIR /app\n`;
    dockerfile += `COPY . .\n`;

    switch (runtime) {
      case 'node18':
        dockerfile += `RUN npm install --production\n`;
        dockerfile += `EXPOSE 8080\n`;
        dockerfile += `CMD ["node", "index.js"]\n`;
        break;
      case 'python311':
        dockerfile += `RUN pip install --no-cache-dir -r requirements.txt\n`;
        dockerfile += `EXPOSE 8080\n`;
        dockerfile += `CMD ["python", "app.py"]\n`;
        break;
      case 'go121':
        dockerfile += `RUN go build -o /app/handler .\n`;
        dockerfile += `EXPOSE 8080\n`;
        dockerfile += `CMD ["/app/handler"]\n`;
        break;
      case 'rust':
        dockerfile += `RUN cargo build --release\n`;
        dockerfile += `EXPOSE 8080\n`;
        dockerfile += `CMD ["./target/release/handler"]\n`;
        break;
    }

    return dockerfile;
  }

  async _buildImage(dockerfile, imageName) {
    // In production, use Kaniko in cluster or Buildkit
    console.log(`Building image: ${imageName}`);
    // Simplified - actual implementation would build and push image
    return { status: 'built', imageName };
  }

  async _recordMetric(metricName, value, labels = {}) {
    // Send to Prometheus / monitoring system
    console.log(`Metric: ${metricName} = ${value}`, labels);
  }
}

module.exports = new EdgeFunctionsService();
