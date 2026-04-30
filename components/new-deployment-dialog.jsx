'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Github, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import apiClient from '@/lib/api-client';
import GitHubImportDialog from './github-import-dialog';

const FRAMEWORKS = [
  { value: 'auto',    label: 'Auto Detect' },
  { value: 'Next.js', label: 'Next.js',   install: 'npm install', build: 'npm run build', output: '.next',  start: 'npm start' },
  { value: 'React',   label: 'React (CRA)',install: 'npm install', build: 'npm run build', output: 'build', start: '' },
  { value: 'Vue',     label: 'Vue.js',    install: 'npm install', build: 'npm run build', output: 'dist',  start: '' },
  { value: 'Express', label: 'Express',   install: 'npm install', build: '',              output: '',      start: 'node index.js' },
  { value: 'Other',   label: 'Other',     install: 'npm install', build: '',              output: '',      start: '' },
];

export default function NewDeploymentDialog({ open, onOpenChange, onDeploymentCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGitHubImport, setShowGitHubImport] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    environment: 'production',
    repository: null,
    framework: 'auto',
    installCommand: 'npm install',
    buildCommand: 'npm run build',
    startCommand: '',
    outputDirectory: '',
    rootDirectory: '/',
    envVars: [],
  });

  useEffect(() => {
    if (open) {
      setShowGitHubImport(true);
      if (typeof window !== 'undefined') {
        const isPending = sessionStorage.getItem('github-import-pending');
        if (isPending) {
          sessionStorage.removeItem('github-import-pending');
          setShowGitHubImport(true);
        }
      }
    }
  }, [open]);

  const handleFrameworkChange = (fw) => {
    const preset = FRAMEWORKS.find(f => f.value === fw);
    setFormData(prev => ({
      ...prev,
      framework: fw,
      installCommand: preset?.install ?? prev.installCommand,
      buildCommand:   preset?.build   ?? prev.buildCommand,
      startCommand:   preset?.start   ?? prev.startCommand,
      outputDirectory:preset?.output  ?? prev.outputDirectory,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.repository) { setError('Please select a GitHub repository'); return; }
    if (!formData.projectName.trim()) { setError('Please enter a project name'); return; }

    try {
      setLoading(true);
      setError(null);

      const repo   = formData.repository.repository;
      const branch = formData.repository.branch;
      const slug   = formData.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const project = await apiClient.createProject({
        name: formData.projectName,
        slug,
        framework: formData.framework === 'auto' ? 'Next.js' : formData.framework,
        repository: { provider: 'github', name: repo.name, owner: repo.owner, branch: branch.name },
        buildSettings: {
          installCommand:  formData.installCommand,
          buildCommand:    formData.buildCommand,
          startCommand:    formData.startCommand,
          outputDirectory: formData.outputDirectory,
          rootDirectory:   formData.rootDirectory,
        },
      });

      const deployment = await apiClient.createDeployment({
        projectId:     project._id || project.id,
        environment:   formData.environment,
        gitBranch:     branch.name,
        gitAuthor:     'manual',
        commitMessage: `Deploy ${repo.fullName}@${branch.name}`,
      });

      onDeploymentCreated(project._id || project.id, deployment._id || deployment.id);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to create deployment');
    } finally {
      setLoading(false);
    }
  };

  const handleRepositorySelected = (repoData) => {
    const repoName = repoData.repository.name;
    setFormData(prev => ({ ...prev, repository: repoData, projectName: prev.projectName || repoName }));
    setShowGitHubImport(false);
  };

  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">New Deployment</DialogTitle>
          <DialogDescription>Deploy from GitHub — like Heroku or Render</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Repo selector */}
          <div>
            <label className="block text-sm font-medium mb-2">GitHub Repository</label>
            {formData.repository ? (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
                <div className="flex items-center gap-3">
                  <Github className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-semibold text-sm">{formData.repository.repository.fullName}</p>
                    <p className="text-xs text-muted-foreground">Branch: {formData.repository.branch.name}</p>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowGitHubImport(true)}>Change</Button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowGitHubImport(true)}
                className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition text-left">
                <Github className="w-6 h-6 text-gray-500" />
                <div>
                  <p className="font-medium text-sm">Connect a repository</p>
                  <p className="text-xs text-muted-foreground">Search and import from your GitHub account</p>
                </div>
              </button>
            )}
          </div>

          {/* Project name */}
          <div>
            <label className="block text-sm font-medium mb-1">Project Name</label>
            <Input placeholder="my-app" value={formData.projectName} onChange={set('projectName')} required />
          </div>

          {/* Framework */}
          <div>
            <label className="block text-sm font-medium mb-1">Framework Preset</label>
            <select value={formData.framework} onChange={(e) => handleFrameworkChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm">
              {FRAMEWORKS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          {/* Environment */}
          <div>
            <label className="block text-sm font-medium mb-2">Environment</label>
            <div className="grid grid-cols-3 gap-2">
              {['production', 'staging', 'development'].map(env => (
                <button key={env} type="button" onClick={() => setFormData(p => ({ ...p, environment: env }))}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium capitalize transition ${
                    formData.environment === env ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}>{env}</button>
              ))}
            </div>
          </div>

          {/* Build settings toggle */}
          <div className="border rounded-xl overflow-hidden">
            <button type="button" onClick={() => setShowAdvanced(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition text-sm font-medium">
              <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> Build & Deploy Settings</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="p-4 space-y-4 border-t">
                {[
                  { key: 'rootDirectory',   label: 'Root Directory',    placeholder: '/' },
                  { key: 'installCommand',  label: 'Install Command',   placeholder: 'npm install' },
                  { key: 'buildCommand',    label: 'Build Command',     placeholder: 'npm run build' },
                  { key: 'outputDirectory', label: 'Output Directory',  placeholder: '.next / build / dist' },
                  { key: 'startCommand',    label: 'Start Command',     placeholder: 'npm start / node index.js' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
                    <Input placeholder={placeholder} value={formData[key]} onChange={set(key)} className="font-mono text-sm" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex gap-2 items-start p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={loading || !formData.repository || !formData.projectName.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'Deploying...' : 'Deploy Now'}
            </Button>
          </div>
        </form>

        <GitHubImportDialog open={showGitHubImport} onOpenChange={setShowGitHubImport} onRepositorySelected={handleRepositorySelected} />
      </DialogContent>
    </Dialog>
  );
}
