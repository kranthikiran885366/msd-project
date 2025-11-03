const { Command } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const Table = require('cli-table3');

const statusCommand = new Command('status')
  .description('Check deployment status')
  .argument('<deploymentId>', 'Deployment ID')
  .action(async (deploymentId) => {
    try {
      // Check auth
      const token = getToken();
      if (!token) {
        console.error(chalk.red('✗ Not authenticated. Run `deployment auth login` first.'));
        process.exit(1);
      }

      console.log(chalk.gray(`Fetching deployment status...`));

      const response = await axios.get(
        `${process.env.API_URL || 'http://localhost:5000'}/api/deployments/${deploymentId}/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const deployment = response.data.deployment;

      console.log('');
      console.log(chalk.blue('📦 Deployment Status'));
      console.log('');

      const statusColor = getStatusColor(deployment.status);
      console.log(`  Status: ${statusColor(deployment.status.toUpperCase())}`);
      console.log(`  ID: ${chalk.cyan(deployment.id)}`);
      console.log(`  Project: ${chalk.cyan(deployment.projectId)}`);
      console.log(`  URL: ${chalk.cyan(deployment.url || 'N/A')}`);
      console.log(`  Created: ${new Date(deployment.createdAt).toLocaleString()}`);

      if (deployment.completedAt) {
        console.log(`  Completed: ${new Date(deployment.completedAt).toLocaleString()}`);
      }

      // Show regional status if multi-region
      if (deployment.regions && deployment.regions.length > 0) {
        console.log('');
        console.log(chalk.gray('Regional Deployments:'));

        const table = new Table({
          head: ['Region', 'Status', 'URL'],
          colWidths: [20, 15, 40],
        });

        deployment.regions.forEach((r) => {
          table.push([r.region, getStatusColor(r.status)(r.status), r.url || 'N/A']);
        });

        console.log(table.toString());
      }

      console.log('');
    } catch (error) {
      console.error(chalk.red(`✗ Failed to fetch status: ${error.response?.data?.error || error.message}`));
      process.exit(1);
    }
  });

function getStatusColor(status) {
  switch (status.toLowerCase()) {
    case 'running':
      return chalk.green;
    case 'failed':
      return chalk.red;
    case 'deploying':
    case 'building':
      return chalk.yellow;
    default:
      return chalk.gray;
  }
}

function getToken() {
  try {
    const configDir = path.join(os.homedir(), '.deployment');
    const tokenPath = path.join(configDir, 'token');
    if (fs.existsSync(tokenPath)) {
      return fs.readFileSync(tokenPath, 'utf8').trim();
    }
  } catch (error) {
    // silently fail
  }
  return null;
}

module.exports = statusCommand;
