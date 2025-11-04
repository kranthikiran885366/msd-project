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
import { AlertCircle, Github, Loader2, Search } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function GitHubImportDialog({ open, onOpenChange, onRepositorySelected }) {
  const [repos, setRepos] = useState([]);
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // Check GitHub connection status
  useEffect(() => {
    if (open) {
      checkConnection();
      // Check if user just returned from OAuth
      if (typeof window !== 'undefined') {
        const isPending = sessionStorage.getItem('github-import-pending');
        if (isPending) {
          sessionStorage.removeItem('github-import-pending');
          // Give it a moment for the connection to be established
          setTimeout(() => {
            checkConnection();
          }, 1000);
        }
      }
    }
  }, [open]);

  const checkConnection = async () => {
    try {
      const status = await apiClient.getGitHubConnectionStatus();
      setConnectionStatus(status);
      if (status.connected) {
        fetchRepositories();
      }
    } catch (err) {
      console.error('Failed to check GitHub connection:', err);
      setConnectionStatus({ connected: false });
    }
  };

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getGitHubRepositories();
      setRepos(data || []);
      setFilteredRepos(data || []);
    } catch (err) {
      console.error('Failed to fetch repositories:', err);
      setError(err.message || 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredRepos(repos);
    } else {
      setFilteredRepos(
        repos.filter(
          repo =>
            repo.name.toLowerCase().includes(query.toLowerCase()) ||
            repo.fullName.toLowerCase().includes(query.toLowerCase()) ||
            (repo.description && repo.description.toLowerCase().includes(query.toLowerCase()))
        )
      );
    }
  };

  const handleSelectRepo = async (repo) => {
    setSelectedRepo(repo);
    setSelectedBranch(null);
    setBranches([]);

    try {
      setLoadingBranches(true);
      const branchData = await apiClient.getGitHubRepositoryBranches(repo.owner, repo.name);
      setBranches(branchData || []);
      // Auto-select default branch
      const defaultBranch = branchData.find(b => b.name === repo.defaultBranch);
      if (defaultBranch) {
        setSelectedBranch(defaultBranch);
      } else if (branchData.length > 0) {
        setSelectedBranch(branchData[0]);
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      setError('Failed to load branches');
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleImport = () => {
    if (selectedRepo && selectedBranch) {
      onRepositorySelected({
        repository: selectedRepo,
        branch: selectedBranch,
      });
      onOpenChange(false);
    }
  };

  const handleConnectGitHub = () => {
    // Store the current dialog state in sessionStorage so we can return to it
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('github-import-pending', 'true');
      sessionStorage.setItem('github-import-redirect', window.location.href);
      // Redirect to OAuth flow
      window.location.href = '/auth/github';
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Import from GitHub
          </DialogTitle>
          <DialogDescription>
            Select a repository and branch to deploy
          </DialogDescription>
        </DialogHeader>

        {/* GitHub Connection Status */}
        {!connectionStatus?.connected ? (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex flex-col items-center text-center gap-4">
              <Github className="w-12 h-12 text-blue-600" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Connect GitHub Account</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Connect your GitHub account to import repositories
                </p>
              </div>
              <Button onClick={handleConnectGitHub} size="lg">
                <Github className="w-4 h-4 mr-2" />
                Connect GitHub
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Connected Status */}
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full" />
                <span className="text-sm font-medium text-green-800">
                  Connected as: {connectionStatus.username}
                </span>
              </div>
              <img
                src={connectionStatus.avatar}
                alt={connectionStatus.username}
                className="w-6 h-6 rounded-full"
              />
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
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

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {/* Repositories List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredRepos.length > 0 ? (
                    filteredRepos.map(repo => (
                      <Card
                        key={repo.id}
                        className={`p-3 cursor-pointer transition ${
                          selectedRepo?.id === repo.id
                            ? 'bg-blue-50 border-blue-300'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleSelectRepo(repo)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">
                              {repo.fullName}
                            </h4>
                            {repo.description && (
                              <p className="text-xs text-gray-600 truncate">
                                {repo.description}
                              </p>
                            )}
                            <div className="flex gap-3 mt-2 text-xs text-gray-500">
                              {repo.language && (
                                <span className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                                  {repo.language}
                                </span>
                              )}
                              <span>★ {repo.stars}</span>
                              <span>Branch: {repo.defaultBranch}</span>
                            </div>
                          </div>
                          {repo.isPrivate && (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                              Private
                            </span>
                          )}
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      {searchQuery ? 'No repositories found' : 'No repositories available'}
                    </div>
                  )}
                </div>

                {/* Branch Selection */}
                {selectedRepo && (
                  <Card className="p-4 bg-gray-50 border-gray-200">
                    <label className="block text-sm font-medium mb-2">Select Branch</label>
                    {loadingBranches ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <select
                        value={selectedBranch?.name || ''}
                        onChange={(e) => {
                          const branch = branches.find(b => b.name === e.target.value);
                          setSelectedBranch(branch);
                        }}
                        className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                      >
                        <option value="">Choose a branch...</option>
                        {branches.map(branch => (
                          <option key={branch.name} value={branch.name}>
                            {branch.name}
                            {branch.name === selectedRepo.defaultBranch && ' (default)'}
                          </option>
                        ))}
                      </select>
                    )}
                  </Card>
                )}

                {/* Import Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!selectedRepo || !selectedBranch || loadingBranches}
                    className="flex-1"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    Import Repository
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
