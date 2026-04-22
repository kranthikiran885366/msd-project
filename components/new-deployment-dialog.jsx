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
import { AlertCircle, Github, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import apiClient from '@/lib/api-client';
import GitHubImportDialog from './github-import-dialog';

export default function NewDeploymentDialog({ open, onOpenChange, onDeploymentCreated }) {
  const [step, setStep]                   = useState('select');   // select | configure | deploying | done
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [showGitHubImport, setShowGitHubImport] = useState(false);
  const [selectedRepo, setSelectedRepo]   = useState(null);       // { repository, branch }
  const [projectName, setProjectName]     = useState('');
  const [environment, setEnvironment]     = useState('production');
  const [result, setResult]               = useState(null);       // { project, deployment }

  // Auto-open GitHub picker on mount
  useEffect(() => {
    if (open && step === 'select') {
      setShowGitHubImport(true);
    }
  }, [open]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setStep('select');
      setSelectedRepo(null);
      setProjectName('');
      setError(null);
      setResult(null);
    }
  }, [open]);

  const handleRepositorySelected = (repoData) => {
    setSelectedRepo(repoData);
    setProjectName(repoData.repository.name);
    setShowGitHubImport(false);
    setStep('configure');
  };

  const handleDeploy = async () => {
    if (!selectedRepo) { setError('Please select a repository'); return; }
    if (!projectName.trim()) { setError('Project name is required'); return; }

    setLoading(true);
    setError(null);
    setStep('deploying');

    try {
      const repo   = selectedRepo.repository;
      const branch = selectedRepo.branch;

      // Use importRepository — single endpoint that:
      // 1. Creates the project with full repo metadata (owner, name, url, branch)
      // 2. Sets up GitHub push webhook for auto-deploy
      // 3. Triggers the initial deployment immediately
      const data = await apiClient.request('/github-provider/import', {
        method: 'POST',
        body: JSON.stringify({
          repoFullName:       repo.fullName,
          branch:             branch.name,
          framework:          detectFramework(repo),
          buildCommand:       'npm run build',
          outputDirectory:    'out',
          environmentVariables: [],
        }),
      });

      setResult(data);
      setStep('done');

      // Notify parent — navigate to deployment detail page
      if (onDeploymentCreated) {
        onDeploymentCreated(
          data.project?._id || data.project?.id,
          data.deployment?._id || data.deployment?.id
        );
      }
    } catch (err) {
      console.error('Deploy failed:', err);
      setError(err.message || 'Deployment failed. Please try again.');
      setStep('configure');
    } finally {
      setLoading(false);
    }
  };

  // Simple framework detection from repo language / name
  function detectFramework(repo) {
    const name = (repo.name || '').toLowerCase();
    const lang = (repo.language || '').toLowerCase();
    if (name.includes('next') || lang === 'typescript') return 'nextjs';
    if (lang === 'python') return 'python';
    if (lang === 'javascript') return 'node';
    return 'nextjs';
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">New Deployment</DialogTitle>
          <DialogDescription>
            Deploy from GitHub — like Heroku or Render
          </DialogDescription>
        </DialogHeader>

        {/* ── Step: configure ─────────────────────────────────────────── */}
        {(step === 'configure' || step === 'select') && (
          <form
            onSubmit={(e) => { e.preventDefault(); handleDeploy(); }}
            className="space-y-5"
          >
            {/* Repo selector */}
            <div>
              <label className="block text-sm font-medium mb-2">GitHub Repository</label>
              {selectedRepo ? (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
                  <div className="flex items-center gap-3">
                    <Github className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-semibold text-sm">{selectedRepo.repository.fullName}</p>
                      <p className="text-xs text-muted-foreground">Branch: {selectedRepo.branch.name}</p>
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowGitHubImport(true)}>
                    Change
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowGitHubImport(true)}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition text-left"
                >
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
              <label className="block text-sm font-medium mb-2">Project Name</label>
              <Input
                placeholder="my-app"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Auto-filled from repo name.</p>
            </div>

            {/* Environment */}
            <div>
              <label className="block text-sm font-medium mb-2">Environment</label>
              <div className="grid grid-cols-3 gap-2">
                {['production', 'staging', 'development'].map((env) => (
                  <button
                    key={env}
                    type="button"
                    onClick={() => setEnvironment(env)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium capitalize transition ${
                      environment === env
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex gap-2 items-start p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedRepo || !projectName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Deploy Now
              </Button>
            </div>
          </form>
        )}

        {/* ── Step: deploying ─────────────────────────────────────────── */}
        {step === 'deploying' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="font-semibold text-lg">Deploying {projectName}…</p>
            <p className="text-sm text-muted-foreground text-center">
              Cloning repo, building Docker image, starting container.
            </p>
          </div>
        )}

        {/* ── Step: done ──────────────────────────────────────────────── */}
        {step === 'done' && result && (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="font-semibold text-lg">Deployment triggered!</p>
            <p className="text-sm text-muted-foreground text-center">
              Your app is building. You'll be redirected to the live deployment log.
            </p>
            {result.deployment?.productionUrl && (
              <a
                href={result.deployment.productionUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                {result.deployment.productionUrl}
              </a>
            )}
            <Button onClick={() => onOpenChange(false)} className="mt-2">
              Close
            </Button>
          </div>
        )}
      </DialogContent>

      <GitHubImportDialog
        open={showGitHubImport}
        onOpenChange={setShowGitHubImport}
        onRepositorySelected={handleRepositorySelected}
      />
    </Dialog>
  );
}
