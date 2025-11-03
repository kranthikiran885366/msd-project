const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const configCommand = new Command('config')
  .description('Manage CLI configuration')
  .addCommand(
    new Command('get').argument('<key>', 'Configuration key').action((key) => {
      const config = getConfig();
      const value = config[key];
      console.log(value || chalk.gray('(not set)'));
    })
  )
  .addCommand(
    new Command('set')
      .argument('<key>', 'Configuration key')
      .argument('<value>', 'Configuration value')
      .action((key, value) => {
        const config = getConfig();
        config[key] = value;
        saveConfig(config);
        console.log(chalk.green(`✓ Config set: ${key} = ${value}`));
      })
  )
  .addCommand(
    new Command('list')
      .description('List all configuration')
      .action(() => {
        const config = getConfig();
        console.log('');
        Object.entries(config).forEach(([key, value]) => {
          console.log(`  ${chalk.cyan(key)}: ${value}`);
        });
        console.log('');
      })
  );

function getConfig() {
  const configFile = getConfigPath();
  if (fs.existsSync(configFile)) {
    return JSON.parse(fs.readFileSync(configFile, 'utf8'));
  }
  return {};
}

function saveConfig(config) {
  const configDir = path.join(process.env.HOME || process.env.USERPROFILE, '.deployment');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
}

function getConfigPath() {
  return path.join(process.env.HOME || process.env.USERPROFILE, '.deployment', 'config.json');
}

module.exports = configCommand;
