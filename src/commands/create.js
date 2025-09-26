import { input, select, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { fileURLToPath } from 'url';
import { copyTemplate, installDependencies, initGit } from '../utils/files.js';
import { validateProjectName, checkPrerequisites } from '../utils/validation.js';
import { showLogo } from '../utils/logo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createProject(projectName, options) {
  showLogo();

  // Validate project name
  const validationResult = validateProjectName(projectName);
  if (!validationResult.valid) {
    console.error(chalk.red(`❌ ${validationResult.message}`));
    process.exit(1);
  }

  try {
    // Interactive prompts if not provided via flags
    const config = await gatherProjectConfig(projectName, options);

    // Check prerequisites
    const spinner = ora('Checking prerequisites...').start();
    const prereqCheck = await checkPrerequisites();
    if (!prereqCheck.valid) {
      spinner.fail(`Missing prerequisites: ${prereqCheck.missing.join(', ')}`);
      console.log(chalk.yellow('\nPlease install the missing prerequisites and try again.'));
      process.exit(1);
    }
    spinner.succeed('Prerequisites check passed');

    // Create project directory
    const projectPath = path.resolve(process.cwd(), projectName);

    // Copy template
    await copyTemplate(config.template, projectPath, config);

    // Install dependencies
    if (config.install) {
      await installDependencies(projectPath, config.packageManager);
    }

    // Initialize git
    if (config.git) {
      await initGit(projectPath);
    }

    // Success message
    console.log(chalk.green.bold(`\n✅ Project "${projectName}" created successfully!\n`));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.white(`  cd ${projectName}`));
    if (!config.install) {
      console.log(chalk.white(`  ${config.packageManager} install`));
    }
    console.log(chalk.white(`  ${config.packageManager} run dev`));
    console.log(chalk.gray('\nHappy coding! 🎉\n'));

  } catch (error) {
    console.error(chalk.red(`\n❌ Error creating project: ${error.message}`));
    process.exit(1);
  }
}

async function gatherProjectConfig(projectName, options) {
  const config = { projectName };

  // Template selection
  if (!options.template || options.template === true) {
    config.template = await select({
      message: 'Choose a template:',
      choices: [
        { name: 'Full - Complete boilerplate with all features', value: 'full' },
        { name: 'Minimal - Basic Tauri + React setup', value: 'minimal' },
        { name: 'Database - Includes PostgreSQL setup', value: 'database' }
      ]
    });
  } else {
    config.template = options.template;
  }

  // Package manager
  if (!options.packageManager || options.packageManager === true) {
    config.packageManager = await select({
      message: 'Package manager:',
      choices: [
        { name: 'npm', value: 'npm' },
        { name: 'yarn', value: 'yarn' },
        { name: 'pnpm', value: 'pnpm' }
      ],
      default: 'npm'
    });
  } else {
    config.packageManager = options.packageManager;
  }

  // Author info
  config.author = await input({
    message: 'Author name:',
    default: 'Your Name'
  });

  config.email = await input({
    message: 'Author email:',
    default: 'your.email@example.com'
  });

  // Install dependencies
  config.install = options.install !== false ? await confirm({
    message: 'Install dependencies?',
    default: true
  }) : false;

  // Initialize git
  config.git = options.git !== false ? await confirm({
    message: 'Initialize git repository?',
    default: true
  }) : false;

  return config;
}