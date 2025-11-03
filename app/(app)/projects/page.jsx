'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Grid3x3, List, MoreVertical, Activity, Clock, TrendingUp } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function ProjectsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterFramework, setFilterFramework] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('updated');
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getProjectsOverview();
      
      if (!data || !data.projects) {
        console.warn('No projects data received');
        setProjects([]);
        setOverview({
          totalProjects: 0,
          activeProjects: 0,
          avgSuccessRate: '0.0',
          totalBandwidth: '0 GB',
          frameworks: [],
          teams: []
        });
        return;
      }
      
      const transformedProjects = data.projects.map(project => ({
        id: project._id,
        name: project.name,
        description: project.description || 'No description provided',
        framework: project.framework,
        team: 'Development Team',
        status: project.status || 'active',
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
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setProjects([]);
      setOverview({
        totalProjects: 0,
        activeProjects: 0,
        avgSuccessRate: '0.0',
        totalBandwidth: '0 GB',
        frameworks: [],
        teams: []
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    let result = projects;

    if (searchQuery) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

  // Treat the sentinel value 'ALL' as no filter (we cannot use empty string for Select.Item)
  if (filterTeam && filterTeam !== 'ALL') result = result.filter(p => p.team === filterTeam);
  if (filterFramework && filterFramework !== 'ALL') result = result.filter(p => p.framework === filterFramework);
  if (filterStatus && filterStatus !== 'ALL') result = result.filter(p => p.status === filterStatus);

    if (sortBy === 'updated') {
      try {
        result.sort((a, b) => {
          const dateA = new Date(b.lastDeployed);
          const dateB = new Date(a.lastDeployed);
          if (isNaN(dateA) || isNaN(dateB)) {
            return 0;
          }
          return dateA - dateB;
        });
      } catch (error) {
        console.error('Error sorting by date:', error);
      }
    } else if (sortBy === 'name') {
      try {
        result.sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        console.error('Error sorting by name:', error);
      }
    }

    return result;
  }, [projects, searchQuery, filterTeam, filterFramework, filterStatus, sortBy]);

  const teams = overview?.teams || [];
  const frameworks = overview?.frameworks || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-gray-600 mt-1">Manage and monitor all your deployed projects</p>
        </div>
        <Button onClick={() => router.push('/projects/create')}><Plus className="w-4 h-4 mr-2" /> New Project</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-3xl font-bold mt-2">{overview?.totalProjects || 0}</p>
                <p className="text-xs text-green-600 mt-2">✓ {overview?.activeProjects || 0} active</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Success Rate</p>
                <p className="text-3xl font-bold mt-2">{overview?.avgSuccessRate || '0.0'}%</p>
                <p className="text-xs text-gray-600 mt-2">All deployments</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bandwidth</p>
                <p className="text-3xl font-bold mt-2">{overview?.totalBandwidth || '0 GB'}</p>
                <p className="text-xs text-gray-600 mt-2">This month</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Deployments</p>
                <p className="text-3xl font-bold mt-2">{projects.filter(p => p.runningDeployments > 0).length}</p>
                <p className="text-xs text-gray-600 mt-2">Currently running</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Recently Updated</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterFramework} onValueChange={setFilterFramework}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Frameworks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Frameworks</SelectItem>
                  {frameworks.map(fw => (
                    <SelectItem key={fw} value={fw}>{fw}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">Showing {filteredProjects.length} of {projects.length} projects</p>
            <div className="flex gap-2">
              <Button size="sm" variant={viewMode === 'grid' ? 'default' : 'outline'} onClick={() => setViewMode('grid')}>
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button size="sm" variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')}>
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'grid' && (
        <div className="grid grid-cols-3 gap-4">
          {filteredProjects.map(project => (
            <Card key={project.id} className="hover:shadow-lg transition">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge className="mt-2" variant="outline">{project.framework}</Badge>
                  </div>
                  <Button size="sm" variant="ghost"><MoreVertical className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{project.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Status</span>
                    <div className="flex items-center gap-2">
                      {project.isActive && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                      )}
                      <Badge className={getStatusColor(project.status, project.healthStatus)}>
                        {project.isActive ? 'Deploying' : project.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Success Rate</span>
                    <span className={`font-semibold ${getSuccessRateColor(project.successRate)}`}>
                      {project.successRate}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Build Time</span>
                    <span className="font-semibold">{project.buildTime}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Deployments</span>
                    <span className="font-semibold">{project.deployment.totalDeployments}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Last Deploy</span>
                    <span className="font-semibold text-xs">
                      {project.lastDeployed && project.lastDeployed !== 'Never' 
                        ? (() => {
                            try {
                              return new Date(project.lastDeployed).toLocaleDateString();
                            } catch (error) {
                              console.error('Error parsing date:', error);
                              return 'Never';
                            }
                          })()
                        : 'Never'
                      }
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    size="sm" 
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    View Project
                  </Button>
                  {project.isActive && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-orange-600 border-orange-600 hover:bg-orange-50"
                    >
                      Deploying...
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredProjects.map(project => (
            <Card key={project.id} className="hover:bg-gray-50 transition">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{project.name}</p>
                    <p className="text-sm text-gray-600">{project.description}</p>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <p className="text-gray-600">Framework</p>
                      <p className="font-semibold">{project.framework}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <div className="flex items-center gap-2">
                        {project.isActive && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        )}
                        <Badge className={getStatusColor(project.status, project.healthStatus)}>
                          {project.isActive ? 'Deploying' : project.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600">Success Rate</p>
                      <p className="font-semibold">{project.successRate}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        View
                      </Button>
                      {!project.isActive && (
                        <Button size="sm">Deploy</Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper functions
function getStatusColor(status, healthStatus) {
  if (healthStatus === 'critical') return 'bg-red-600';
  if (healthStatus === 'warning') return 'bg-yellow-600';
  if (healthStatus === 'degraded') return 'bg-orange-600';
  if (healthStatus === 'deploying') return 'bg-blue-600';
  if (status === 'active') return 'bg-green-600';
  return 'bg-gray-600';
}

function getSuccessRateColor(successRate) {
  try {
    if (!successRate) return 'text-gray-600';
    const rate = parseFloat(successRate);
    if (isNaN(rate)) {
      console.error('Invalid success rate:', successRate);
      return 'text-gray-600';
    }
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  } catch (error) {
    console.error('Error determining success rate color:', error);
    return 'text-gray-600';
  }
}
