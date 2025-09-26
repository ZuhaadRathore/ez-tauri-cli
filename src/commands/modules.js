/**
 * Module management commands for EZ Tauri CLI
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, cpSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import chalk from 'chalk';
import ora from 'ora';

// Helper functions for logging
const logInfo = (message) => console.log(`${chalk.cyan('ℹ')} ${message}`);
const logSuccess = (message) => console.log(`${chalk.green('✓')} ${message}`);
const logWarning = (message) => console.log(`${chalk.yellow('⚠')} ${message}`);
const logError = (message) => console.log(`${chalk.red('✗')} ${message}`);

function getCurrentWorkingDir() {
    return process.cwd();
}

function getModulesDirectory() {
    return join(getCurrentWorkingDir(), 'modules');
}

function getConfigPath() {
    return join(getCurrentWorkingDir(), 'module_config.json');
}

function loadModuleConfig() {
    const configPath = getConfigPath();
    if (!existsSync(configPath)) {
        return {};
    }

    try {
        const content = readFileSync(configPath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        logError(`Failed to load module configuration: ${error.message}`);
        return {};
    }
}

function saveModuleConfig(config) {
    const configPath = getConfigPath();
    try {
        writeFileSync(configPath, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        logError(`Failed to save module configuration: ${error.message}`);
        return false;
    }
}

function loadModuleManifest(moduleId) {
    const manifestPath = join(getModulesDirectory(), moduleId, 'module.json');
    if (!existsSync(manifestPath)) {
        return null;
    }

    try {
        const content = readFileSync(manifestPath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        logError(`Failed to load manifest for module '${moduleId}': ${error.message}`);
        return null;
    }
}

function getAvailableModules() {
    const modulesDir = getModulesDirectory();
    if (!existsSync(modulesDir)) {
        return [];
    }

    const modules = [];

    try {
        const entries = readdirSync(modulesDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const manifest = loadModuleManifest(entry.name);
                if (manifest) {
                    modules.push({
                        id: entry.name,
                        manifest
                    });
                }
            }
        }
    } catch (error) {
        logError(`Failed to scan modules directory: ${error.message}`);
    }

    return modules;
}

function getInstalledModules() {
    const srcTauriDir = join(getCurrentWorkingDir(), 'src-tauri', 'src');
    const installedModules = [];

    if (!existsSync(srcTauriDir)) {
        return installedModules;
    }

    // Check which modules are actually integrated in the source code
    const modules = getAvailableModules();

    for (const { id, manifest } of modules) {
        const moduleDir = join(srcTauriDir, 'modules', id);
        if (existsSync(moduleDir)) {
            installedModules.push({ id, manifest });
        }
    }

    return installedModules;
}

function updateCargoToml(enabledModules) {
    const cargoPath = join(getCurrentWorkingDir(), 'src-tauri', 'Cargo.toml');

    if (!existsSync(cargoPath)) {
        logError('Cargo.toml not found. Make sure you\'re in a Tauri project directory.');
        return false;
    }

    try {
        let cargoContent = readFileSync(cargoPath, 'utf8');

        // Update the default features section
        const featureFlags = enabledModules.map(id => `"module-${id}"`).join(', ');

        // Replace the existing default features line
        const featuresSectionRegex = /(\[features\][\s\S]*?default\s*=\s*\[)[^\]]*(\])/;

        if (featuresSectionRegex.test(cargoContent)) {
            cargoContent = cargoContent.replace(featuresSectionRegex, `$1${featureFlags}$2`);
        } else {
            logWarning('Could not find [features] section in Cargo.toml');
            return false;
        }

        writeFileSync(cargoPath, cargoContent);
        logSuccess(`Updated Cargo.toml with enabled modules: ${enabledModules.join(', ') || 'none'}`);
        return true;
    } catch (error) {
        logError(`Failed to update Cargo.toml: ${error.message}`);
        return false;
    }
}

function updateModExports(enabledModules) {
    const libPath = join(getCurrentWorkingDir(), 'src-tauri', 'src', 'lib.rs');

    if (!existsSync(libPath)) {
        logError('lib.rs not found');
        return false;
    }

    try {
        let libContent = readFileSync(libPath, 'utf8');

        // Remove existing module declarations
        libContent = libContent.replace(/mod modules;?\n?/g, '');

        // Add module declarations for enabled modules
        if (enabledModules.length > 0) {
            const moduleDeclarations = 'mod modules;\n';

            // Insert after the existing mod declarations
            const insertPoint = libContent.indexOf('use config::AppConfig;');
            if (insertPoint !== -1) {
                libContent = libContent.slice(0, insertPoint) + moduleDeclarations + libContent.slice(insertPoint);
            } else {
                libContent = moduleDeclarations + libContent;
            }
        }

        writeFileSync(libPath, libContent);
        logSuccess('Updated lib.rs module exports');
        return true;
    } catch (error) {
        logError(`Failed to update lib.rs: ${error.message}`);
        return false;
    }
}

function createModulesModFile(enabledModules) {
    const modulesDir = join(getCurrentWorkingDir(), 'src-tauri', 'src', 'modules');
    const modFilePath = join(modulesDir, 'mod.rs');

    if (enabledModules.length === 0) {
        // Remove the modules directory if no modules are enabled
        if (existsSync(modulesDir)) {
            rmSync(modulesDir, { recursive: true, force: true });
        }
        return true;
    }

    // Create modules directory if it doesn't exist
    mkdirSync(modulesDir, { recursive: true });

    // Create mod.rs with module declarations
    const modContent = `//! Application modules
//!
//! This file is auto-generated by the module management CLI.
//! Do not edit manually.

${enabledModules.map(id => `#[cfg(feature = "module-${id}")]\npub mod ${id};`).join('\n\n')}

${enabledModules.map(id => `#[cfg(feature = "module-${id}")]\npub use ${id}::*;`).join('\n')}
`;

    try {
        writeFileSync(modFilePath, modContent);
        logSuccess('Created modules/mod.rs');
        return true;
    } catch (error) {
        logError(`Failed to create modules/mod.rs: ${error.message}`);
        return false;
    }
}

function copyModuleFiles(moduleId) {
    const moduleSource = join(getModulesDirectory(), moduleId);
    const srcTauriDir = join(getCurrentWorkingDir(), 'src-tauri', 'src');
    const moduleTarget = join(srcTauriDir, 'modules', moduleId);

    if (!existsSync(moduleSource)) {
        throw new Error(`Module source directory not found: ${moduleSource}`);
    }

    // Create target directory
    mkdirSync(moduleTarget, { recursive: true });

    // Copy Rust source files if they exist
    const rustSrcDir = join(moduleSource, 'src');
    if (existsSync(rustSrcDir)) {
        const targetSrcDir = join(moduleTarget, 'src');
        mkdirSync(targetSrcDir, { recursive: true });
        cpSync(rustSrcDir, targetSrcDir, { recursive: true });
        logInfo(`Copied Rust source files for ${moduleId}`);
    }

    // Copy other relevant files
    const filesToCopy = ['mod.rs', 'lib.rs', 'handlers.rs', 'models.rs'];
    for (const file of filesToCopy) {
        const sourcePath = join(moduleSource, file);
        const targetPath = join(moduleTarget, file);
        if (existsSync(sourcePath)) {
            cpSync(sourcePath, targetPath);
            logInfo(`Copied ${file} for ${moduleId}`);
        }
    }
}

function removeModuleFiles(moduleId) {
    const srcTauriDir = join(getCurrentWorkingDir(), 'src-tauri', 'src');
    const moduleTarget = join(srcTauriDir, 'modules', moduleId);

    if (existsSync(moduleTarget)) {
        rmSync(moduleTarget, { recursive: true, force: true });
        logInfo(`Removed module files for ${moduleId}`);
    }
}

// Command implementations
export function listModules() {
    const spinner = ora('Loading modules...').start();

    try {
        const modules = getAvailableModules();
        const installedModules = getInstalledModules();
        const config = loadModuleConfig();

        spinner.stop();

        console.log(chalk.bold('Available modules:'));
        console.log();

        if (modules.length === 0) {
            logWarning('No modules found in modules/ directory.');
            logInfo('Create module manifests in the modules/ directory to get started.');
            return;
        }

        for (const { id, manifest } of modules) {
            const moduleConfig = config[id];
            const enabled = moduleConfig?.enabled || false;
            const installed = installedModules.some(m => m.id === id);

            let status;
            let statusColor;
            if (enabled && installed) {
                status = 'ENABLED';
                statusColor = 'green';
            } else if (installed) {
                status = 'INSTALLED';
                statusColor = 'blue';
            } else {
                status = 'AVAILABLE';
                statusColor = 'gray';
            }

            const bullet = enabled ? chalk.green('●') : installed ? chalk.blue('●') : chalk.gray('●');
            console.log(`${bullet} ${chalk.bold(manifest.name)} (${id}) - ${chalk[statusColor](status)}`);
            console.log(`  ${manifest.description}`);
            console.log(`  Version: ${manifest.version} | Category: ${manifest.category}`);

            if (manifest.dependencies.length > 0) {
                const deps = manifest.dependencies.map(dep => dep.module_id).join(', ');
                console.log(`  Dependencies: ${deps}`);
            }

            console.log();
        }
    } catch (error) {
        spinner.fail(`Failed to list modules: ${error.message}`);
    }
}

export function installModule(moduleId) {
    const spinner = ora(`Installing module '${moduleId}'...`).start();

    try {
        const manifest = loadModuleManifest(moduleId);
        if (!manifest) {
            spinner.fail(`Module '${moduleId}' not found.`);
            return;
        }

        const installedModules = getInstalledModules();
        if (installedModules.some(m => m.id === moduleId)) {
            spinner.warn(`Module '${moduleId}' is already installed.`);
            return;
        }

        const config = loadModuleConfig();

        // Check dependencies
        for (const dep of manifest.dependencies) {
            if (!dep.optional) {
                const depInstalled = installedModules.some(m => m.id === dep.module_id);
                const depConfig = config[dep.module_id];

                if (!depInstalled || !depConfig?.enabled) {
                    spinner.fail(`Cannot install '${moduleId}': dependency '${dep.module_id}' is not installed and enabled.`);
                    logInfo(`Try installing the dependency first: ez-tauri modules install ${dep.module_id}`);
                    return;
                }
            }
        }

        // Copy module files
        copyModuleFiles(moduleId);

        // Add to config as enabled
        if (!config[moduleId]) {
            config[moduleId] = { module_id: moduleId, enabled: false, config: {}, dependency_overrides: {} };
        }
        config[moduleId].enabled = true;

        // Update build files
        const enabledModules = Object.keys(config).filter(id => config[id].enabled);
        updateCargoToml(enabledModules);
        updateModExports(enabledModules);
        createModulesModFile(enabledModules);

        if (saveModuleConfig(config)) {
            spinner.succeed(`Installed and enabled module '${manifest.name}' (${moduleId})`);
            logInfo('Run your build command to compile with the new module.');
        } else {
            spinner.fail('Failed to save module configuration');
        }
    } catch (error) {
        spinner.fail(`Failed to install module '${moduleId}': ${error.message}`);
    }
}

export function uninstallModule(moduleId) {
    const spinner = ora(`Uninstalling module '${moduleId}'...`).start();

    try {
        const manifest = loadModuleManifest(moduleId);
        if (!manifest) {
            spinner.fail(`Module '${moduleId}' not found.`);
            return;
        }

        const installedModules = getInstalledModules();
        if (!installedModules.some(m => m.id === moduleId)) {
            spinner.warn(`Module '${moduleId}' is not installed.`);
            return;
        }

        if (!manifest.can_disable) {
            spinner.fail(`Module '${moduleId}' cannot be uninstalled (core module).`);
            return;
        }

        const config = loadModuleConfig();
        const modules = getAvailableModules();

        // Check if other modules depend on this one
        for (const { id, manifest: otherManifest } of modules) {
            const otherConfig = config[id];
            if (otherConfig?.enabled && installedModules.some(m => m.id === id)) {
                for (const dep of otherManifest.dependencies) {
                    if (!dep.optional && dep.module_id === moduleId) {
                        spinner.fail(`Cannot uninstall '${moduleId}': module '${id}' depends on it.`);
                        logInfo(`Uninstall '${id}' first, or make the dependency optional.`);
                        return;
                    }
                }
            }
        }

        // Remove module files
        removeModuleFiles(moduleId);

        // Remove from config
        if (config[moduleId]) {
            delete config[moduleId];
        }

        // Update build files
        const enabledModules = Object.keys(config).filter(id => config[id].enabled);
        updateCargoToml(enabledModules);
        updateModExports(enabledModules);
        createModulesModFile(enabledModules);

        if (saveModuleConfig(config)) {
            spinner.succeed(`Uninstalled module '${manifest.name}' (${moduleId})`);
            logInfo('Run your build command to compile without the module.');
        } else {
            spinner.fail('Failed to save module configuration');
        }
    } catch (error) {
        spinner.fail(`Failed to uninstall module '${moduleId}': ${error.message}`);
    }
}

export function showModuleInfo(moduleId) {
    const manifest = loadModuleManifest(moduleId);
    if (!manifest) {
        logError(`Module '${moduleId}' not found.`);
        return;
    }

    const config = loadModuleConfig();
    const moduleConfig = config[moduleId];
    const installedModules = getInstalledModules();
    const installed = installedModules.some(m => m.id === moduleId);

    console.log(chalk.bold(`${manifest.name} (${moduleId})`));
    console.log(`Description: ${manifest.description}`);
    console.log(`Version: ${manifest.version}`);
    console.log(`Category: ${manifest.category}`);
    console.log(`Authors: ${manifest.authors.join(', ')}`);
    console.log(`License: ${manifest.license}`);
    console.log(`Can disable: ${manifest.can_disable ? 'Yes' : 'No'}`);

    let status = 'AVAILABLE';
    if (moduleConfig?.enabled && installed) {
        status = chalk.green('ENABLED');
    } else if (installed) {
        status = chalk.blue('INSTALLED');
    } else {
        status = chalk.gray('AVAILABLE');
    }
    console.log(`Status: ${status}`);

    if (manifest.dependencies.length > 0) {
        console.log('\nDependencies:');
        for (const dep of manifest.dependencies) {
            const optional = dep.optional ? ' (optional)' : '';
            console.log(`  - ${dep.module_id} ${dep.version_req}${optional}`);
        }
    }

    if (manifest.commands.length > 0) {
        console.log('\nProvided commands:');
        for (const cmd of manifest.commands) {
            console.log(`  - ${cmd}`);
        }
    }

    if (Object.keys(manifest.config_schema).length > 0) {
        console.log('\nConfiguration schema:');
        for (const [key, schema] of Object.entries(manifest.config_schema)) {
            const currentValue = moduleConfig?.config[key];
            const defaultValue = schema.default !== undefined ? ` (default: ${schema.default})` : '';
            const required = schema.required ? ' *' : '';
            console.log(`  - ${key}: ${schema.field_type}${required}${defaultValue}`);
            console.log(`    ${schema.description}`);
            if (currentValue !== undefined) {
                console.log(`    Current value: ${currentValue}`);
            }
        }
    }

    console.log(`\nTags: ${manifest.tags.join(', ')}`);
}

export function configureModule(moduleId, key, value) {
    const manifest = loadModuleManifest(moduleId);
    if (!manifest) {
        logError(`Module '${moduleId}' not found.`);
        return;
    }

    const installedModules = getInstalledModules();
    if (!installedModules.some(m => m.id === moduleId)) {
        logError(`Module '${moduleId}' is not installed. Install it first with: ez-tauri modules install ${moduleId}`);
        return;
    }

    const config = loadModuleConfig();

    if (!config[moduleId]) {
        config[moduleId] = { module_id: moduleId, enabled: false, config: {}, dependency_overrides: {} };
    }

    // Validate configuration key exists in schema
    if (!manifest.config_schema[key]) {
        logError(`Configuration key '${key}' is not valid for module '${moduleId}'.`);
        logInfo(`Available keys: ${Object.keys(manifest.config_schema).join(', ')}`);
        return;
    }

    const schema = manifest.config_schema[key];
    let parsedValue = value;

    // Parse value based on type
    try {
        switch (schema.field_type) {
            case 'boolean':
                parsedValue = value.toLowerCase() === 'true';
                break;
            case 'number':
                parsedValue = parseFloat(value);
                if (isNaN(parsedValue)) {
                    throw new Error('Invalid number');
                }
                break;
            case 'string':
                parsedValue = value;
                break;
            default:
                parsedValue = value;
        }
    } catch (error) {
        logError(`Invalid value for '${key}': expected ${schema.field_type}`);
        return;
    }

    config[moduleId].config[key] = parsedValue;

    if (saveModuleConfig(config)) {
        logSuccess(`Set ${moduleId}.${key} = ${parsedValue}`);
    }
}

export function syncModules() {
    const spinner = ora('Syncing module configuration...').start();

    try {
        const config = loadModuleConfig();
        const enabledModules = Object.keys(config).filter(id => config[id].enabled);

        updateCargoToml(enabledModules);
        updateModExports(enabledModules);
        createModulesModFile(enabledModules);

        spinner.succeed('Module sync completed.');
        logInfo('Run your build command to compile with current module configuration.');
    } catch (error) {
        spinner.fail(`Failed to sync modules: ${error.message}`);
    }
}