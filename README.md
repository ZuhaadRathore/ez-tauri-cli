# EZ Tauri CLI

A command-line tool for rapidly scaffolding production-ready Tauri desktop applications with React and TypeScript.

## Overview

EZ Tauri CLI streamlines the creation of cross-platform desktop applications by providing pre-configured templates that eliminate boilerplate setup. Generate a fully functional Tauri + React application with a single command, complete with development tooling, testing infrastructure, and production build pipelines.

## Installation

### Global Installation (Recommended)

```bash
npm install -g ez-tauri-cli
```

### Alternative Package Managers

```bash
# Using Yarn
yarn global add ez-tauri-cli

# Using pnpm
pnpm add -g ez-tauri-cli
```

### Verify Installation

```bash
ez-tauri --version
```

## Quick Start

Create and launch a new Tauri application in under a minute:

```bash
# Create new project with interactive prompts
ez-tauri create my-desktop-app

# Navigate to project and start development
cd my-desktop-app
npm run dev
```

## Usage

### Create New Project

#### Interactive Mode

```bash
ez-tauri create my-app
```

The CLI will guide you through:
- Template selection
- Package manager preference
- Optional features configuration
- Git repository initialization

#### Non-Interactive Mode

```bash
# Create with specific options
ez-tauri create my-app --template minimal --package-manager yarn

# Skip all automatic setup
ez-tauri create my-app --no-install --no-git
```

### Available Templates

| Template | Description | Included Features |
|----------|-------------|-------------------|
| **full** | Complete application boilerplate | React, TypeScript, Tailwind, Database, Testing, CI/CD, Auto-updates |
| **minimal** | Essential Tauri + React setup | React, TypeScript, Basic styling, Hot reload |
| **database** | Data-driven application starter | PostgreSQL, SQLx, Migrations, Docker, Connection pooling |

### Command Line Options

```
ez-tauri create <project-name> [options]

Arguments:
  project-name              Name of your new project

Options:
  -t, --template <type>     Project template (choices: "minimal", "full", "database")
                           Default: "full"
  
  -pm, --package-manager    Package manager to use (choices: "npm", "yarn", "pnpm")
                           Default: "npm"
  
  --no-install             Skip dependency installation
  --no-git                 Skip Git repository initialization
  --verbose                Show detailed output during creation
  -h, --help              Display help information
  -v, --version           Display version number
```

## Project Features

### Core Technologies

Each generated project includes:

| Category | Technologies |
|----------|-------------|
| **Frontend Framework** | React 18 with TypeScript |
| **Styling** | Tailwind CSS with automatic dark mode |
| **State Management** | Zustand for global state |
| **Routing** | React Router v6 |
| **Desktop Runtime** | Tauri v2.1 (Rust-based) |
| **Build Tools** | Vite 5 for fast development |

### Development Features

- **Hot Module Replacement**: Instant frontend updates
- **Backend Hot Reload**: Automatic Rust recompilation
- **Type Safety**: Full TypeScript coverage with Rust type generation
- **Code Quality**: Pre-configured ESLint and Prettier
- **Testing Setup**: Vitest for unit tests, WebdriverIO for E2E
- **Git Hooks**: Husky for pre-commit validation

### Production Capabilities

- **Multi-platform Builds**: Windows (.msi), macOS (.dmg), Linux (.deb/.AppImage)
- **Optimized Bundles**: ~8MB final application size
- **Auto-updates**: Enhanced update mechanism with rollback support
- **Code Signing**: Simplified certificate signing workflow
- **CI/CD Pipelines**: GitHub Actions workflows with enhanced caching

## System Requirements

### Prerequisites

The CLI will check for required dependencies and provide installation instructions if needed:

| Requirement | Minimum Version | Installation Guide |
|-------------|----------------|-------------------|
| Node.js | 18.0.0 | [nodejs.org](https://nodejs.org/) |
| Rust | 1.75.0 | [rustup.rs](https://rustup.rs/) |
| Docker | 20.10 | Required for database template only |

### Platform-Specific Dependencies

The CLI automatically detects your operating system and provides relevant setup instructions:

- **Windows**: Visual Studio Build Tools, WebView2
- **macOS**: Xcode Command Line Tools
- **Linux**: WebKit2GTK, libappindicator

## Examples

### Basic Project Creation

```bash
# Default full-featured template
ez-tauri create my-app

# Minimal template for simple applications
ez-tauri create simple-tool --template minimal
```

### Advanced Configurations

```bash
# Database-driven application with PostgreSQL
ez-tauri create data-app --template database

# Using Yarn with minimal template
ez-tauri create fast-app --template minimal --package-manager yarn

# Create without running installations (CI/CD usage)
ez-tauri create ci-app --no-install --no-git
```

### Continuous Integration

```bash
# Example for CI pipeline
ez-tauri create app-name --no-install --no-git
cd app-name
npm ci
npm run build
npm run tauri:build
```

## Version 1.2 Features

**New in v1.2:**
- Enhanced auto-update system with rollback capabilities
- Improved bundle optimization (8MB vs 10MB)
- Better error handling and recovery
- Enhanced CI/CD pipelines with dependency caching
- Streamlined code signing workflow

**Additional Features:**

```bash
# Initialize Tauri in existing React project
ez-tauri init

# Module management
ez-tauri modules list                    # List all available modules
ez-tauri modules install database       # Install PostgreSQL integration
ez-tauri modules install testing        # Install test infrastructure
ez-tauri modules install auth           # Install authentication
ez-tauri modules install updater        # Install auto-update capability
ez-tauri modules uninstall <module-id>  # Remove a module
ez-tauri modules info <module-id>       # Show module information
ez-tauri modules config <module-id> <key> <value>  # Configure module
ez-tauri modules sync                    # Sync module configuration

# Project management
ez-tauri doctor                         # Diagnose setup issues
```

## Configuration

### Global CLI Configuration

```bash
# Set default preferences
ez-tauri config set package-manager yarn
ez-tauri config set template minimal
ez-tauri config get package-manager
```

### Project Configuration

Generated projects include a `.ez-tauri.json` configuration file for project-specific settings:

```json
{
  "version": "1.2.0",
  "template": "full",
  "features": ["database", "testing", "auto-update"],
  "packageManager": "npm"
}
```

## Troubleshooting

### Common Issues

**Installation fails on Windows**
```bash
# Run as Administrator
npm install -g ez-tauri-cli --force
```

**Rust not found**
```bash
# Install Rust via rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Permission denied on macOS/Linux**
```bash
# Use sudo or fix npm permissions
sudo npm install -g ez-tauri-cli
```

### Diagnostic Tools

```bash
# Check system compatibility
ez-tauri doctor

# Verbose output for debugging
ez-tauri create my-app --verbose

# Clear CLI cache
ez-tauri cache clean
```

## Contributing

We welcome contributions to improve the CLI tool. See our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/tavuc/ez-tauri-cli.git
cd ez-tauri-cli

# Install dependencies
npm install

# Link for local testing
npm link

# Run tests
npm test
```

## Support

- **Documentation**: [Full Documentation](https://github.com/tavuc/ez-tauri-cli/wiki)
- **Issue Tracker**: [Report Bugs](https://github.com/tavuc/ez-tauri-cli/issues)
- **Discussions**: [Community Forum](https://github.com/tavuc/ez-tauri-cli/discussions)
- **Discord**: [Join our Discord](https://discord.gg/ez-tauri)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built to accelerate desktop application development with modern web technologies.