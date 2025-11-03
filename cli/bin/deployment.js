#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const packageJson = require('./package.json');

// Import commands
const authCommand = require('./commands/auth');
const deployCommand = require('./commands/deploy');
const logsCommand = require('./commands/logs');
const statusCommand = require('./commands/status');
const configCommand = require('./commands/config');
const projectCommand = require('./commands/project');

program.version(packageJson.version);

// Add commands
program.addCommand(authCommand);
program.addCommand(deployCommand);
program.addCommand(logsCommand);
program.addCommand(statusCommand);
program.addCommand(configCommand);
program.addCommand(projectCommand);

// Help
program.on('--help', () => {
  console.log('');
  console.log('  Examples:');
  console.log('');
  console.log(chalk.gray('    # Login to your account'));
  console.log('    $ deployment login');
  console.log('');
  console.log(chalk.gray('    # Deploy your project'));
  console.log('    $ deployment deploy');
  console.log('');
  console.log(chalk.gray('    # View deployment logs'));
  console.log('    $ deployment logs <deployment-id>');
  console.log('');
  console.log(chalk.gray('    # Check deployment status'));
  console.log('    $ deployment status <deployment-id>');
  console.log('');
});

program.parse(process.argv);

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
