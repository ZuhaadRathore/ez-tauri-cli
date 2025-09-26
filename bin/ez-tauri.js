#!/usr/bin/env node

import { program } from 'commander';
import { createProject } from '../src/commands/create.js';
import { initProject } from '../src/commands/init.js';
import { doctorCheck } from '../src/commands/doctor.js';
import {
  listModules,
  installModule,
  uninstallModule,
  showModuleInfo,
  configureModule,
  syncModules
} from '../src/commands/modules.js';
import { showLogo } from '../src/utils/logo.js';

program
  .name('ez-tauri')
  .description('CLI tool to create EZ Tauri desktop applications')
  .version('1.2.0');

program
  .command('create')
  .description('Create a new EZ Tauri project')
  .argument('<project-name>', 'Name of the project')
  .option('-t, --template <type>', 'Template type (minimal, full, database)', 'full')
  .option('-pm, --package-manager <type>', 'Package manager (npm, yarn, pnpm)', 'npm')
  .option('--no-install', 'Skip npm install')
  .option('--no-git', 'Skip git init')
  .action(createProject);

program
  .command('init')
  .description('Initialize EZ Tauri in current directory')
  .option('-t, --template <type>', 'Template type (minimal, full, database)', 'full')
  .option('-pm, --package-manager <type>', 'Package manager (npm, yarn, pnpm)', 'npm')
  .option('--no-install', 'Skip npm install')
  .action(initProject);

program
  .command('doctor')
  .description('Check system setup and dependencies')
  .option('--verbose', 'Show detailed diagnostic information')
  .action(doctorCheck);

// Module management commands
const modulesCmd = program
  .command('modules')
  .description('Manage project modules');

modulesCmd
  .command('list')
  .description('List all available modules and their status')
  .action(listModules);

modulesCmd
  .command('install <module-id>')
  .description('Install and enable a module')
  .action(installModule);

modulesCmd
  .command('uninstall <module-id>')
  .description('Uninstall and disable a module')
  .action(uninstallModule);

modulesCmd
  .command('info <module-id>')
  .description('Show detailed information about a module')
  .action(showModuleInfo);

modulesCmd
  .command('config <module-id> <key> <value>')
  .description('Set a configuration value for an installed module')
  .action(configureModule);

modulesCmd
  .command('sync')
  .description('Sync module configuration with build files')
  .action(syncModules);

// Show logo when help is requested
const originalOutputHelp = program.outputHelp;
program.outputHelp = function(...args) {
  showLogo();
  return originalOutputHelp.call(this, ...args);
};

program.parse();