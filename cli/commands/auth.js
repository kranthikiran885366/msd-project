const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const authCommand = new Command('auth')
  .description('Authentication commands');

// Login command
authCommand
  .command('login')
  .description('Login to your deployment account')
  .action(async () => {
    try {
      console.log(chalk.blue('🔐 Deployment Platform CLI'));
      console.log('');

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'email',
          message: 'Email:',
          validate: (value) => {
            if (value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
              return true;
            }
            return 'Please enter a valid email';
          },
        },
        {
          type: 'password',
          name: 'password',
          message: 'Password:',
          mask: '*',
        },
      ]);

      console.log(chalk.gray('Authenticating...'));

      const response = await axios.post(`${process.env.API_URL || 'http://localhost:5000'}/api/auth/login`, {
        email: answers.email,
        password: answers.password,
      });

      const token = response.data.token;

      // Save token to config
      const configDir = path.join(os.homedir(), '.deployment');
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      fs.writeFileSync(path.join(configDir, 'token'), token);
      fs.chmodSync(path.join(configDir, 'token'), 0o600);

      console.log(chalk.green('✓ Logged in successfully'));
      console.log(chalk.gray(`Token saved to ${path.join(configDir, 'token')}`));
    } catch (error) {
      console.error(chalk.red(`✗ Login failed: ${error.response?.data?.error || error.message}`));
      process.exit(1);
    }
  });

// Logout command
authCommand
  .command('logout')
  .description('Logout from your account')
  .action(() => {
    try {
      const configDir = path.join(os.homedir(), '.deployment');
      const tokenPath = path.join(configDir, 'token');

      if (fs.existsSync(tokenPath)) {
        fs.unlinkSync(tokenPath);
      }

      console.log(chalk.green('✓ Logged out successfully'));
    } catch (error) {
      console.error(chalk.red(`✗ Logout failed: ${error.message}`));
      process.exit(1);
    }
  });

// Status command
authCommand
  .command('status')
  .description('Check authentication status')
  .action(() => {
    try {
      const configDir = path.join(os.homedir(), '.deployment');
      const tokenPath = path.join(configDir, 'token');

      if (fs.existsSync(tokenPath)) {
        console.log(chalk.green('✓ Logged in'));
      } else {
        console.log(chalk.yellow('⚠ Not logged in. Run `deployment auth login` to get started.'));
      }
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error.message}`));
      process.exit(1);
    }
  });

module.exports = authCommand;
