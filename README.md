# bacÀsable

Instantly start a Retraceur development environment in Node.js with WebAssembly PHP and SQLite.

[![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](https://www.gnu.org/licenses/gpl-2.0)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)

## Installation

```bash
git clone https://github.com/retraceur/bacasable.git
cd bacasable
npm install
```

### Build bacÀsable

```bash
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

| Option | Description | Default |
|--------|-------------|---------|
| `--path=<path>` | Project path | Current directory |
| `--php=<version>` | PHP version (8.0, 8.1, 8.2, 8.3) | `8.3` |
| `--port=<port>` | Server port | `8881` |
| `--retraceur=<version>` | Retraceur version | `latest` |
| `--mode=<mode>` | Force a mode (plugin\|theme\|wp-content\|retraceur) | Auto-detected |

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
- PHP in WebAssembly via Node.js powered by [WP Playground](https://wordpress.github.io/wordpress-playground/)
- SQLite as database
- Start in seconds

### 🎯 Multi-Mode

- Automatic project type detection
- Supports plugin, theme, wp-content, full installation
- Mode-specific optimizations

### 👥 Multi-Worker

- 6 PHP workers running in parallel
- Better performance than single-instance solutions
- Handles concurrent requests efficiently

### 🛠️ Multiple PHP Versions

- Supports PHP 8.0, 8.1, 8.2, 8.3
- Switch versions easily
- Test your code compatibility

### 💾 Persistent Storage

- SQLite database stored locally in your project
- Data persists between sessions
- No data loss on restart

## Architecture

```
bacasable/
├── src/
│   ├── main.ts                  # CLI entry point + startBacasable()
│   ├── download.ts              # Retraceur download & caching
│   ├── retraceur-versions.ts    # Version management
│   ├── constants.ts             # Global constants
│   ├── output.ts                # Logging utilities
│   ├── port-finder.ts           # Port management
│   ├── get-bacasable-path.ts    # Cache path utilities
│   ├── get-bacasable-tmp-path.ts
│   ├── get-retraceur-versions-path.ts
│   ├── github-codespaces.ts     # GitHub Codespaces support
│   ├── index.ts                 # Public API exports
│   └── utils/                   # Detection utilities
│       ├── is-retraceur-directory.ts
│       ├── is-plugin-directory.ts
│       ├── is-theme-directory.ts
│       ├── is-wp-content-directory.ts
│       ├── get-plugin-file.ts
│       └── read-file-head.ts
├── build/                       # Compiled output
└── esbuild.mjs                  # Build configuration
```

## Technologies

- **Node.js** >= 22: JavaScript runtime
- **TypeScript**: Typed language
- **esbuild**: Ultra-fast bundler
- **@wp-playground/cli**: WP Playground CLI (WebAssembly PHP engine)
- **SQLite**: Lightweight database (managed by Playground)

## Supported Retraceur Versions

- `latest` → Latest stable release
- `trunk` → Main development branch
- `3.2.0` → Stable release
- `3.1.0` → Previous release
- `3.0.0` → Previous release
- `2.0.1` → Previous release
- `2.0.0` → Previous release

See all available versions: [Retraceur Releases](https://github.com/retraceur/coeur/releases)

## Compatibility

- **Node.js**: >= 22.0.0
- **npm**: >= 9.0.0
- **Systems**: macOS, Linux, Windows (WSL recommended)

## Known Limitations

- 📝 No support for old Retraceur versions (< 2.0.0)
- 🔌 Plugins requiring system dependencies may not work
- 🌐 No native multisite support
- 🔍 No xdebug support (PHP WebAssembly limitation)

## Roadmap

### v1.1.0
- [ ] Blueprint support (`--blueprint=<file>`)
- [ ] Auto-update URL in database on port change
- [ ] Automated tests

### v2.0.0
- [ ] Proxy support
- [ ] Hot reload
- [ ] Web UI for managing instances

## Contributing

Contributions are welcome! Here's how to contribute:

1. **Fork** the project
2. **Create a branch**: `git checkout -b feature/my-feature`
3. **Commit**: `git commit -m 'Add: My feature'`
4. **Push**: `git push origin feature/my-feature`
5. **Pull Request**: Open a PR on GitHub

## Support

- 🐛 [GitHub Issues](https://github.com/retraceur/bacasable/issues)
- 💬 [Discussions](https://github.com/retraceur/bacasable/discussions)

## Authors

- **Retraceur Community** - Adaptation for Retraceur
- **WP Playground Team** - WP Playground & original wp-now project

## Links

- [Retraceur Website](https://retraceur.github.io/)
- [Retraceur Core](https://github.com/retraceur/coeur)
- [WP Playground](https://wordpress.github.io/wordpress-playground/)
