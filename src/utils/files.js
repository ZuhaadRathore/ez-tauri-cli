import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(__dirname, '../../templates');

export async function copyTemplate(templateType, targetPath, config) {
  const spinner = ora(`Copying ${templateType} template...`).start();

  try {
    const templatePath = path.join(templatesDir, templateType);

    // Check if template exists
    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Template "${templateType}" not found`);
    }

    // Create target directory
    await fs.ensureDir(targetPath);

    // Copy template files
    await fs.copy(templatePath, targetPath);

    // Process template files (replace placeholders)
    await processTemplateFiles(targetPath, config);

    spinner.succeed('Template copied successfully');
  } catch (error) {
    spinner.fail('Failed to copy template');
    throw error;
  }
}

async function processTemplateFiles(projectPath, config) {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);

    // Update package.json with project details
    packageJson.name = config.projectName;
    packageJson.author = `${config.author} <${config.email}>`;

    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }

  // Process .env.example -> .env
  const envExamplePath = path.join(projectPath, '.env.example');
  const envPath = path.join(projectPath, '.env');

  if (await fs.pathExists(envExamplePath)) {
    await fs.copy(envExamplePath, envPath);
  }

  // Update Cargo.toml if exists
  const cargoTomlPath = path.join(projectPath, 'src-tauri', 'Cargo.toml');
  if (await fs.pathExists(cargoTomlPath)) {
    let cargoContent = await fs.readFile(cargoTomlPath, 'utf-8');
    cargoContent = cargoContent.replace(/name = ".*"/, `name = "${config.projectName}"`);
    await fs.writeFile(cargoTomlPath, cargoContent);
  }

  // Update README.md
  const readmePath = path.join(projectPath, 'README.md');
  if (await fs.pathExists(readmePath)) {
    let readmeContent = await fs.readFile(readmePath, 'utf-8');
    readmeContent = readmeContent.replace(/# EZ Tauri/g, `# ${config.projectName}`);
    await fs.writeFile(readmePath, readmeContent);
  }
}

export async function installDependencies(projectPath, packageManager) {
  const spinner = ora(`Installing dependencies with ${packageManager}...`).start();

  try {
    const installCommand = getInstallCommand(packageManager);

    execSync(installCommand, {
      cwd: projectPath,
      stdio: 'ignore'
    });

    spinner.succeed('Dependencies installed successfully');
  } catch (error) {
    spinner.fail('Failed to install dependencies');
    console.log(chalk.yellow(`You can install them manually by running: ${getInstallCommand(packageManager)}`));
  }
}

function getInstallCommand(packageManager) {
  switch (packageManager) {
    case 'yarn':
      return 'yarn install';
    case 'pnpm':
      return 'pnpm install';
    default:
      return 'npm install';
  }
}

export async function initGit(projectPath) {
  const spinner = ora('Initializing git repository...').start();

  try {
    execSync('git init', { cwd: projectPath, stdio: 'ignore' });
    execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
    execSync('git commit -m "Initial commit"', { cwd: projectPath, stdio: 'ignore' });

    spinner.succeed('Git repository initialized');
  } catch (error) {
    spinner.fail('Failed to initialize git repository');
    console.log(chalk.yellow('You can initialize git manually if needed.'));
  }
}