const axios = require('axios');
const crypto = require('crypto');

class WebhookManager {
  async createWebhook(provider, repoDetails, webhookUrl) {
    const { token, owner, name } = repoDetails;
    
    switch (provider) {
      case 'github':
        return await this.createGithubWebhook(token, owner, name, webhookUrl);
      case 'gitlab':
        return await this.createGitlabWebhook(token, owner, name, webhookUrl);
      case 'bitbucket':
        return await this.createBitbucketWebhook(token, owner, name, webhookUrl);
      default:
        throw new Error('Unsupported git provider');
    }
  }

  async removeWebhook(provider, repoDetails, webhookId) {
    const { token, owner, name } = repoDetails;
    
    switch (provider) {
      case 'github':
        return await this.removeGithubWebhook(token, owner, name, webhookId);
      case 'gitlab':
        return await this.removeGitlabWebhook(token, owner, name, webhookId);
      case 'bitbucket':
        return await this.removeBitbucketWebhook(token, owner, name, webhookId);
      default:
        throw new Error('Unsupported git provider');
    }
  }

  validateGitSignature(provider, payload, signature) {
    const secret = process.env[`${provider.toUpperCase()}_WEBHOOK_SECRET`];
    if (!secret) return false;

    switch (provider) {
      case 'github':
        const hmac = crypto.createHmac('sha256', secret);
        const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
        
      case 'gitlab':
        return signature === secret;
        
      case 'bitbucket':
        const hmacBB = crypto.createHmac('sha256', secret);
        const digestBB = hmacBB.update(JSON.stringify(payload)).digest('hex');
        return signature === digestBB;
        
      default:
        return false;
    }
  }

  async createGithubWebhook(token, owner, repo, webhookUrl) {
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/hooks`,
      {
        name: 'web',
        active: true,
        events: ['push', 'pull_request'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: process.env.GITHUB_WEBHOOK_SECRET,
        },
      },
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${token}`,
        },
      }
    );
    return { id: response.data.id };
  }

  async createGitlabWebhook(token, owner, repo, webhookUrl) {
    const response = await axios.post(
      `https://gitlab.com/api/v4/projects/${encodeURIComponent(`${owner}/${repo}`)}/hooks`,
      {
        url: webhookUrl,
        push_events: true,
        merge_requests_events: true,
        token: process.env.GITLAB_WEBHOOK_SECRET,
      },
      {
        headers: {
          'PRIVATE-TOKEN': token,
        },
      }
    );
    return { id: response.data.id };
  }

  async createBitbucketWebhook(token, owner, repo, webhookUrl) {
    const response = await axios.post(
      `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/hooks`,
      {
        description: 'Deployment webhook',
        url: webhookUrl,
        active: true,
        events: ['repo:push', 'pullrequest:created', 'pullrequest:updated'],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return { id: response.data.uuid };
  }

  async removeGithubWebhook(token, owner, repo, webhookId) {
    await axios.delete(
      `https://api.github.com/repos/${owner}/${repo}/hooks/${webhookId}`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${token}`,
        },
      }
    );
  }

  async removeGitlabWebhook(token, owner, repo, webhookId) {
    await axios.delete(
      `https://gitlab.com/api/v4/projects/${encodeURIComponent(`${owner}/${repo}`)}/hooks/${webhookId}`,
      {
        headers: {
          'PRIVATE-TOKEN': token,
        },
      }
    );
  }

  async removeBitbucketWebhook(token, owner, repo, webhookId) {
    await axios.delete(
      `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/hooks/${webhookId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }
}

module.exports = new WebhookManager();