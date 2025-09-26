import { execSync } from 'child_process';
import fs from 'fs-extra';

export function validateProjectName(name) {
  if (!name) {
    return { valid: false, message: 'Project name is required' };
  }

  if (name.length > 214) {
    return { valid: false, message: 'Project name must be less than 214 characters' };
  }

  if (!/^[a-z0-9-_]+$/.test(name)) {
    return { valid: false, message: 'Project name can only contain lowercase letters, numbers, hyphens, and underscores' };
  }

  if (fs.existsSync(name)) {
    return { valid: false, message: `Directory "${name}" already exists` };
  }

  return { valid: true };
}

export async function checkPrerequisites() {
  const missing = [];
  const warnings = [];

  // Check Node.js
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    if (majorVersion < 18) {
      missing.push('Node.js 18+ (current: ' + nodeVersion + ')');
    }
  } catch {
    missing.push('Node.js 18+');
  }

  // Check Rust
  try {
    const rustVersion = execSync('rustc --version', { encoding: 'utf-8' }).trim();
    const versionMatch = rustVersion.match(/rustc (\d+)\.(\d+)\.(\d+)/);
    if (versionMatch) {
      const [, major, minor] = versionMatch.map(Number);
      if (major < 1 || (major === 1 && minor < 70)) {
        warnings.push(`Rust 1.70+ recommended (current: ${rustVersion.split(' ')[1]})`);
      }
    }
  } catch {
    missing.push('Rust (install from https://rustup.rs/)');
  }

  // Check Cargo
  try {
    execSync('cargo --version', { stdio: 'ignore' });
  } catch {
    missing.push('Cargo (comes with Rust)');
  }

  // Check for package managers
  const packageManagers = [];
  try {
    execSync('npm --version', { stdio: 'ignore' });
    packageManagers.push('npm');
  } catch {}

  try {
    execSync('yarn --version', { stdio: 'ignore' });
    packageManagers.push('yarn');
  } catch {}

  try {
    execSync('pnpm --version', { stdio: 'ignore' });
    packageManagers.push('pnpm');
  } catch {}

  if (packageManagers.length === 0) {
    missing.push('Package manager (npm comes with Node.js)');
  }

  // Platform-specific checks
  const platform = process.platform;
  if (platform === 'linux') {
    try {
      execSync('pkg-config --exists webkit2gtk-4.0', { stdio: 'ignore' });
    } catch {
      warnings.push('WebKit2GTK development packages may be needed on Linux');
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
    packageManagers
  };
}