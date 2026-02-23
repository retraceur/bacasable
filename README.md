# bacÀsable

Instantly start a Retraceur development environment in Node.js with WebAssembly PHP and SQLite.

[![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](https://www.gnu.org/licenses/gpl-2.0)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

## Installation

```bash
git clone https://github.com/retraceur/bacasable.git
cd bacasable
npm install
```

### Build bacÀsable

```bash
# Build
npm run build
```

### Use Your Local Version

```bash
# In your bacasable clone repository
npm link

# Now usable anywhere
cd ~/projects/my-plugin
bacasable start
```

## Quick Start

```bash
# In a plugin directory
cd my-retraceur-plugin
bacasable start

# In a theme directory
cd my-retraceur-theme
bacasable start --php=8.3

# With a specific Retraceur version
bacasable start --retraceur=2.0.1

# In a complete Retraceur installation
cd ~/projects/retraceur/coeur
bacasable start
```

## Available Options

|Option                 |Description                     |Default          |
|-----------------------|--------------------------------|-----------------|
|`--path=<path>`        |Project path                    |Current directory|
|`--php=<version>`      |PHP version (8.0, 8.1, 8.2, 8.3)|`8.0`            |
|`--port=<port>`        |Server port                     |`8881`           |
|`--retraceur=<version>`|Retraceur version               |`latest`         |
|`--core`               |Alias for core development      |-                |

### Examples

```bash
# Custom port
bacasable start --port=3000

# PHP 8.3 with Retraceur 2.0.1
bacasable start --php=8.3 --retraceur=2.0.1

# Plugin development with specific path
bacasable start --path=~/projects/my-plugin
```

## Automatic Mode Detection

bacasable automatically detects your project type:

### 🔌 Plugin

Plugin development (detects `Plugin Name:` in PHP header)

```bash
cd my-plugin
bacasable start
# → Mounts plugin in wp-content/plugins
```

### 🎨 Theme

Block theme development (detects `style.css` with `Theme Name:`)

```bash
cd my-theme
bacasable start
# → Mounts theme in wp-content/themes
```

### 📁 wp-content

Development with multiple plugins and themes

```bash
cd my-wp-content
bacasable start
# → Uses the entire wp-content directory
```

### 🏠 retraceur

Complete local Retraceur installation

```bash
cd ~/retraceur/coeur
bacasable start
# → Uses local installation (no download)
```

## What is Retraceur?

[Retraceur](https://github.com/retraceur/coeur) is a WP fork focused on personal publishing:

- ✅ No dependency on wordpress.org
- ✅ Libravatar instead of Gravatar
- ✅ OpenMojis integrated
- ✅ Block Editor required
- ✅ Block themes only
- ✅ Multisite available via plugin
- ✅ Comments available via plugin

Learn more: [github.com/retraceur/coeur](https://github.com/retraceur/coeur)

## Features

### ⚡ Instant Start

- No Docker, Apache, or MySQL required
- PHP in WebAssembly via Node.js
- SQLite as database
- Start in seconds

### 🎯 Multi-Mode

- Automatic project type detection
- Supports plugin, theme, wp-content, full installation
- Mode-specific optimizations

### 🛠️ Multiple PHP Versions

- Supports PHP 8.0, 8.1, 8.2, 8.3
- Switch versions easily
- Test your code compatibility

## Credits

bacasable is based on [wp-now](https://github.com/WordPress/playground-tools/tree/trunk/packages/wp-now), developed by the WP Playground team.

Thanks to the WP Playground team for:

- **@php-wasm/node** and **@php-wasm/universal**: PHP in WebAssembly
- **WP Playground**: Virtualization infrastructure
- **wp-now**: Concept and base architecture

Without their innovative work, bacasable would not be possible.

## Supported Retraceur Versions

- `latest` → `trunk` (latest development version)
- `trunk` → Main development branch
- `2.0.1` → Stable release
- `2.0.0` → Previous release

See all available versions: [Retraceur Releases](https://github.com/retraceur/coeur/releases)

## Compatibility

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Systems**: macOS, Linux, Windows (WSL recommended)

## Known Limitations

- 📝 No support for old Retraceur versions (< 2.0.0)
- 🔌 Plugins requiring system dependencies may not work
- 🌐 No native multisite support

## Contributing

Contributions are welcome! Here’s how to contribute:

1. **Fork** the project
1. **Create a branch**: `git checkout -b feature/my-feature`
1. **Commit**: `git commit -m 'Add: My feature'`
1. **Push**: `git push origin feature/my-feature`
1. **Pull Request**: Open a PR on GitHub

## Authors

- **Retraceur Community** - Adaptation for Retraceur
- **WP Playground Team** - Original wp-now project

## Links

- [Retraceur Website](https://retraceur.github.io/)
- [Retraceur Core](https://github.com/retraceur/coeur)
- [WordPress Playground](https://wordpress.github.io/wordpress-playground/)
- [Original wp-now](https://github.com/WordPress/playground-tools/tree/trunk/packages/wp-now)

-----

**Made with ❤️ by the Retraceur community**