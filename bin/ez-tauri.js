#!/usr/bin/env node

import { program } from 'commander';
import { createProject } from '../src/commands/create.js';
import { initProject } from '../src/commands/init.js';
import { addFeature } from '../src/commands/add.js';
import { showLogo } from '../src/utils/logo.js';

program
  .name('ez-tauri')
  .description('CLI tool to create EZ Tauri desktop applications')
  .version('1.1.0');

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
  .command('add')
  .description('Add features to existing EZ Tauri project')
  .argument('<feature>', 'Feature to add (database, testing, docker)')
  .action(addFeature);

// Show logo when help is requested
const originalOutputHelp = program.outputHelp;
program.outputHelp = function(...args) {
  showLogo();
  return originalOutputHelp.call(this, ...args);
};

program.parse();