const { Command } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const logsCommand = new Command('logs')
  .description('View deployment logs')
  .argument('<deploymentId>', 'Deployment ID')
  .option('-f, --follow', 'Follow logs (streaming)')
  .option('-n, --lines <number>', 'Number of lines to display', '50')
  .action(async (deploymentId, options) => {
    try {
      // Check auth
      const token = getToken();
      if (!token) {
        console.error(chalk.red('✗ Not authenticated. Run `deployment auth login` first.'));
        process.exit(1);
      }

      console.log(chalk.gray(`📋 Logs for deployment ${chalk.cyan(deploymentId)}`));
      console.log('');

      if (options.follow) {
        // Streaming logs
        streamLogs(token, deploymentId);
      } else {
        // Fetch logs
        const response = await axios.get(
          `${process.env.API_URL || 'http://localhost:5000'}/api/deployments/${deploymentId}/logs`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: options.lines },
          }
        );

        const logs = response.data.logs || [];
        logs.forEach((log) => {
          const timestamp = new Date(log.timestamp).toLocaleTimeString();
          const level = getLevelColor(log.level);
          console.log(`${chalk.gray(timestamp)} ${level} ${log.message}`);
        });
      }
    } catch (error) {
      console.error(chalk.red(`✗ Failed to fetch logs: ${error.response?.data?.error || error.message}`));
      process.exit(1);
    }
  });

function streamLogs(token, deploymentId) {
  const EventSource = require('eventsource');
  const url = `${process.env.API_URL || 'http://localhost:5000'}/api/deployments/${deploymentId}/logs/stream`;

  const eventSource = new EventSource(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  eventSource.addEventListener('log', (event) => {
    const log = JSON.parse(event.data);
    const timestamp = new Date(log.timestamp).toLocaleTimeString();
    const level = getLevelColor(log.level);
    console.log(`${chalk.gray(timestamp)} ${level} ${log.message}`);
  });

  eventSource.addEventListener('done', () => {
    console.log('');
    console.log(chalk.green('✓ Deployment completed'));
    eventSource.close();
  });

  eventSource.addEventListener('error', (error) => {
    console.error(chalk.red(`✗ Stream error: ${error.message}`));
    eventSource.close();
    process.exit(1);
  });
}

function getLevelColor(level) {
  switch (level) {
    case 'error':
      return chalk.red('[ERROR]');
    case 'warn':
      return chalk.yellow('[WARN]');
    case 'info':
      return chalk.blue('[INFO]');
    default:
      return chalk.gray('[LOG]');
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

module.exports = logsCommand;
