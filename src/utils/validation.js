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
    execSync('rustc --version', { stdio: 'ignore' });
  } catch {
    missing.push('Rust (install from https://rustup.rs/)');
  }

  // Check Cargo
  try {
    execSync('cargo --version', { stdio: 'ignore' });
  } catch {
    missing.push('Cargo (comes with Rust)');
  }

  return {
    valid: missing.length === 0,
    missing
  };
}