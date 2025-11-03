const { Command } = require('commander');
const chalk = require('chalk');

const projectCommand = new Command('project')
  .description('Manage projects')
  .addCommand(
    new Command('list')
      .description('List all projects')
      .action(() => {
        console.log(chalk.cyan('Projects:'));
        console.log('  (list your projects here)');
      })
  )
  .addCommand(
    new Command('create')
      .argument('<name>', 'Project name')
      .description('Create a new project')
      .action((name) => {
        console.log(chalk.green(`✓ Project created: ${name}`));
      })
  )
  .addCommand(
    new Command('delete')
      .argument('<projectId>', 'Project ID')
      .description('Delete a project')
      .action((projectId) => {
        console.log(chalk.green(`✓ Project deleted: ${projectId}`));
      })
  );

module.exports = projectCommand;
