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

    if (prereqCheck.warnings?.length > 0) {
      spinner.warn('Prerequisites check completed with warnings');
      prereqCheck.warnings.forEach(warning => {
        console.log(chalk.yellow(`⚠️  ${warning}`));
      });
    } else {
      spinner.succeed('Prerequisites check passed');
    }

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

    // Success message and project info
    console.log(chalk.green.bold(`\n🎉 Project "${projectName}" created successfully!\n`));

    // Project details
    console.log(chalk.cyan('Project Details:'));
    console.log(chalk.white(`  📁 Location: ${projectPath}`));
    console.log(chalk.white(`  📋 Template: ${config.template}`));
    console.log(chalk.white(`  📦 Package Manager: ${config.packageManager}`));
    console.log(chalk.white(`  👤 Author: ${config.author} <${config.email}>`));

    console.log(chalk.cyan('\nNext Steps:'));
    console.log(chalk.white(`  1. cd ${projectName}`));
    if (!config.install) {
      console.log(chalk.white(`  2. ${config.packageManager} install`));
      console.log(chalk.white(`  3. ${config.packageManager} run dev`));
    } else {
      console.log(chalk.white(`  2. ${config.packageManager} run dev`));
    }

    // Template-specific instructions
    if (config.template === 'full' || config.template === 'database') {
      console.log(chalk.cyan('\nDatabase Setup (if using database features):'));
      console.log(chalk.white('  1. docker-compose up -d'));
      console.log(chalk.white('  2. Configure your .env file'));
    }

    console.log(chalk.cyan('\nUseful Commands:'));
    console.log(chalk.gray(`  ${config.packageManager} run build         # Build for production`));
    console.log(chalk.gray(`  ${config.packageManager} run tauri:build   # Package desktop app`));
    console.log(chalk.gray(`  ${config.packageManager} run test          # Run tests`));

    console.log(chalk.green.bold('\n🚀 Happy coding!\n'));

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
        {
          name: 'Full - Complete boilerplate with all features (recommended)',
          value: 'full',
          description: 'React + TypeScript + Tailwind + Database + Testing + CI/CD'
        },
        {
          name: 'Minimal - Basic Tauri + React setup',
          value: 'minimal',
          description: 'Just React + TypeScript + Basic styling'
        },
        {
          name: 'Database - Includes PostgreSQL setup',
          value: 'database',
          description: 'Full template + PostgreSQL + Docker + Migrations'
        }
      ]
    });
  } else {
    // Validate template option
    const validTemplates = ['full', 'minimal', 'database'];
    if (!validTemplates.includes(options.template)) {
      console.error(chalk.red(`❌ Invalid template: ${options.template}`));
      console.log(chalk.yellow(`Valid templates: ${validTemplates.join(', ')}`));
      process.exit(1);
    }
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