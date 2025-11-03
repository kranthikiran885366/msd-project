'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, Github } from 'lucide-react';
import apiClient from '@/lib/api-client';
import GitHubImportDialog from './github-import-dialog';

export default function NewDeploymentDialog({ open, onOpenChange, onDeploymentCreated }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGitHubImport, setShowGitHubImport] = useState(false);
  const [deploymentSource, setDeploymentSource] = useState('manual'); // 'manual' or 'github'
  const [formData, setFormData] = useState({
    projectId: '',
    environment: 'staging',
    branch: 'main',
    repository: null,
  });

  useEffect(() => {
    if (open) {
      fetchProjects();
    }
  }, [open]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getProjects();
      setProjects(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.projectId) {
      setError('Please select a project');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const deploymentData = {
        projectId: formData.projectId,
        environment: formData.environment,
        branch: deploymentSource === 'github' ? formData.repository?.branch?.name : formData.branch,
      };

      // Add GitHub info if from GitHub
      if (deploymentSource === 'github' && formData.repository) {
        deploymentData.repository = {
          url: formData.repository.repository.url,
          fullName: formData.repository.repository.fullName,
          branch: formData.repository.branch.name,
          owner: formData.repository.repository.owner,
        };
      }

      await apiClient.createDeployment(deploymentData);
      
      // Success - notify parent and close dialog
      onDeploymentCreated();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to create deployment:', err);
      setError(err.message || 'Failed to create deployment');
    } finally {
      setLoading(false);
    }
  };

  const handleRepositorySelected = (repoData) => {
    setFormData({
      ...formData,
      repository: repoData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Deployment</DialogTitle>
          <DialogDescription>
            Create a new deployment for your project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Deployment Source Tabs */}
          <div className="flex gap-2 border-b">
            <button
              type="button"
              onClick={() => {
                setDeploymentSource('manual');
                setFormData({ ...formData, repository: null });
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                deploymentSource === 'manual'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Manual
            </button>
            <button
              type="button"
              onClick={() => setDeploymentSource('github')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
                deploymentSource === 'github'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Github className="w-4 h-4" />
              GitHub
            </button>
          </div>

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Project</label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-3 py-2 border rounded-md bg-white text-sm"
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project._id || project.id} value={project._id || project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* GitHub Import */}
          {deploymentSource === 'github' && (
            <div>
              <label className="block text-sm font-medium mb-2">GitHub Repository</label>
              {formData.repository ? (
                <Card className="p-3 bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{formData.repository.repository.fullName}</p>
                      <p className="text-xs text-gray-600">Branch: {formData.repository.branch.name}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowGitHubImport(true)}
                    >
                      Change
                    </Button>
                  </div>
                </Card>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGitHubImport(true)}
                  className="w-full"
                >
                  <Github className="w-4 h-4 mr-2" />
                  Select GitHub Repository
                </Button>
              )}
            </div>
          )}

          {/* Manual Branch Input */}
          {deploymentSource === 'manual' && (
            <div>
              <label className="block text-sm font-medium mb-2">Branch</label>
              <Input
                type="text"
                placeholder="e.g., main, develop, feature/xyz"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              />
            </div>
          )}

          {/* Environment Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Environment</label>
            <select
              value={formData.environment}
              onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
              className="w-full px-3 py-2 border rounded-md bg-white text-sm"
            >
              <option value="staging">Staging</option>
              <option value="production">Production</option>
              <option value="development">Development</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="p-3 bg-red-50 border-red-200">
              <div className="flex gap-2 items-start">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </Card>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.projectId || (deploymentSource === 'github' && !formData.repository)}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Deployment'}
            </Button>
          </div>
        </form>

        {/* GitHub Import Dialog */}
        <GitHubImportDialog
          open={showGitHubImport}
          onOpenChange={setShowGitHubImport}
          onRepositorySelected={handleRepositorySelected}
        />
      </DialogContent>
    </Dialog>
  );
}
