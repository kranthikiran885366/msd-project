const axios = require('axios');
const GitHubIntegration = require('../models/GitHubIntegration');

const GITHUB_API_BASE = 'https://api.github.com';

class GitHubProviderController {
  // Get user's GitHub repositories
  static async getRepositories(req, res) {
    try {
      const userId = req.user._id;
      const integration = await GitHubIntegration.findOne({ userId });

      if (!integration) {
        return res.status(404).json({ error: 'GitHub integration not connected' });
      }

      const response = await axios.get(`${GITHUB_API_BASE}/user/repos`, {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        params: {
          sort: 'updated',
          per_page: 100,
        },
      });

      const repos = response.data.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        owner: repo.owner.login,
        isPrivate: repo.private,
        language: repo.language,
        topics: repo.topics || [],
        stars: repo.stargazers_count,
        defaultBranch: repo.default_branch,
      }));

      res.json(repos);
    } catch (error) {
      console.error('Failed to fetch repositories:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: error.response?.data?.message || 'Failed to fetch repositories',
      });
    }
  }

  // Get repository details
  static async getRepositoryDetails(req, res) {
    try {
      const userId = req.user._id;
      const { owner, repo } = req.params;
      const integration = await GitHubIntegration.findOne({ userId });

      if (!integration) {
        return res.status(404).json({ error: 'GitHub integration not connected' });
      }

      const response = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      const data = response.data;
      res.json({
        id: data.id,
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        url: data.html_url,
        owner: data.owner.login,
        isPrivate: data.private,
        language: data.language,
        topics: data.topics || [],
        stars: data.stargazers_count,
        forks: data.forks_count,
        defaultBranch: data.default_branch,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        pushedAt: data.pushed_at,
        size: data.size,
        hasIssues: data.has_issues,
        hasPages: data.has_pages,
        homepage: data.homepage,
      });
    } catch (error) {
      console.error('Failed to fetch repository details:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: error.response?.data?.message || 'Failed to fetch repository details',
      });
    }
  }

  // Get repository branches
  static async getRepositoryBranches(req, res) {
    try {
      const userId = req.user._id;
      const { owner, repo } = req.params;
      const integration = await GitHubIntegration.findOne({ userId });

      if (!integration) {
        return res.status(404).json({ error: 'GitHub integration not connected' });
      }

      const response = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/branches`, {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        params: {
          per_page: 100,
        },
      });

      const branches = response.data.map(branch => ({
        name: branch.name,
        commit: branch.commit.sha.substring(0, 7),
        commitUrl: branch.commit.url,
        protected: branch.protected,
      }));

      res.json(branches);
    } catch (error) {
      console.error('Failed to fetch branches:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: error.response?.data?.message || 'Failed to fetch branches',
      });
    }
  }

  // Get repository file content
  static async getRepositoryFile(req, res) {
    try {
      const userId = req.user._id;
      const { owner, repo, path } = req.params;
      const { ref } = req.query;
      const integration = await GitHubIntegration.findOne({ userId });

      if (!integration) {
        return res.status(404).json({ error: 'GitHub integration not connected' });
      }

      const params = { per_page: 100 };
      if (ref) params.ref = ref;

      const response = await axios.get(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`,
        {
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
            Accept: 'application/vnd.github.v3.raw+json',
          },
          params,
        }
      );

      // If it's a directory, return list of files
      if (Array.isArray(response.data)) {
        const files = response.data.map(file => ({
          name: file.name,
          type: file.type,
          path: file.path,
          url: file.html_url,
        }));
        return res.json(files);
      }

      // If it's a file, return content
      res.json({
        content: response.data,
        encoding: 'utf-8',
      });
    } catch (error) {
      console.error('Failed to fetch file:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: error.response?.data?.message || 'Failed to fetch file',
      });
    }
  }

  // Connect GitHub account
  static async connectGitHub(req, res) {
    try {
      const userId = req.user._id;
      const { accessToken, refreshToken, expiresAt } = req.body;

      if (!accessToken) {
        return res.status(400).json({ error: 'Access token required' });
      }

      // Verify token by making a test request
      const userResponse = await axios.get(`${GITHUB_API_BASE}/user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      const integration = await GitHubIntegration.findOneAndUpdate(
        { userId },
        {
          userId,
          githubUsername: userResponse.data.login,
          accessToken,
          refreshToken,
          expiresAt,
          connectedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      res.json({
        message: 'GitHub connected successfully',
        username: userResponse.data.login,
        avatar: userResponse.data.avatar_url,
      });
    } catch (error) {
      console.error('Failed to connect GitHub:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: error.response?.data?.message || 'Failed to connect GitHub account',
      });
    }
  }

  // Disconnect GitHub account
  static async disconnectGitHub(req, res) {
    try {
      const userId = req.user._id;
      await GitHubIntegration.deleteOne({ userId });
      res.json({ message: 'GitHub disconnected successfully' });
    } catch (error) {
      console.error('Failed to disconnect GitHub:', error.message);
      res.status(500).json({ error: 'Failed to disconnect GitHub account' });
    }
  }

  // Get connection status
  static async getConnectionStatus(req, res) {
    try {
      const userId = req.user._id;
      const integration = await GitHubIntegration.findOne({ userId });

      if (!integration) {
        return res.json({ connected: false });
      }

      // Verify token is still valid
      try {
        const userResponse = await axios.get(`${GITHUB_API_BASE}/user`, {
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        res.json({
          connected: true,
          username: userResponse.data.login,
          avatar: userResponse.data.avatar_url,
          connectedAt: integration.connectedAt,
        });
      } catch (error) {
        // Token is invalid, disconnect
        await GitHubIntegration.deleteOne({ userId });
        res.json({ connected: false });
      }
    } catch (error) {
      console.error('Failed to get connection status:', error.message);
      res.status(500).json({ error: 'Failed to get connection status' });
    }
  }

  // Get repository webhooks
  static async getWebhooks(req, res) {
    try {
      const userId = req.user._id;
      const { owner, repo } = req.params;
      const integration = await GitHubIntegration.findOne({ userId });

      if (!integration) {
        return res.status(404).json({ error: 'GitHub integration not connected' });
      }

      const response = await axios.get(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/hooks`,
        {
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      const webhooks = response.data
        .filter(hook => hook.config.url && hook.config.url.includes('deployer'))
        .map(hook => ({
          id: hook.id,
          url: hook.config.url,
          events: hook.events,
          active: hook.active,
          createdAt: hook.created_at,
        }));

      res.json(webhooks);
    } catch (error) {
      console.error('Failed to fetch webhooks:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: error.response?.data?.message || 'Failed to fetch webhooks',
      });
    }
  }

  // Create deployment webhook
  static async createDeploymentWebhook(req, res) {
    try {
      const userId = req.user._id;
      const { owner, repo } = req.params;
      const integration = await GitHubIntegration.findOne({ userId });

      if (!integration) {
        return res.status(404).json({ error: 'GitHub integration not connected' });
      }

      const webhookUrl = `${process.env.WEBHOOK_URL || 'http://localhost:5000'}/webhooks/github/${repo}`;

      const response = await axios.post(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/hooks`,
        {
          name: 'web',
          active: true,
          events: ['push', 'pull_request'],
          config: {
            url: webhookUrl,
            content_type: 'json',
            secret: process.env.GITHUB_WEBHOOK_SECRET,
            insecure_ssl: '0',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      res.json({
        message: 'Webhook created successfully',
        id: response.data.id,
        url: webhookUrl,
      });
    } catch (error) {
      console.error('Failed to create webhook:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: error.response?.data?.message || 'Failed to create webhook',
      });
    }
  }
}

module.exports = GitHubProviderController;
