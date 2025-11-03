import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';

export function useProjectsRealtime(refreshInterval = 30000) {
  const [projects, setProjects] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      const data = await apiClient.getProjectsOverview();
      
      // Transform backend data
      const transformedProjects = data.projects.map(project => ({
        id: project._id,
        name: project.name,
        description: project.description || 'No description provided',
        framework: project.framework,
        team: 'Development Team',
        status: project.status,
        lastDeployed: project.lastDeployment 
          ? new Date(project.lastDeployment.createdAt).toLocaleString() 
          : 'Never',
        deployedBy: project.lastDeployment?.triggeredBy || 'System',
        domains: project.stats?.environments || 0,
        buildTime: project.stats?.avgBuildTime ? `${project.stats.avgBuildTime}s` : 'N/A',
        successRate: `${project.stats?.successRate || 100}%`,
        monthlyBandwidth: project.stats?.monthlyBandwidth || '0 GB',
        deployment: { 
          lastStatus: project.lastDeployment?.status || 'none', 
          totalDeployments: project.stats?.totalDeployments || 0 
        },
        healthStatus: project.stats?.healthStatus || 'healthy',
        isActive: project.stats?.isActive || false,
        runningDeployments: project.stats?.runningDeployments || 0
      }));
      
      setProjects(transformedProjects);
      setOverview({
        totalProjects: data.totalProjects,
        activeProjects: data.activeProjects,
        avgSuccessRate: data.avgSuccessRate,
        totalBandwidth: data.totalBandwidth,
        frameworks: data.frameworks,
        teams: data.teams
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError(err.message);
      // Fallback to empty state on error
      if (projects.length === 0) {
        setProjects([]);
        setOverview({
          totalProjects: 0,
          activeProjects: 0,
          avgSuccessRate: '0.0',
          totalBandwidth: '0 GB',
          frameworks: [],
          teams: []
        });
      }
    } finally {
      setLoading(false);
    }
  }, [projects.length]);

  // Initial fetch
  useEffect(() => {
    fetchProjects();
  }, []);

  // Set up polling for real-time updates
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      // Only refresh if there are active deployments or if it's been a while
      const hasActiveDeployments = projects.some(p => p.isActive);
      const timeSinceLastUpdate = lastUpdated ? Date.now() - lastUpdated.getTime() : Infinity;
      
      if (hasActiveDeployments || timeSinceLastUpdate > refreshInterval) {
        fetchProjects();
      }
    }, Math.min(refreshInterval, 10000)); // Check every 10 seconds max

    return () => clearInterval(interval);
  }, [refreshInterval, projects, lastUpdated, fetchProjects]);

  // Manual refresh function
  const refresh = useCallback(() => {
    setLoading(true);
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    overview,
    loading,
    error,
    lastUpdated,
    refresh,
    hasActiveDeployments: projects.some(p => p.isActive)
  };
}