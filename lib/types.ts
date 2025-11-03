export interface Deployment {
  id: string;
  projectId: string;
  project?: string;
  version?: string;
  status: 'Building' | 'Running' | 'Failed' | 'success' | 'failed';
  createdAt?: string;
  time?: string;
}

export interface Project {
  id: string;
  name: string;
  status: string;
}

export interface Database {
  id: string;
  name: string;
  status: string;
}

export interface Function {
  id: string;
  name: string;
  enabled: boolean;
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
}

export interface MetricsData {
  buildTime?: {
    value: string;
    change: string;
    positive: boolean;
  };
  cacheHitRate?: {
    value: string;
    change: string;
    positive: boolean;
  };
  deploySuccess?: {
    value: number;
    change: string;
    positive: boolean;
  };
}

export interface HealthData {
  statusCode: number;
  status: 'healthy' | 'degraded';
  metrics: {
    responseTime: {
      avg: number;
    };
    bandwidth?: number;
  };
}