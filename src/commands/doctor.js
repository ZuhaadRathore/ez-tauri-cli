import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import { checkPrerequisites } from '../utils/validation.js';

export async function doctorCheck(options) {
  console.log(chalk.cyan.bold('\n🔍 EZ Tauri Doctor - System Diagnostic\n'));

  const spinner = ora('Running diagnostic checks...').start();

  try {
    const results = await runDiagnostics(options.verbose);
    spinner.stop();

    displayResults(results, options.verbose);

    if (results.allGood) {
      console.log(chalk.green.bold('\n✅ System looks good! You\'re ready to create Tauri apps.\n'));
    } else {
      console.log(chalk.red.bold('\n❌ Some issues found. Please address them before proceeding.\n'));
      process.exit(1);
    }
  } catch (error) {
    spinner.fail('Diagnostic check failed');
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

async function runDiagnostics(verbose) {
  const results = {
    platform: process.platform,
    architecture: process.arch,
    nodeVersion: null,
    rustVersion: null,
    cargoVersion: null,
    packageManagers: [],
    platformSpecific: {},
    prerequisites: null,
    allGood: true
  };

  // Basic system info
  try {
    results.nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
  } catch {
    results.allGood = false;
  }

  try {
    results.rustVersion = execSync('rustc --version', { encoding: 'utf-8' }).trim();
  } catch {
    results.allGood = false;
  }

  try {
    results.cargoVersion = execSync('cargo --version', { encoding: 'utf-8' }).trim();
  } catch {
    results.allGood = false;
  }

  // Package managers
  const packageManagers = ['npm', 'yarn', 'pnpm'];
  for (const pm of packageManagers) {
    try {
      const version = execSync(`${pm} --version`, { encoding: 'utf-8', stdio: 'pipe' }).trim();
      results.packageManagers.push({ name: pm, version });
    } catch {
      // Package manager not available
    }
  }

  // Platform-specific checks
  results.platformSpecific = await getPlatformSpecificInfo(results.platform);

  // Run prerequisite check
  results.prerequisites = await checkPrerequisites();
  if (!results.prerequisites.valid) {
    results.allGood = false;
  }

  return results;
}

async function getPlatformSpecificInfo(platform) {
  const info = {};

  switch (platform) {
    case 'win32':
      try {
        info.visualStudio = execSync('where cl', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      } catch {
        info.visualStudio = 'Not found - Visual Studio Build Tools may be missing';
      }

      try {
        info.webview2 = 'Checking WebView2...';
        // Basic WebView2 check
        info.webview2 = 'WebView2 runtime check requires additional tools';
      } catch {
        info.webview2 = 'Unable to check WebView2 status';
      }
      break;

    case 'darwin':
      try {
        info.xcode = execSync('xcode-select -p', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      } catch {
        info.xcode = 'Xcode Command Line Tools not found';
      }
      break;

    case 'linux':
      try {
        info.webkit = execSync('pkg-config --modversion webkit2gtk-4.0', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      } catch {
        info.webkit = 'WebKit2GTK not found';
      }

      try {
        info.libappindicator = execSync('pkg-config --exists libappindicator3-0.1 && echo "found"', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      } catch {
        info.libappindicator = 'libappindicator not found';
      }
      break;
  }

  return info;
}

function displayResults(results, verbose) {
  console.log(chalk.cyan('System Information:'));
  console.log(chalk.white(`  OS: ${results.platform} (${results.architecture})`));

  // Node.js
  if (results.nodeVersion) {
    console.log(chalk.green(`  ✅ Node.js: ${results.nodeVersion}`));
  } else {
    console.log(chalk.red(`  ❌ Node.js: Not found`));
  }

  // Rust
  if (results.rustVersion) {
    console.log(chalk.green(`  ✅ Rust: ${results.rustVersion}`));
  } else {
    console.log(chalk.red(`  ❌ Rust: Not found`));
  }

  // Cargo
  if (results.cargoVersion) {
    console.log(chalk.green(`  ✅ Cargo: ${results.cargoVersion}`));
  } else {
    console.log(chalk.red(`  ❌ Cargo: Not found`));
  }

  // Package Managers
  console.log(chalk.cyan('\nPackage Managers:'));
  if (results.packageManagers.length > 0) {
    results.packageManagers.forEach(pm => {
      console.log(chalk.green(`  ✅ ${pm.name}: v${pm.version}`));
    });
  } else {
    console.log(chalk.red('  ❌ No package managers found'));
  }

  // Platform-specific
  console.log(chalk.cyan(`\n${getPlatformName(results.platform)} Dependencies:`));
  Object.entries(results.platformSpecific).forEach(([key, value]) => {
    const isGood = !value.includes('not found') && !value.includes('Not found') && !value.includes('missing');
    const icon = isGood ? '✅' : '❌';
    const color = isGood ? chalk.green : chalk.red;
    console.log(color(`  ${icon} ${key}: ${value}`));
  });

  // Prerequisites summary
  console.log(chalk.cyan('\nPrerequisites Check:'));
  if (results.prerequisites.valid) {
    console.log(chalk.green('  ✅ All prerequisites met'));
  } else {
    console.log(chalk.red('  ❌ Missing prerequisites:'));
    results.prerequisites.missing.forEach(item => {
      console.log(chalk.red(`    - ${item}`));
    });
  }

  if (results.prerequisites.warnings?.length > 0) {
    console.log(chalk.yellow('\n  ⚠️  Warnings:'));
    results.prerequisites.warnings.forEach(warning => {
      console.log(chalk.yellow(`    - ${warning}`));
    });
  }

  if (verbose) {
    console.log(chalk.gray('\nVerbose Information:'));
    console.log(chalk.gray(`  Working Directory: ${process.cwd()}`));
    console.log(chalk.gray(`  PATH: ${process.env.PATH?.substring(0, 100)}...`));
  }
}

function getPlatformName(platform) {
  switch (platform) {
    case 'win32': return 'Windows';
    case 'darwin': return 'macOS';
    case 'linux': return 'Linux';
    default: return platform;
  }
}