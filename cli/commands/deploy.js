const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const ora = require('ora');

const deployCommand = new Command('deploy')
  .description('Deploy your project')
  .option('-p, --project <id>', 'Project ID')
  .option('-r, --region <region>', 'Region')
  .option('-e, --environment <env>', 'Environment (dev, staging, prod)')
  .option('--no-cache', 'Disable build cache')
  .action(async (options) => {
    try {
      // Check auth
      const token = getToken();
      if (!token) {
        console.error(chalk.red('✗ Not authenticated. Run `deployment auth login` first.'));
        process.exit(1);
      }

      // Get project ID
      let projectId = options.project;
      if (!projectId) {
        const projects = await getProjects(token);
        if (!projects.length) {
          console.error(chalk.red('✗ No projects found. Create one first.'));
          process.exit(1);
        }

        const answer = await inquirer.prompt([
          {
            type: 'list',
            name: 'projectId',
            message: 'Select project:',
            choices: projects.map((p) => ({ name: p.name, value: p.id })),
          },
        ]);

        projectId = answer.projectId;
      }

      // Get region
      let region = options.region;
      if (!region) {
        const regions = await getRegions(token);
        const answer = await inquirer.prompt([
          {
            type: 'list',
            name: 'region',
            message: 'Select region:',
            choices: regions.map((r) => ({ name: r.displayName, value: r.code })),
          },
        ]);

        region = answer.region;
      }

      // Get environment
      let environment = options.environment || 'prod';

      console.log('');
      const spinner = ora(chalk.gray('Uploading project files...')).start();

      // Upload and deploy
      const response = await axios.post(
        `${process.env.API_URL || 'http://localhost:5000'}/api/deployments/create`,
        {
          projectId,
          region,
          environment,
          enableCache: options.cache,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const deployment = response.data.deployment;

      spinner.succeed(chalk.green('✓ Deployment started'));
      console.log('');
      console.log(chalk.gray('Deployment Details:'));
      console.log(`  ID: ${chalk.cyan(deployment.id)}`);
      console.log(`  Status: ${chalk.yellow(deployment.status)}`);
      console.log(`  Region: ${chalk.cyan(region)}`);
      console.log('');
      console.log(chalk.gray('View logs with: deployment logs ' + deployment.id));
    } catch (error) {
      console.error(chalk.red(`✗ Deployment failed: ${error.response?.data?.error || error.message}`));
      process.exit(1);
    }
  });

// Helper functions
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

async function getProjects(token) {
  try {
    const response = await axios.get(`${process.env.API_URL || 'http://localhost:5000'}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.projects || [];
  } catch (error) {
    return [];
  }
}

async function getRegions(token) {
  try {
    const response = await axios.get(`${process.env.API_URL || 'http://localhost:5000'}/api/providers/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.providers || [];
  } catch (error) {
    return [{ code: 'us-east-1', displayName: 'US East (N. Virginia)' }];
  }
}

module.exports = deployCommand;
